const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");
require("dotenv").config();

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy AccID từ token (token có thể dùng id, AccID, hoặc accID)
    const tokenAccID = decoded.AccID || decoded.accID || decoded.id;

    if (!tokenAccID) {
      return res.status(401).json({
        message: "Token không chứa thông tin account",
      });
    }

    // Validate AccID từ token có tồn tại trong database không
    const db = await connectDB();
    const [accountRows] = await db.execute(
      `SELECT AccID, Status FROM account WHERE AccID = ?`,
      [tokenAccID]
    );

    if (accountRows.length === 0) {
      return res.status(401).json({
        message: "Account không tồn tại trong hệ thống",
      });
    }

    if (accountRows[0].Status !== "active") {
      return res.status(401).json({
        message: "Account đã bị vô hiệu hóa",
      });
    }

    // Map role thành features (nếu cần)
    const role = decoded.role || "";
    const features = [];
    if (role === "admin") features.push("admin");
    if (role === "instructor") features.push("instructor");
    if (role === "learner") features.push("learner");
    if (role === "staff") features.push("staff");

    // Set req.user với AccID đã được validate từ database
    req.user = {
      ...decoded,
      AccID: accountRows[0].AccID, // Đảm bảo AccID từ database (không dùng từ token)
      features: features, // Map từ role
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    console.error("[verifyToken] Error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xác thực" });
  }
};

const authorizeFeature = (featureName) => (req, res, next) => {
  const userFeatures = req.user?.features || [];

  if (!userFeatures.includes(featureName)) {
    return res
      .status(403)
      .json({ message: "Access denied: missing feature permission" });
  }

  next();
};

module.exports = {
  verifyToken,
  authorizeFeature,
};
