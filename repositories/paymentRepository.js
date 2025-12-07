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
        latest_rr.RefundID,
        latest_rr.RequestDate as RefundRequestDate,
        latest_rr.Reason as RefundReason,
        latest_rr.Status as RefundStatus
       FROM payment p
       INNER JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID
       INNER JOIN class c ON e.ClassID = c.ClassID
       INNER JOIN course cr ON c.CourseID = cr.CourseID
       LEFT JOIN (
         SELECT 
           rr1.EnrollmentID,
           rr1.RefundID,
           rr1.RequestDate,
           rr1.Reason,
           rr1.Status
         FROM refundrequest rr1
         INNER JOIN (
           SELECT EnrollmentID, MAX(RefundID) as MaxRefundID
           FROM refundrequest
           GROUP BY EnrollmentID
         ) rr2 ON rr1.EnrollmentID = rr2.EnrollmentID 
              AND rr1.RefundID = rr2.MaxRefundID
       ) latest_rr ON e.EnrollmentID = latest_rr.EnrollmentID
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
}

module.exports = new PaymentRepository();