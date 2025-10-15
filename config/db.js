const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

const connectDB = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
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
