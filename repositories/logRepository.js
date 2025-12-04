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
    // Đảm bảo limitInt là số nguyên, không phải string
    const limitInt = Number.isInteger(validLimit) ? validLimit : parseInt(validLimit, 10);

    // Sử dụng string interpolation cho LIMIT để tránh lỗi prepared statement
    const query = `
      SELECT l.*, a.Email, a.username
      FROM \`log\` l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.AccID = ?
      ORDER BY l.Timestamp DESC
      LIMIT ${limitInt}
    `;

    const [rows] = await pool.execute(query, [accountId]);
    return rows;
  }

  async findAll(limit = 100) {
    // Đảm bảo limit là số nguyên hợp lệ
    const validLimit = Math.max(1, parseInt(limit, 10) || 100);
    // Đảm bảo limitInt là số nguyên, không phải string
    const limitInt = Number.isInteger(validLimit) ? validLimit : parseInt(validLimit, 10);

    // Sử dụng string interpolation cho LIMIT để tránh lỗi prepared statement
    // MySQL có thể gặp vấn đề với placeholder cho LIMIT trong một số trường hợp
    const query = `
      SELECT l.*, a.Email, a.username
      FROM \`log\` l
      LEFT JOIN account a ON l.AccID = a.AccID
      ORDER BY l.Timestamp DESC
      LIMIT ${limitInt}
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByAction(action, limit = 50) {
    // Đảm bảo limit là số nguyên hợp lệ
    const validLimit = Math.max(1, parseInt(limit, 10) || 50);
    // Đảm bảo limitInt là số nguyên, không phải string
    const limitInt = Number.isInteger(validLimit) ? validLimit : parseInt(validLimit, 10);

    // Sử dụng string interpolation cho LIMIT để tránh lỗi prepared statement
    const query = `
      SELECT l.*, a.Email, a.username
      FROM \`log\` l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.Action = ?
      ORDER BY l.Timestamp DESC
      LIMIT ${limitInt}
    `;

    const [rows] = await pool.execute(query, [action]);
    return rows;
  }
}

module.exports = new LogRepository();

