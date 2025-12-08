const connectDB = require("../config/db");

class LearnerRepository {
  async create(learnerData) {
    const { AccID, FullName, DateOfBirth, ProfilePicture, Job, Address } =
      learnerData;

    const query = `
      INSERT INTO learner (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const pool = await connectDB();
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
        a.Phone,
        a.Status as AccountStatus
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.LearnerID = ?
    `;

    const pool = await connectDB();
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findByAccountId(accountId) {
    const query = `
      SELECT 
        l.*,
        a.Username,
        a.Email,
        a.Phone,
        a.Status as AccountStatus
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.AccID = ?
    `;

    const pool = await connectDB();
    const [rows] = await pool.execute(query, [accountId]);
    return rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT 
        l.*,
        a.Username,
        a.Email,
        a.Phone,
        a.Status as AccountStatus
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      ORDER BY l.LearnerID DESC
    `;

    const pool = await connectDB();
    const [rows] = await pool.execute(query);
    return rows;
  }

  async update(id, updateData) {
    // Whitelist các trường được phép update trong bảng learner (dbver3)
    const allowedFields = [
      "FullName",
      "DateOfBirth",
      "ProfilePicture",
      "Job",
      "Address",
      // AccID không được update qua đây (phải thông qua account)
      // Email, Phone, Status, Level, Bio, Interests không có trong bảng learner
    ];

    // Lọc chỉ các trường hợp lệ
    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Nếu không có trường nào hợp lệ, return null
    if (Object.keys(filteredData).length === 0) {
      return await this.findById(id);
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE learner SET ${setClause} WHERE LearnerID = ?`;
    const pool = await connectDB();
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM learner WHERE LearnerID = ?`;
    const pool = await connectDB();
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM learner WHERE LearnerID = ?`;
    const pool = await connectDB();
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

    const pool = await connectDB();
    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = new LearnerRepository();
