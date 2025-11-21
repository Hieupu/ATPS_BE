const pool = require("../config/db");

class LogRepository {
  async create(logData) {
    const { Action, AccID, Detail } = logData;

    // Đảm bảo Detail không vượt quá 45 ký tự (theo schema VARCHAR(45))
    const truncatedDetail = Detail && Detail.length > 45 
      ? Detail.substring(0, 42) + '...' 
      : Detail || '';

    // Validate required fields
    if (!Action || !AccID) {
      throw new Error('Action và AccID là bắt buộc');
    }

    const query = `
      INSERT INTO \`log\` (Action, Timestamp, AccID, Detail)
      VALUES (?, NOW(), ?, ?)
    `;

    const [result] = await pool.execute(query, [Action, AccID, truncatedDetail]);

    return { LogID: result.insertId, Action, AccID, Detail: truncatedDetail };
  }

  async findByAccountId(accountId, limit = 50) {
    // Đảm bảo limit là số nguyên hợp lệ
    const validLimit = Math.max(1, parseInt(limit, 10) || 50);
    const limitInt = parseInt(validLimit.toString(), 10);

    const query = `
      SELECT l.*, a.Email, a.username
      FROM \`log\` l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.AccID = ?
      ORDER BY l.Timestamp DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [accountId, limitInt]);
    return rows;
  }

  async findAll(limit = 100) {
    // Đảm bảo limit là số nguyên hợp lệ
    const validLimit = Math.max(1, parseInt(limit, 10) || 100);
    const limitInt = parseInt(validLimit.toString(), 10);

    const query = `
      SELECT l.*, a.Email, a.username
      FROM \`log\` l
      LEFT JOIN account a ON l.AccID = a.AccID
      ORDER BY l.Timestamp DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [limitInt]);
    return rows;
  }

  async findByAction(action, limit = 50) {
    // Đảm bảo limit là số nguyên hợp lệ
    const validLimit = Math.max(1, parseInt(limit, 10) || 50);
    const limitInt = parseInt(validLimit.toString(), 10);

    const query = `
      SELECT l.*, a.Email, a.username
      FROM \`log\` l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.Action = ?
      ORDER BY l.Timestamp DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [action, limitInt]);
    return rows;
  }
}

module.exports = new LogRepository();

