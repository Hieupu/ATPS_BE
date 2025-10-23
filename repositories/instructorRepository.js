const pool = require("../config/db");

class InstructorRepository {
  async create(instructorData) {
    const {
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Job,
      Address,
      Major,
    } = instructorData;

    const query = `
      INSERT INTO instructor (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address, Major)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Job,
      Address,
      Major,
    ]);

    return { InstructorID: result.insertId, ...instructorData };
  }

  async findById(id) {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE i.InstructorID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findByAccountId(accountId) {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE i.AccID = ?
    `;

    const [rows] = await pool.execute(query, [accountId]);
    return rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      ORDER BY i.InstructorID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByMajor(major) {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE i.Major = ?
      ORDER BY i.InstructorID DESC
    `;

    const [rows] = await pool.execute(query, [major]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE instructor SET ${setClause} WHERE InstructorID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM instructor WHERE InstructorID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM instructor WHERE InstructorID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }
}

module.exports = new InstructorRepository();
