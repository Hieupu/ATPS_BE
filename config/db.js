const mysql = require("mysql2/promise");
require("dotenv").config();

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log("MySQL connected successfully");
    return connection;
  } catch (error) {
    console.error("MySQL connection failed: ", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
