const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
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
