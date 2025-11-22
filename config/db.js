const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

const connectDB = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 14759,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: "Z", // hoặc '+00:00'
        dateStrings: true, // rất quan trọng!
      });
      console.log("✅ MySQL connected successfully (using pool)");
    } catch (error) {
      console.error("❌ MySQL connection failed:", error.message);
      process.exit(1);
    }
  }
  return pool;
};

module.exports = connectDB;
