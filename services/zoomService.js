const axios = require("axios");
const classRepository = require("../repositories/classRepository");
const timeslotRepository = require("../repositories/timeslotRepository");

class ZoomService {
  constructor() {
    this.zoomApiBase = "https://api.zoom.us/v2";
    this.requestTimeout = 30000; // 30s timeout
    this.maxConcurrent = 5; // Giới hạn đồng thời khi bulk
  }

  async requestWithRetry(config, retries = 2, backoffMs = 500) {
    let attempt = 0;
    let lastError;
    while (attempt <= retries) {
      try {
        return await axios({
          timeout: this.requestTimeout,
          ...config,
        });
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        // Không retry các lỗi 4xx trừ 429
        if (status && status >= 400 && status < 500 && status !== 429) {
          break;
        }
        if (attempt === retries) break;
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
        attempt += 1;
      }
    }
    throw lastError;
  }

  /**
   * Lấy access token từ Zoom bằng account credentials
   */
  async getZoomAccessToken() {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      console.warn("[zoomService] Missing Zoom env configs");
      return null;
    }

    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    try {
      const response = await this.requestWithRetry({
        url: tokenUrl,
        method: "POST",
        headers: { Authorization: `Basic ${authHeader}` },
      });
      return response.data?.access_token || null;
    } catch (error) {
      console.error(
        "[zoomService] Failed to get access token:",
        error?.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Tạo Zoom occurrence cho 1 session
   * @param {number} classId
   * @param {string} sessionDate - YYYY-MM-DD
   * @param {number} timeslotId
   * @returns {Promise<string|null>} ZoomUUID
   */
  async createZoomOccurrence(classId, sessionDate, timeslotId) {
    const accessToken = await this.getZoomAccessToken();
    if (!accessToken) return null;

    const classRows = await classRepository.findById(classId);
    const classInfo = Array.isArray(classRows) ? classRows[0] : classRows;
    if (!classInfo || !classInfo.ZoomID) {
      console.warn("[zoomService] Missing ZoomID for class", classId);
      return null;
    }

    const timeslot = await timeslotRepository.findById(timeslotId);
    if (!timeslot) {
      console.warn("[zoomService] Timeslot not found", timeslotId);
      return null;
    }

    const startTime = (timeslot.StartTime || "").substring(0, 5);
    const endTime = (timeslot.EndTime || "").substring(0, 5);
    if (!startTime || !endTime) {
      console.warn("[zoomService] Invalid timeslot time", timeslotId);
      return null;
    }

    // Zoom ISO start_time (assume local Asia/Ho_Chi_Minh)
    const startDateTime = `${sessionDate}T${startTime}:00`;
    const durationMinutes = this.calculateDurationMinutes(startTime, endTime);

    try {
      // Add occurrence by updating meeting? Zoom API không hỗ trợ thêm occurrence trực tiếp cho meeting đã tồn tại
      const res = await this.requestWithRetry({
        url: `${this.zoomApiBase}/users/me/meetings`,
        method: "POST",
        data: {
          topic: classInfo.Name || "Class Session",
          type: 2, // scheduled meeting
          start_time: startDateTime,
          duration: durationMinutes || 120,
          timezone: "Asia/Ho_Chi_Minh",
          settings: {
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: false,
            approval_type: 0,
            auto_recording: "cloud",
          },
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Zoom scheduled meeting không có occurrence_id; dùng meeting uuid làm ZoomUUID
      return res.data?.uuid || null;
    } catch (error) {
      console.error(
        "[zoomService] Failed to create occurrence:",
        error?.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Xóa Zoom occurrence (ở đây xóa meeting theo uuid)
   * @param {string} zoomUUID
   * @param {string|number} zoomId (optional) meeting id
   * @returns {Promise<boolean>}
   */
  async deleteZoomOccurrence(zoomUUID, zoomId = null) {
    const accessToken = await this.getZoomAccessToken();
    if (!accessToken) return false;

    if (!zoomUUID && !zoomId) {
      console.warn(
        "[zoomService] Missing zoomUUID/zoomId to delete occurrence"
      );
      return false;
    }

    // Prefer zoomUUID (meeting uuid)
    const targetId = zoomUUID || zoomId;
    try {
      await this.requestWithRetry({
        url: `${this.zoomApiBase}/meetings/${targetId}`,
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return true;
    } catch (error) {
      const zoomData = error?.response?.data;
      const code = zoomData?.code;
      const message = zoomData?.message || error.message;

      // Nếu thiếu scope xóa meeting (code 4711 hoặc thông báo tương tự)
      // → log cảnh báo nhẹ và bỏ qua, không block flow (cho cả admin & staff)
      if (
        code === 4711 ||
        (typeof message === "string" &&
          message.includes("does not contain scopes") &&
          message.includes("meeting:delete"))
      ) {
        console.warn(
          "[zoomService] Skip delete occurrence due to insufficient scopes:",
          zoomData || message
        );
        return false;
      }

      console.error(
        "[zoomService] Failed to delete occurrence:",
        zoomData || message
      );
      return false;
    }
  }

  /**
   * Cập nhật Zoom occurrence: xóa cũ + tạo mới
   * @param {string} oldZoomUUID
   * @param {number} classId
   * @param {string} newDate
   * @param {number} newTimeslotId
   * @returns {Promise<string|null>} ZoomUUID mới
   */
  async updateZoomOccurrence(oldZoomUUID, classId, newDate, newTimeslotId) {
    // Xóa occurrence cũ (best-effort)
    if (oldZoomUUID) {
      await this.deleteZoomOccurrence(oldZoomUUID);
    }
    // Tạo occurrence mới
    return await this.createZoomOccurrence(classId, newDate, newTimeslotId);
  }

  /**
   * Tạo nhiều Zoom occurrences
   * @param {number} classId
   * @param {Array<{date: string, timeslotId: number}>} sessions
   * @returns {Promise<Array<{date, timeslotId, zoomUUID}>>}
   */
  async createBulkZoomOccurrences(classId, sessions = []) {
    const results = [];
    const queue = [...sessions];
    const workers = new Array(Math.min(this.maxConcurrent, queue.length))
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const s = queue.shift();
          const zoomUUID = await this.createZoomOccurrence(
            classId,
            s.date,
            s.timeslotId
          );
          results.push({ ...s, zoomUUID: zoomUUID || null });
        }
      });
    await Promise.all(workers);
    return results;
  }

  /**
   * Tạo Zoom meeting (dùng cho admin refresh ZoomID/Zoompass của lớp)
   * @param {Object} params
   * @param {string} params.topic
   * @param {string} params.start_time - ISO string hoặc 'YYYY-MM-DDTHH:mm:ss'
   * @param {number} params.duration - phút (default 120)
   * @returns {Promise<{id, password, join_url, start_url, uuid} | null>}
   */
  async createZoomMeeting(params = {}) {
    const accessToken = await this.getZoomAccessToken();
    if (!accessToken) return null;

    const {
      topic = "Class Meeting",
      start_time = new Date().toISOString(),
      duration = 120,
    } = params;

    try {
      const res = await this.requestWithRetry({
        url: `${this.zoomApiBase}/users/me/meetings`,
        method: "POST",
        data: {
          topic,
          type: 2,
          start_time,
          duration,
          timezone: "Asia/Ho_Chi_Minh",
          settings: {
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: false,
            approval_type: 0,
            auto_recording: "cloud",
          },
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        id: res.data?.id,
        password: res.data?.password || null,
        join_url: res.data?.join_url || null,
        start_url: res.data?.start_url || null,
        uuid: res.data?.uuid || null,
      };
    } catch (error) {
      console.error(
        "[zoomService] Failed to create Zoom meeting:",
        error?.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Tính phút từ HH:mm
   */
  calculateDurationMinutes(start, end) {
    const [h1, m1] = (start || "").split(":").map(Number);
    const [h2, m2] = (end || "").split(":").map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;
    return h2 * 60 + m2 - (h1 * 60 + m1);
  }
}

module.exports = new ZoomService();
