const mysql = require("mysql2/promise");
require("dotenv").config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  timezone: "+07:00", 
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully with connection pool");
    connection.release();
  } catch (error) {
    console.error("MySQL connection failed: ", error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;
