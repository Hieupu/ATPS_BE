const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

let pool;

const connectDB = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: "Z",
        dateStrings: true,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        //timezone: "+07:00",
        ssl: {
          ca: fs.readFileSync("./config/ca.pem"),
        },
      });

      const connection = await pool.getConnection();
      connection.release();
      console.log("✅ MySQL connected successfully (pool + SSL)");
    } catch (error) {
      console.error("❌ MySQL connection failed:", error.message);
      process.exit(1);
    }
  }
  return pool;
};

module.exports = connectDB;
