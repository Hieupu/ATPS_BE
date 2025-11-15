const crypto = require('crypto');

class ZoomController {
generateSignature(req, res) {
  try {
    const { meetingNumber, role = 1 } = req.body;

    console.log("🔑 Generating signature for meeting:", meetingNumber, "role:", role);
    
    if (!meetingNumber) {
      return res.status(400).json({ error: 'Missing meetingNumber' });
    }

    const apiKey = process.env.ZOOM_SDK_KEY || 'k9oCjCj9RqmL4Dk7kQXnSw';
    const apiSecret = process.env.ZOOM_SDK_SECRET || 'Cev2501759Xq25zuqvtSgUb7zjQKM9ND';

    // Timestamp tính bằng giây
    const timestamp = Math.floor(Date.now() / 1000) - 30;
    
    // Tạo message để hash
    const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64');
    const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64');
    const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

    console.log("✅ Signature generated successfully");
    console.log("API Key:", apiKey);
    console.log("Meeting Number:", meetingNumber);
    console.log("Timestamp (seconds):", timestamp);
    console.log("Role:", role);
    console.log("Signature length:", signature.length);
    console.log("Full signature:", signature); // QUAN TRỌNG: Log full signature

    res.json({
      signature: signature,
      sdkKey: apiKey,
      meetingNumber: meetingNumber,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('❌ Zoom signature error:', error);
    res.status(500).json({ error: 'Failed to generate signature: ' + error.message });
  }
}
}

module.exports = new ZoomController();