// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(403).json({ message: "No token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// const authorizeFeature = (featureName) => (req, res, next) => {
//   const userFeatures = req.user?.features || [];

//   if (!userFeatures.includes(featureName)) {
//     return res
//       .status(403)
//       .json({ message: "Access denied: missing feature permission" });
//   }

//   next();
// };

// const authorizeRole = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !req.user.role) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const { role } = req.user;
//     if (!allowedRoles.includes(role)) {
//       return res.status(403).json({
//         message: `Access denied. Requires role: ${allowedRoles.join(" or ")}`,
//       });
//     }

//     next();
//   };
// };

// module.exports = {
//   verifyToken,
//   authorizeFeature,
//   authorizeRole,
// };
const jwt = require("jsonwebtoken");
const connectDB = require("../config/db");
require("dotenv").config();

/**
 * Middleware xác thực JWT token và validate với database
 * - Verify JWT signature
 * - Kiểm tra AccID có tồn tại trong DB
 * - Kiểm tra Status của account
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    // 1. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Lấy AccID từ token
    const tokenAccID = decoded.AccID || decoded.accID || decoded.id;

    if (!tokenAccID) {
      return res.status(401).json({
        message: "Token không chứa thông tin account",
      });
    }

    // 3. Validate AccID với database
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

    // 4. Map role thành features
    const role = decoded.role || "";
    const features = [];
    if (role === "admin") features.push("admin");
    if (role === "instructor") features.push("instructor");
    if (role === "learner") features.push("learner");
    if (role === "staff") features.push("staff");

    // 5. Set req.user với dữ liệu đã validate
    req.user = {
      ...decoded,
      AccID: accountRows[0].AccID, // Từ database
      features: features,
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

/**
 * Middleware phân quyền dựa trên features
 * @param {string} featureName - Tên feature cần kiểm tra
 */
// featureName: string hoặc mảng string; cho phép nếu user có ít nhất một feature trong danh sách
const authorizeFeature = (featureName) => (req, res, next) => {
  const userFeatures = req.user?.features || [];
  const required = Array.isArray(featureName) ? featureName : [featureName];

  const hasPermission = required.some((f) => userFeatures.includes(f));

  if (!hasPermission) {
    return res.status(403).json({
      message: `Access denied: missing feature permission '${required.join(
        ","
      )}'`,
    });
  }

  next();
};

/**
 * Middleware phân quyền dựa trên role
 * @param {...string} allowedRoles - Danh sách roles được phép
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized: No role found" });
    }

    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeFeature,
  authorizeRole,
};
