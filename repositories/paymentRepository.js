const connectDB = require("../config/db");
class PaymentRepository {
  async getPaymentHistory(learnerId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          p.PaymentID,
          p.Amount,
          p.PaymentMethod,
          p.PaymentDate,
          p.Status as PaymentStatus,
          e.EnrollmentID,
          e.EnrollmentDate,
          e.Status as EnrollmentStatus,
          e.OrderCode,
          c.ClassID,
          c.Name as ClassName,
          c.Fee,
          c.OpendatePlan,
          c.Opendate,
          c.EnddatePlan,
          c.Enddate,
          cr.CourseID,
          cr.Title as CourseTitle,
          rr.RefundID,
          rr.RequestDate as RefundRequestDate,
          rr.Reason as RefundReason,
          rr.Status as RefundStatus
         FROM payment p
         INNER JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
         INNER JOIN class c ON e.ClassID = c.ClassID
         INNER JOIN course cr ON c.CourseID = cr.CourseID
         LEFT JOIN refundrequest rr ON e.EnrollmentID = rr.EnrollmentID
         WHERE e.LearnerID = ?
         ORDER BY p.PaymentDate DESC`,
        [learnerId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getPaymentHistory:", error);
      throw error;
    }
  }

  async getEnrollmentDetails(enrollmentId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          e.*,
          c.ClassID,
          c.Name as ClassName,
          c.ZoomID,
          c.Zoompass,
          c.Status as ClassStatus,
          c.CourseID,
          c.InstructorID,
          c.Fee,
          c.Maxstudent,
          c.OpendatePlan,
          c.Opendate,
          c.EnddatePlan,
          c.Enddate,
          c.Numofsession,
          cr.Title as CourseTitle,
          cr.Description as CourseDescription,
          l.AccID as LearnerAccID
         FROM enrollment e
         INNER JOIN class c ON e.ClassID = c.ClassID
         INNER JOIN course cr ON c.CourseID = cr.CourseID
         INNER JOIN learner l ON e.LearnerID = l.LearnerID
         WHERE e.EnrollmentID = ?`,
        [enrollmentId]
      );
      return rows[0];
    } catch (error) {
      console.error("Database error in getEnrollmentDetails:", error);
      throw error;
    }
  }

  async getExistingRefund(enrollmentId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT * FROM refundrequest 
         WHERE EnrollmentID = ? AND Status IN ('pending', 'approved')`,
        [enrollmentId]
      );
      return rows[0];
    } catch (error) {
      console.error("Database error in getExistingRefund:", error);
      throw error;
    }
  }

  async getPaymentByEnrollment(enrollmentId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT * FROM payment 
         WHERE EnrollmentID = ? 
         ORDER BY PaymentDate DESC 
         LIMIT 1`,
        [enrollmentId]
      );
      return rows[0];
    } catch (error) {
      console.error("Database error in getPaymentByEnrollment:", error);
      throw error;
    }
  }

  async createRefundRequest(enrollmentId, reason) {
    try {
      const db = await connectDB();
      const [result] = await db.query(
        `INSERT INTO refundrequest 
         (EnrollmentID, RequestDate, Reason, Status) 
         VALUES (?, NOW(), ?, 'pending')`,
        [enrollmentId, reason]
      );
      
      return {
        RefundID: result.insertId,
        EnrollmentID: enrollmentId,
        RequestDate: new Date(),
        Reason: reason,
        Status: 'pending'
      };
    } catch (error) {
      console.error("Database error in createRefundRequest:", error);
      throw error;
    }
  }

  async getRefundRequestById(refundId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT * FROM refundrequest WHERE RefundID = ?`,
        [refundId]
      );
      return rows[0];
    } catch (error) {
      console.error("Database error in getRefundRequestById:", error);
      throw error;
    }
  }

  async updateRefundStatus(refundId, status) {
    try {
      const db = await connectDB();
      const [result] = await db.query(
        `UPDATE refundrequest SET Status = ? WHERE RefundID = ?`,
        [status, refundId]
      );
      
      return this.getRefundRequestById(refundId);
    } catch (error) {
      console.error("Database error in updateRefundStatus:", error);
      throw error;
    }
  }


  async create(paymentData) {
    const { Amount, PaymentMethod, PaymentDate, EnrollmentID } = paymentData;

    const query = `
      INSERT INTO payment (Amount, PaymentMethod, PaymentDate, EnrollmentID)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await connectDB.execute(query, [
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

    const [rows] = await connectDB.execute(query, [id]);
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

    const [rows] = await connectDB.execute(query, [enrollmentId]);
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

    const [rows] = await connectDB.execute(query, [classId]);
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

    const [rows] = await connectDB.execute(query);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE payment SET ${setClause} WHERE PaymentID = ?`;
    const [result] = await connectDB.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM payment WHERE PaymentID = ?`;
    const [result] = await connectDB.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async deleteByClassId(classId) {
    const query = `
      DELETE p FROM payment p
      INNER JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
      WHERE e.ClassID = ?
    `;
    const [result] = await connectDB.execute(query, [classId]);
    return result.affectedRows;
  }

  async exists(id) {
    const query = `SELECT 1 FROM payment WHERE PaymentID = ?`;
    const [rows] = await connectDB.execute(query, [id]);
    return rows.length > 0;
  }
}

module.exports = new PaymentRepository();
