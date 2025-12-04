const pool = require("../config/db");

class RefundRepository {
  // Tạo yêu cầu hoàn tiền
  async create(refundData) {
    try {
      const { RequestDate, Reason, Status, EnrollmentID } = refundData;

      const query = `
        INSERT INTO refundrequest (RequestDate, Reason, Status, EnrollmentID)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        RequestDate || new Date(),
        Reason,
        Status || "pending",
        EnrollmentID,
      ]);

      return {
        RefundID: result.insertId,
        ...refundData,
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả yêu cầu hoàn tiền
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, status = null, search = "" } = options;

      // Đảm bảo page và limit là số nguyên dương
      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.max(1, parseInt(String(limit), 10) || 10);
      const offset = Math.max(0, (pageNum - 1) * limitNum);

      let query = `
        SELECT 
          r.RefundID,
          r.RequestDate,
          r.Reason,
          r.Status,
          r.EnrollmentID,
          e.LearnerID,
          e.ClassID,
          e.OrderCode,
          l.FullName as LearnerName,
          a.Email as LearnerEmail,
          c.Name as ClassName,
          c.Fee as ClassFee,
          p.PaymentID,
          p.Amount as PaymentAmount,
          p.PaymentMethod,
          p.PaymentDate
        FROM refundrequest r
        LEFT JOIN enrollment e ON r.EnrollmentID = e.EnrollmentID
        LEFT JOIN learner l ON e.LearnerID = l.LearnerID
        LEFT JOIN account a ON l.AccID = a.AccID
        LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
        LEFT JOIN payment p ON p.EnrollmentID = e.EnrollmentID AND p.Status = 'completed'
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += ` AND r.Status = ?`;
        params.push(String(status));
      }

      if (search && String(search).trim()) {
        query += ` AND (l.FullName LIKE ? OR c.Name LIKE ? OR r.Reason LIKE ?)`;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Sử dụng template string cho LIMIT và OFFSET (giống các repository khác)
      // Đảm bảo limit và offset là số nguyên dương
      const safeLimit = Number(limitNum) || 10;
      const safeOffset = Number(offset) || 0;
      query += ` ORDER BY r.RequestDate DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const [rows] = await pool.execute(query, params);

      return rows;
    } catch (error) {
      console.error("[RefundRepository.findAll] Error:", error);
      console.error("[RefundRepository.findAll] Error SQL:", error.sql);
      throw error;
    }
  }

  // Đếm tổng số yêu cầu hoàn tiền
  async count(options = {}) {
    try {
      const { status = null, search = "" } = options;

      let query = `
        SELECT COUNT(*) as total 
        FROM refundrequest r
        LEFT JOIN enrollment e ON r.EnrollmentID = e.EnrollmentID
        LEFT JOIN learner l ON e.LearnerID = l.LearnerID
        LEFT JOIN account a ON l.AccID = a.AccID
        LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ` AND r.Status = ?`;
        params.push(status);
      }

      if (search && search.trim()) {
        query += ` AND (l.FullName LIKE ? OR c.Name LIKE ? OR r.Reason LIKE ?)`;
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Lấy yêu cầu hoàn tiền theo ID
  async findById(refundId) {
    try {
      const query = `
        SELECT 
          r.RefundID,
          r.RequestDate,
          r.Reason,
          r.Status,
          r.EnrollmentID,
          e.LearnerID,
          e.ClassID,
          e.OrderCode,
          l.FullName as LearnerName,
          a.Email as LearnerEmail,
          c.Name as ClassName,
          c.Fee as ClassFee,
          p.PaymentID,
          p.Amount as PaymentAmount,
          p.PaymentMethod,
          p.PaymentDate
        FROM refundrequest r
        LEFT JOIN enrollment e ON r.EnrollmentID = e.EnrollmentID
        LEFT JOIN learner l ON e.LearnerID = l.LearnerID
        LEFT JOIN account a ON l.AccID = a.AccID
        LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
        LEFT JOIN payment p ON p.EnrollmentID = e.EnrollmentID AND p.Status = 'completed'
        WHERE r.RefundID = ?
      `;

      const [rows] = await pool.execute(query, [refundId]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật yêu cầu hoàn tiền
  async update(refundId, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        return null;
      }

      values.push(refundId);

      const query = `UPDATE refundrequest SET ${fields.join(
        ", "
      )} WHERE RefundID = ?`;

      const [result] = await pool.execute(query, values);

      if (result.affectedRows === 0) {
        return null;
      }

      return await this.findById(refundId);
    } catch (error) {
      throw error;
    }
  }

  // Xóa yêu cầu hoàn tiền
  async delete(refundId) {
    try {
      const query = `DELETE FROM refundrequest WHERE RefundID = ?`;

      const [result] = await pool.execute(query, [refundId]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Lấy yêu cầu hoàn tiền theo trạng thái
  async findByStatus(status) {
    try {
      const query = `
        SELECT 
          r.RefundID,
          r.RequestDate,
          r.Reason,
          r.Status,
          r.EnrollmentID,
          e.LearnerID,
          e.ClassID,
          l.FullName as LearnerName,
          a.Email as LearnerEmail,
          c.Name as ClassName,
          c.Fee as ClassFee,
          p.PaymentID,
          p.Amount as PaymentAmount,
          p.PaymentMethod,
          p.PaymentDate
        FROM refundrequest r
        LEFT JOIN enrollment e ON r.EnrollmentID = e.EnrollmentID
        LEFT JOIN learner l ON e.LearnerID = l.LearnerID
        LEFT JOIN account a ON l.AccID = a.AccID
        LEFT JOIN \`class\` c ON e.ClassID = c.ClassID
        LEFT JOIN payment p ON p.EnrollmentID = e.EnrollmentID AND p.Status = 'completed'
        WHERE r.Status = ?
        ORDER BY r.RequestDate DESC
      `;

      const [rows] = await pool.execute(query, [status]);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy yêu cầu hoàn tiền theo EnrollmentID
  async findByEnrollmentId(enrollmentId) {
    try {
      const query = `
        SELECT 
          r.*
        FROM refundrequest r
        WHERE r.EnrollmentID = ?
        ORDER BY r.RequestDate DESC
      `;

      const [rows] = await pool.execute(query, [enrollmentId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RefundRepository();
