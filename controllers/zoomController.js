const crypto = require("crypto");

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
        // Encode string → base64url
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
}

module.exports = new ZoomController();
