const connectDB = require("../config/db");

class AdminRepository {
  async findById(adminId) {
    const query = `
      SELECT 
        a.AdminID,
        a.FullName,
        a.DateOfBirth,
        a.ProfilePicture,
        a.Address,
        a.AccID,
        acc.Email,
        acc.Phone,
        acc.Status as AccountStatus
      FROM admin a
      LEFT JOIN account acc ON a.AccID = acc.AccID
      WHERE a.AdminID = ?
    `;

    const pool = await connectDB();
    const [rows] = await pool.execute(query, [adminId]);
    return rows[0] || null;
  }

  async findAll(options = {}) {
    const pool = await connectDB();
    const { page = 1, limit = 10, search = "" } = options;
    const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
    const safeOffset =
      Number(page) > 0 ? (Number(page) - 1) * safeLimit : 0;

    let query = `
      SELECT 
        a.AdminID,
        a.FullName,
        a.DateOfBirth,
        a.ProfilePicture,
        a.Address,
        a.AccID,
        acc.Email,
        acc.Phone,
        acc.Status as AccountStatus
      FROM admin a
      LEFT JOIN account acc ON a.AccID = acc.AccID
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (a.FullName LIKE ? OR acc.Email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.AdminID DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async create(adminData) {
    const pool = await connectDB();
    const { AccID, FullName, DateOfBirth, ProfilePicture, Address } = adminData;

    const query = `
      INSERT INTO admin (AccID, FullName, DateOfBirth, ProfilePicture, Address)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Address,
    ]);

    return { AdminID: result.insertId, ...adminData };
  }

  async update(adminId, updateData) {
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
      return await this.findById(adminId);
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE admin SET ${setClause} WHERE AdminID = ?`;
    const pool = await connectDB();
    const [result] = await pool.execute(query, [...values, adminId]);

    if (result.affectedRows === 0) return null;

    return await this.findById(adminId);
  }

  async delete(adminId) {
    const pool = await connectDB();
    const query = `DELETE FROM admin WHERE AdminID = ?`;
    const [result] = await pool.execute(query, [adminId]);
    return result.affectedRows > 0;
  }
}

module.exports = new AdminRepository();

