const connectDB = require("../config/db");

class EmailLogRepository {
  // Lấy tất cả email logs với filter và pagination
  async findAll(filters = {}) {
    try {
      const db = await connectDB();

      let query = `
        SELECT 
          el.*,
          et.TemplateName,
          a.Email AS RecipientAccountEmail,
          a.Username AS RecipientUsername
        FROM email_log el
        LEFT JOIN email_template et ON el.TemplateID = et.TemplateID
        LEFT JOIN account a ON el.RecipientAccID = a.AccID
        WHERE 1=1
      `;
      const params = [];

      if (filters.templateId) {
        query += " AND el.TemplateID = ?";
        params.push(filters.templateId);
      }

      if (filters.templateCode) {
        query += " AND el.TemplateCode = ?";
        params.push(filters.templateCode);
      }

      if (filters.recipientEmail) {
        query += " AND el.RecipientEmail LIKE ?";
        params.push(`%${filters.recipientEmail}%`);
      }

      if (filters.recipientAccID) {
        query += " AND el.RecipientAccID = ?";
        params.push(filters.recipientAccID);
      }

      if (filters.status) {
        query += " AND el.Status = ?";
        params.push(filters.status);
      }

      if (filters.startDate) {
        query += " AND el.CreatedAt >= ?";
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += " AND el.CreatedAt <= ?";
        params.push(filters.endDate);
      }

      query += " ORDER BY el.CreatedAt DESC";

      if (filters.limit) {
        query += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      if (filters.offset) {
        query += " OFFSET ?";
        params.push(parseInt(filters.offset));
      }

      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error("Error finding email logs:", error);
      throw error;
    }
  }

  // Đếm tổng số email logs
  async count(filters = {}) {
    try {
      const db = await connectDB();
      let query = "SELECT COUNT(*) as total FROM email_log el WHERE 1=1";
      const params = [];

      if (filters.templateId) {
        query += " AND el.TemplateID = ?";
        params.push(filters.templateId);
      }

      if (filters.templateCode) {
        query += " AND el.TemplateCode = ?";
        params.push(filters.templateCode);
      }

      if (filters.recipientEmail) {
        query += " AND el.RecipientEmail LIKE ?";
        params.push(`%${filters.recipientEmail}%`);
      }

      if (filters.recipientAccID) {
        query += " AND el.RecipientAccID = ?";
        params.push(filters.recipientAccID);
      }

      if (filters.status) {
        query += " AND el.Status = ?";
        params.push(filters.status);
      }

      if (filters.startDate) {
        query += " AND el.CreatedAt >= ?";
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += " AND el.CreatedAt <= ?";
        params.push(filters.endDate);
      }

      const [rows] = await db.query(query, params);
      return rows[0]?.total || 0;
    } catch (error) {
      console.error("Error counting email logs:", error);
      throw error;
    }
  }

  // Lấy email log theo ID
  async findById(emailLogId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          el.*,
          et.TemplateName,
          a.Email AS RecipientAccountEmail,
          a.Username AS RecipientUsername
        FROM email_log el
        LEFT JOIN email_template et ON el.TemplateID = et.TemplateID
        LEFT JOIN account a ON el.RecipientAccID = a.AccID
        WHERE el.EmailLogID = ?`,
        [emailLogId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding email log by ID:", error);
      throw error;
    }
  }

  // Tạo email log mới
  async create(logData) {
    try {
      const db = await connectDB();
      await db.query("SET time_zone = '+07:00'");
      const {
        TemplateID,
        TemplateCode,
        RecipientEmail,
        RecipientAccID,
        Subject,
        Body,
        Variables,
        Status = "PENDING",
      } = logData;

      const [result] = await db.query(
        `INSERT INTO email_log 
        (TemplateID, TemplateCode, RecipientEmail, RecipientAccID, Subject, Body, Variables, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          TemplateID || null,
          TemplateCode || null,
          RecipientEmail,
          RecipientAccID || null,
          Subject,
          Body,
          Variables ? JSON.stringify(Variables) : null,
          Status,
        ]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      console.error("Error creating email log:", error);
      throw error;
    }
  }

  // Cập nhật trạng thái email log
  async updateStatus(emailLogId, status, errorMessage = null, sentAt = null) {
    try {
      const db = await connectDB();
      const updateFields = ["Status = ?"];
      const params = [status];

      if (errorMessage !== null) {
        updateFields.push("ErrorMessage = ?");
        params.push(errorMessage);
      }

      if (sentAt !== null) {
        updateFields.push("SentAt = ?");
        params.push(sentAt);
      } else if (status === "SENT") {
        updateFields.push("SentAt = NOW()");
      }

      params.push(emailLogId);

      await db.query(
        `UPDATE email_log SET ${updateFields.join(", ")} WHERE EmailLogID = ?`,
        params
      );

      return await this.findById(emailLogId);
    } catch (error) {
      console.error("Error updating email log status:", error);
      throw error;
    }
  }
}

module.exports = new EmailLogRepository();
