const connectDB = require("../config/db");

class StaffRepository {
  // Lấy staff theo ID
  async findById(staffId) {
    try {
      const pool = await connectDB();
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

  async create(staffData) {
    const pool = await connectDB();
    const { AccID, FullName, DateOfBirth, ProfilePicture, Address } = staffData;

    const query = `
      INSERT INTO staff (AccID, FullName, DateOfBirth, ProfilePicture, Address)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Address,
    ]);

    return { StaffID: result.insertId, ...staffData };
  }

  // Lấy staff theo AccID
  async findByAccID(accId) {
    try {
      const pool = await connectDB();
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
      const pool = await connectDB();
      const { page = 1, limit = 10, search = "" } = options;
      const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
      const safeOffset = Number(page) > 0 ? (Number(page) - 1) * safeLimit : 0;

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

      query += ` ORDER BY s.StaffID DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const [rows] = await pool.execute(query, params);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  async update(staffId, updateData) {
    const allowedFields = [
      "FullName",
      "DateOfBirth",
      "ProfilePicture",
      "Address",
    ];

    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return await this.findById(staffId);
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE staff SET ${setClause} WHERE StaffID = ?`;
    const pool = await connectDB();
    const [result] = await pool.execute(query, [...values, staffId]);

    if (result.affectedRows === 0) return null;

    return await this.findById(staffId);
  }

  async delete(staffId) {
    const pool = await connectDB();
    const query = `DELETE FROM staff WHERE StaffID = ?`;
    const [result] = await pool.execute(query, [staffId]);
    return result.affectedRows > 0;
  }
}

module.exports = new StaffRepository();
