const connectDB = require("../config/db");

const emailTemplateRepository = {
  // Lấy tất cả templates
  findAll: async (filters = {}) => {
    try {
      const db = await connectDB();
      let query = "SELECT * FROM email_template WHERE 1=1";
      const params = [];

      if (filters.eventType) {
        query += " AND EventType = ?";
        params.push(filters.eventType);
      }

      if (filters.isActive !== undefined) {
        query += " AND IsActive = ?";
        params.push(filters.isActive ? 1 : 0);
      }

      if (filters.search) {
        query +=
          " AND (TemplateName LIKE ? OR TemplateCode LIKE ? OR Description LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += " ORDER BY CreatedAt DESC";

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
      console.error("Error finding email templates:", error);
      throw error;
    }
  },

  // Đếm tổng số templates
  count: async (filters = {}) => {
    try {
      const db = await connectDB();
      let query = "SELECT COUNT(*) as total FROM email_template WHERE 1=1";
      const params = [];

      if (filters.eventType) {
        query += " AND EventType = ?";
        params.push(filters.eventType);
      }

      if (filters.isActive !== undefined) {
        query += " AND IsActive = ?";
        params.push(filters.isActive ? 1 : 0);
      }

      if (filters.search) {
        query +=
          " AND (TemplateName LIKE ? OR TemplateCode LIKE ? OR Description LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const [rows] = await db.query(query, params);
      return rows[0]?.total || 0;
    } catch (error) {
      console.error("Error counting email templates:", error);
      throw error;
    }
  },

  // Lấy template theo ID
  findById: async (templateId) => {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        "SELECT * FROM email_template WHERE TemplateID = ?",
        [templateId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding email template by ID:", error);
      throw error;
    }
  },

  // Lấy template theo Code
  findByCode: async (templateCode) => {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        "SELECT * FROM email_template WHERE TemplateCode = ? AND IsActive = 1",
        [templateCode]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error finding email template by code:", error);
      throw error;
    }
  },

  // Lấy danh sách biến có thể sử dụng cho từng EventType (từ template hiện có hoặc mặc định)
  getAvailableVariables: async (eventType) => {
    try {
      const db = await connectDB();
      // Lấy template theo EventType để xem Variables đã được định nghĩa
      const [rows] = await db.query(
        "SELECT Variables FROM email_template WHERE EventType = ? AND IsActive = 1 ORDER BY CreatedAt DESC LIMIT 1",
        [eventType]
      );

      if (rows.length > 0 && rows[0].Variables) {
        try {
          const variables = JSON.parse(rows[0].Variables);
          if (Array.isArray(variables) && variables.length > 0) {
            return variables;
          }
        } catch (e) {
          // Nếu không parse được, dùng mặc định
        }
      }

      // Nếu không có template, trả về biến mặc định theo EventType
      const defaultVariables = {
        ACCOUNT_STATUS_CHANGED: ["userName", "oldStatus", "newStatus"],
        CLASS_CANCELLED_TO_LEARNER: [
          "userName",
          "className",
          "classCode",
          "reason",
        ],
        CLASS_CANCELLED_TO_INSTRUCTOR: [
          "userName",
          "className",
          "classCode",
          "reason",
        ],
        REFUND_CREATED: [
          "userName",
          "className",
          "refundCode",
          "refundAmount",
          "reason",
        ],
        REFUND_APPROVED: [
          "userName",
          "refundCode",
          "refundAmount",
          "className",
        ],
        REFUND_REJECTED: ["userName", "refundCode", "rejectionReason"],
        REFUND_COMPLETED: [
          "userName",
          "refundCode",
          "refundAmount",
          "className",
          "completedDate",
        ],
      };

      return defaultVariables[eventType] || [];
    } catch (error) {
      console.error("Error getting available variables:", error);
      throw error;
    }
  },

  // Lấy templates theo EventType
  findByEventType: async (eventType, isActive = true) => {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        "SELECT * FROM email_template WHERE EventType = ? AND IsActive = ? ORDER BY CreatedAt DESC",
        [eventType, isActive ? 1 : 0]
      );
      return rows;
    } catch (error) {
      console.error("Error finding email templates by event type:", error);
      throw error;
    }
  },

  // Tạo template mới
  create: async (templateData) => {
    try {
      const db = await connectDB();
      const {
        TemplateCode,
        TemplateName,
        Subject,
        Body,
        Description,
        EventType,
        IsActive = 1,
        Variables,
      } = templateData;

      const [result] = await db.query(
        `INSERT INTO email_template 
        (TemplateCode, TemplateName, Subject, Body, Description, EventType, IsActive, Variables, CreatedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          TemplateCode,
          TemplateName,
          Subject,
          Body,
          Description || null,
          EventType,
          IsActive ? 1 : 0,
          Variables ? JSON.stringify(Variables) : null,
          templateData.CreatedBy || null,
        ]
      );

      return await emailTemplateRepository.findById(result.insertId);
    } catch (error) {
      console.error("Error creating email template:", error);
      throw error;
    }
  },

  // Cập nhật template
  update: async (templateId, templateData) => {
    try {
      const {
        TemplateCode,
        TemplateName,
        Subject,
        Body,
        Description,
        EventType,
        IsActive,
        Variables,
      } = templateData;

      const updateFields = [];
      const params = [];

      if (TemplateCode !== undefined) {
        updateFields.push("TemplateCode = ?");
        params.push(TemplateCode);
      }
      if (TemplateName !== undefined) {
        updateFields.push("TemplateName = ?");
        params.push(TemplateName);
      }
      if (Subject !== undefined) {
        updateFields.push("Subject = ?");
        params.push(Subject);
      }
      if (Body !== undefined) {
        updateFields.push("Body = ?");
        params.push(Body);
      }
      if (Description !== undefined) {
        updateFields.push("Description = ?");
        params.push(Description);
      }
      if (EventType !== undefined) {
        updateFields.push("EventType = ?");
        params.push(EventType);
      }
      if (IsActive !== undefined) {
        updateFields.push("IsActive = ?");
        params.push(IsActive ? 1 : 0);
      }
      if (Variables !== undefined) {
        updateFields.push("Variables = ?");
        params.push(Variables ? JSON.stringify(Variables) : null);
      }

      if (updateFields.length === 0) {
        return await emailTemplateRepository.findById(templateId);
      }

      params.push(templateId);
      const db = await connectDB();

      await db.query(
        `UPDATE email_template SET ${updateFields.join(
          ", "
        )} WHERE TemplateID = ?`,
        params
      );

      return await emailTemplateRepository.findById(templateId);
    } catch (error) {
      console.error("Error updating email template:", error);
      throw error;
    }
  },

  // Xóa template (soft delete bằng cách set IsActive = 0)
  delete: async (templateId) => {
    try {
      const db = await connectDB();
      await db.query(
        "UPDATE email_template SET IsActive = 0 WHERE TemplateID = ?",
        [templateId]
      );
      return true;
    } catch (error) {
      console.error("Error deleting email template:", error);
      throw error;
    }
  },

  // Xóa vĩnh viễn template
  hardDelete: async (templateId) => {
    try {
      const db = await connectDB();
      await db.query("DELETE FROM email_template WHERE TemplateID = ?", [
        templateId,
      ]);
      return true;
    } catch (error) {
      console.error("Error hard deleting email template:", error);
      throw error;
    }
  },
};

module.exports = emailTemplateRepository;
