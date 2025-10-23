const pool = require("../config/db");

class LearnerRepository {
  async create(learnerData) {
    const { AccID, FullName, DateOfBirth, ProfilePicture, Job, Address } =
      learnerData;

    const query = `
      INSERT INTO learner (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Job,
      Address,
    ]);

    return { LearnerID: result.insertId, ...learnerData };
  }

  async findById(id) {
    const query = `
      SELECT 
        l.*,
        a.Username,
        a.Email,
        a.Phone
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.LearnerID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findByAccountId(accountId) {
    const query = `
      SELECT 
        l.*,
        a.Username,
        a.Email,
        a.Phone
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.AccID = ?
    `;

    const [rows] = await pool.execute(query, [accountId]);
    return rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT 
        l.*,
        a.Username,
        a.Email,
        a.Phone
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      ORDER BY l.LearnerID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE learner SET ${setClause} WHERE LearnerID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM learner WHERE LearnerID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM learner WHERE LearnerID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async getLearnersWithEnrollmentCount() {
    const query = `
      SELECT 
        l.*,
        a.Username,
        a.Email,
        a.Phone,
        COUNT(e.EnrollmentID) as enrollmentCount
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      LEFT JOIN enrollment e ON l.LearnerID = e.LearnerID AND e.Status = 'active'
      GROUP BY l.LearnerID
      ORDER BY l.LearnerID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = new LearnerRepository();
