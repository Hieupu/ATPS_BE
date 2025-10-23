const pool = require("../config/db");

class PaymentRepository {
  async create(paymentData) {
    const { Amount, PaymentMethod, PaymentDate, EnrollmentID } = paymentData;

    const query = `
      INSERT INTO payment (Amount, PaymentMethod, PaymentDate, EnrollmentID)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Amount,
      PaymentMethod,
      PaymentDate,
      EnrollmentID,
    ]);

    return { PaymentID: result.insertId, ...paymentData };
  }

  async findById(id) {
    if (!id) {
      throw new Error("ID is required");
    }
    const query = `
      SELECT 
        p.*,
        e.LearnerID,
        e.ClassID,
        l.FullName as learnerName,
        c.ClassName
      FROM payment p
      LEFT JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
      WHERE p.PaymentID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findByEnrollmentId(enrollmentId) {
    const query = `
      SELECT 
        p.*,
        e.LearnerID,
        e.ClassID,
        l.FullName as learnerName,
        c.ClassName
      FROM payment p
      LEFT JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
      WHERE p.EnrollmentID = ?
    `;

    const [rows] = await pool.execute(query, [enrollmentId]);
    return rows;
  }

  async findByClassId(classId) {
    const query = `
      SELECT 
        p.*,
        e.LearnerID,
        e.ClassID,
        l.FullName as learnerName,
        c.ClassName
      FROM payment p
      LEFT JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
      WHERE e.ClassID = ?
    `;

    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }

  async findAll() {
    const query = `
      SELECT 
        p.*,
        e.LearnerID,
        e.ClassID,
        l.FullName as learnerName,
        c.ClassName
      FROM payment p
      LEFT JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
      ORDER BY p.PaymentDate DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE payment SET ${setClause} WHERE PaymentID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM payment WHERE PaymentID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async deleteByClassId(classId) {
    const query = `
      DELETE p FROM payment p
      INNER JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
      WHERE e.ClassID = ?
    `;
    const [result] = await pool.execute(query, [classId]);
    return result.affectedRows;
  }

  async exists(id) {
    const query = `SELECT 1 FROM payment WHERE PaymentID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }
}

module.exports = new PaymentRepository();
