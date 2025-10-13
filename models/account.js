const connectDB = require("../config/db");

let dbConnection;

const initializeDB = async () => {
  if (!dbConnection) {
    dbConnection = await connectDB();
  }
  return dbConnection;
};

const Account = {
  create: async (accountData) => {
    const connection = await initializeDB();
    const { username, email, phone, password, status } = accountData;
    const query = `
      INSERT INTO atps.account (username, email, phone, password, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(query, [
      username,
      email,
      phone,
      password,
      status || "active",
    ]);
    return { id: result.insertId, ...accountData };
  },
};

// Export initializeDB để sử dụng ở nơi khác nếu cần
module.exports = { Account, initializeDB };
