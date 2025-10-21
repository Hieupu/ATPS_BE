const pool = require("../config/db");

const Account = {
  create: async (accountData) => {
    const { username, email, phone, password, status } = accountData;
    const query = `
      INSERT INTO atps.account (username, email, phone, password, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      username,
      email,
      phone,
      password,
      status || "active",
    ]);
    return { id: result.insertId, ...accountData };
  },
};

module.exports = { Account };
