const pool = require("../config/db");

/**
 * SessionRepository - dbver5
 *
 * Hỗ trợ trường mới:
 * - ZoomUUID: UUID phòng Zoom cho session
 *
 * Tự động tạo ZoomUUID nếu không được cung cấp.
 */
class SessionRepository {
  // Tạo session mới (dbver5 schema)
  async create(sessionData) {
    const {
      Title,
      Description,
      InstructorID,
      ClassID,
      TimeslotID,
      Date,
      ZoomUUID,
    } = sessionData;

    // dbver5: Hỗ trợ ZoomUUID
    // Nếu không có ZoomUUID, tạo một UUID ngẫu nhiên
    const finalZoomUUID = ZoomUUID || this.generateZoomUUID();

    const query = `
      INSERT INTO session (
        Title, Description, InstructorID, ClassID, TimeslotID, Date, ZoomUUID
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Title,
      Description,
      InstructorID,
      ClassID,
      TimeslotID,
      Date,
      finalZoomUUID,
    ]);

    return result;
  }

  // Helper: Tạo ZoomUUID ngẫu nhiên
  generateZoomUUID() {
    // Tạo UUID đơn giản (có thể thay bằng thư viện uuid nếu cần)
    return `zoom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lấy session theo ID (dbver5 schema - tự động lấy ZoomUUID qua s.*)
  async findById(sessionId) {
    if (!sessionId) {
      throw new Error("SessionID là bắt buộc");
    }
    const query = `
      SELECT 
        s.*,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName,
        i.FullName as InstructorName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE s.SessionID = ?
    `;

    const [rows] = await pool.execute(query, [sessionId]);
    return rows;
  }

  // Lấy tất cả sessions
  async findAll() {
    const query = `
      SELECT 
        s.*,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName,
        i.FullName as InstructorName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      ORDER BY s.Date ASC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  // Lấy sessions theo ClassID
  async findByClassId(classId) {
    const query = `
      SELECT 
        s.*,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName,
        i.FullName as InstructorName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE s.ClassID = ?
      ORDER BY s.Date ASC
    `;

    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }

  // Cập nhật session
  async update(sessionId, updateData) {
    if (!sessionId) {
      throw new Error("SessionID là bắt buộc");
    }
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error("UpdateData không được rỗng");
    }
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);
    values.push(sessionId);

    const query = `
      UPDATE session 
      SET ${fields}
      WHERE SessionID = ?
    `;

    const [result] = await pool.execute(query, values);
    return result;
  }

  // Xóa session
  async delete(sessionId) {
    if (!sessionId) {
      throw new Error("SessionID là bắt buộc");
    }
    const query = `DELETE FROM session WHERE SessionID = ?`;
    const [result] = await pool.execute(query, [sessionId]);
    return result;
  }

  // Tạo nhiều sessions cùng lúc (Bulk Create) - dbver5
  async createBulk(sessionsData) {
    if (!sessionsData || sessionsData.length === 0) {
      return [];
    }

    // Chuẩn bị query bulk insert với ZoomUUID
    const values = sessionsData.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
    const params = sessionsData.flatMap((session) => [
      session.Title,
      session.Description,
      session.InstructorID,
      session.ClassID,
      session.TimeslotID,
      session.Date,
      session.ZoomUUID || this.generateZoomUUID(), // dbver5: Tự động tạo nếu không có
    ]);

    const query = `
      INSERT INTO session (
        Title, Description, InstructorID, ClassID, TimeslotID, Date, ZoomUUID
      ) VALUES ${values}
    `;

    const [result] = await pool.execute(query, params);
    return result;
  }

  // Lấy sessions theo khoảng ngày
  async findByDateRange(startDate, endDate, filters = {}) {
    let query = `
      SELECT 
        s.*,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName,
        i.FullName as InstructorName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE s.Date >= ? AND s.Date <= ?
    `;

    const params = [startDate, endDate];

    // Add optional filters
    if (filters.classId) {
      query += " AND s.ClassID = ?";
      params.push(filters.classId);
    }

    // Support classIds array for filtering multiple classes
    if (
      filters.classIds &&
      Array.isArray(filters.classIds) &&
      filters.classIds.length > 0
    ) {
      const placeholders = filters.classIds.map(() => "?").join(",");
      query += ` AND s.ClassID IN (${placeholders})`;
      params.push(...filters.classIds);
    }

    if (filters.instructorId) {
      query += " AND s.InstructorID = ?";
      params.push(filters.instructorId);
    }

    query += " ORDER BY s.Date ASC, t.StartTime ASC";

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Lấy sessions theo TimeslotID
  async findByTimeslotId(timeslotId) {
    const query = `
      SELECT 
        s.*,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName,
        i.FullName as InstructorName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE s.TimeslotID = ?
      ORDER BY s.Date ASC
    `;

    const [rows] = await pool.execute(query, [timeslotId]);
    return rows;
  }

  // Lấy sessions theo InstructorID và khoảng ngày
  async findByInstructorAndDateRange(instructorId, startDate, endDate) {
    const query = `
      SELECT 
        s.*,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName,
        i.FullName as InstructorName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE s.InstructorID = ? 
        AND s.Date >= ? 
        AND s.Date <= ?
      ORDER BY s.Date ASC, t.StartTime ASC
    `;

    const [rows] = await pool.execute(query, [instructorId, startDate, endDate]);
    return rows;
  }
}

module.exports = new SessionRepository();
