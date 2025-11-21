const pool = require("../config/db");

class StaffRepository {
  // Lấy staff theo ID
  async findById(staffId) {
    try {
      const query = `
        SELECT 
          s.StaffID,
          s.FullName,
          s.DateOfBirth,
          s.ProfilePicture,
          s.Address,
          s.AccID,
          a.Email,
          a.Phone,
          a.Status as AccountStatus
        FROM staff s
        LEFT JOIN account a ON s.AccID = a.AccID
        WHERE s.StaffID = ?
      `;

      const [rows] = await pool.execute(query, [staffId]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy staff theo AccID
  async findByAccID(accId) {
    try {
      const query = `
        SELECT 
          s.StaffID,
          s.FullName,
          s.DateOfBirth,
          s.ProfilePicture,
          s.Address,
          s.AccID,
          a.Email,
          a.Phone,
          a.Status as AccountStatus
        FROM staff s
        LEFT JOIN account a ON s.AccID = a.AccID
        WHERE s.AccID = ?
      `;

      const [rows] = await pool.execute(query, [accId]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả staff
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          s.StaffID,
          s.FullName,
          s.DateOfBirth,
          s.ProfilePicture,
          s.Address,
          s.AccID,
          a.Email,
          a.Phone,
          a.Status as AccountStatus
        FROM staff s
        LEFT JOIN account a ON s.AccID = a.AccID
        WHERE 1=1
      `;

      const params = [];

      if (search) {
        query += ` AND (s.FullName LIKE ? OR a.Email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY s.StaffID DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);

      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StaffRepository();


