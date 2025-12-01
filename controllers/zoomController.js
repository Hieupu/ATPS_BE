const crypto = require("crypto");
const axios = require("axios")
const attendanceService = require("../services/attendanceService");
const { use } = require("passport");
const { start } = require("repl");
const { time } = require("console");

let zoomCache = [];

const cleanupZoomCache = () => {
  const now = Date.now();
  const TWO_HOURS = 140 * 60 * 1000;

  const beforeCount = zoomCache.length;

  zoomCache = zoomCache.filter(item => {
    return (now - item.cachedAt) < TWO_HOURS;
  });

  if (beforeCount !== zoomCache.length) {
    console.log(`Đã dọn ${beforeCount - zoomCache.length} bản ghi cũ khỏi zoomCache. Còn lại: ${zoomCache.length}`);
  }
};

setInterval(cleanupZoomCache, 15 * 60 * 1000);
cleanupZoomCache();

class ZoomController {
  // POST /api/zoom/signature
  async generateSignature(req, res) {
    try {
      const { meetingNumber, role } = req.body;

      if (!meetingNumber || role === undefined) {
        return res
          .status(400)
          .json({ error: "Missing meetingNumber or role" });
      }

       const apiKey = process.env.ZOOM_SDK_KEY;
    const apiSecret = process.env.ZOOM_SDK_SECRET;

      if (!apiKey || !apiSecret) {
      return res.status(500).json({ 
        error: "Zoom configuration missing" 
      });
    }

      const iat = Math.floor(Date.now() / 1000); // timestamp hiện tại (giây)
      const exp = iat + 60 * 60 * 2; // 2h hợp lệ

      const oHeader = { alg: "HS256", typ: "JWT" };
      const oPayload = {
        sdkKey: apiKey,
        mn: meetingNumber,
        role,
        iat,
        exp,
        appKey: apiKey,
        tokenExp: exp,
      };

      const base64url = (source) => {
        let encoded = Buffer.from(JSON.stringify(source))
          .toString("base64")
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
        return encoded;
      };

      const header = base64url(oHeader);
      const payload = base64url(oPayload);

      const signature = crypto
        .createHmac("sha256", apiSecret)
        .update(header + "." + payload)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      res.json({
        signature: `${header}.${payload}.${signature}`,
        sdkKey: apiKey,
        meetingNumber,
        role,
        iat,
        exp,
      });
    } catch (err) {
      console.error("❌ Zoom signature error:", err);
      res.status(500).json({ error: "Failed to generate signature" });
    }
  }

  // POST /api/zoom/webhook
  async zoomRes(req, res) {
  console.log("========= 🔔 ZOOM WEBHOOK RECEIVED 🔔 =========");
  console.log("Full body:", JSON.stringify(req.body, null, 2));
  if (req.body.accId && req.body.sessionId) {

  const existing = zoomCache.findIndex(z => z.sessionId === req.body.sessionId && z.userName === req.body.userName);

  const newEntry = {
    accId: req.body.accId,
    sessionId: req.body.sessionId,
    userName: req.body.userName,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    date: req.body.date,
    cachedAt: Date.now()
  };

  if (existing !== -1) {
    zoomCache[existing] = newEntry;
  } else {
    zoomCache.push(newEntry);
  }
}
  try {
    const event = req.body.event;
    const data  = req.body.payload?.object;

    // URL VALIDATION
    if (event === "endpoint.url_validation") {

      const plainToken = req.body.payload.plainToken;
      const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET;

      const hash = crypto
        .createHmac("sha256", webhookSecret)
        .update(plainToken)
        .digest("hex");

      return res.json({
        plainToken,
        encryptedToken: hash,
      });
    }

    // PARTICIPANT JOINED
    if (event === "meeting.participant_joined") {

      const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`;
    const authHeader = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");

    const response = await axios.post(tokenUrl, null, {
      headers: { Authorization: `Basic ${authHeader}` },
    });
    console.log( response.data.access_token);


      const userName   = data.participant?.user_name;
      const joinTime   = data.participant?.join_time;

      const parseData = zoomCache.find(z => z.userName === userName);

      const attend = await attendanceService.attendanceLogic(parseData?.accId, parseData?.startTime, parseData?.endTime,      
      parseData?.date, parseData?.sessionId, joinTime, "join");
      console.log("📌 Attendance result:", attend);

      return res.status(200).json({ success: true, join: attend });
    }

    // PARTICIPANT LEFT
    if (event === "meeting.participant_left") {

      const userName   = data.participant?.user_name;
      const leaveTime  = data.participant?.leave_time;

      const parseData = zoomCache.find(z => z.userName === userName);
      const attend = await attendanceService.attendanceLogic(parseData?.accId, parseData?.startTime, parseData?.endTime,      
      parseData?.date, parseData?.sessionId, leaveTime, "leave");

      console.log("Attendance result:", attend);

      return res.status(200).json({ success: true, leave: attend });
    }

    // DEFAULT – ignored events
    console.log("Event ignored:", event);
    res.status(200).send("ignored");

  } catch (error) {
    console.error("Auto attendance error:", error?.response?.data || error);
    res.status(500).json({ message: "Failed to take attendance" });
  }
}

}

module.exports = new ZoomController();