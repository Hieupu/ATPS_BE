const emailTemplateService = require("../services/emailTemplateService");

const emailTemplateController = {
  // Lấy danh sách templates
  getAllTemplates: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        eventType,
        isActive,
        search,
      } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      if (eventType) filters.eventType = eventType;
      if (isActive !== undefined) filters.isActive = isActive === "true";
      if (search) filters.search = search;

      const result = await emailTemplateService.getAllTemplates(filters);

      res.json({
        success: true,
        message: "Lấy danh sách mẫu email thành công",
        data: result.templates,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error getting all templates:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách mẫu email",
        error: error.message,
      });
    }
  },

  // Lấy template theo ID
  getTemplateById: async (req, res) => {
    try {
      const { id } = req.params;
      const template = await emailTemplateService.getTemplateById(id);

      res.json({
        success: true,
        message: "Lấy mẫu email thành công",
        data: template,
      });
    } catch (error) {
      console.error("Error getting template by ID:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Tạo template mới
  createTemplate: async (req, res) => {
    try {
      const {
        TemplateCode,
        TemplateName,
        Subject,
        Body,
        Description,
        EventType,
        IsActive = true,
        Variables,
      } = req.body;

      // Validation
      if (!TemplateCode || !TemplateName || !Subject || !Body || !EventType) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin bắt buộc",
        });
      }

      const template = await emailTemplateService.createTemplate({
        TemplateCode,
        TemplateName,
        Subject,
        Body,
        Description,
        EventType,
        IsActive,
        Variables: Array.isArray(Variables) ? Variables : [],
      });

      res.status(201).json({
        success: true,
        message: "Tạo mẫu email thành công",
        data: template,
      });
    } catch (error) {
      console.error("Error creating template:", error);
      const statusCode =
        error.message.includes("đã tồn tại") ||
        error.message.includes("Vui lòng")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Cập nhật template
  updateTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Nếu có Variables, đảm bảo là array
      if (updateData.Variables && !Array.isArray(updateData.Variables)) {
        updateData.Variables = [];
      }

      const template = await emailTemplateService.updateTemplate(id, updateData);

      res.json({
        success: true,
        message: "Cập nhật mẫu email thành công",
        data: template,
      });
    } catch (error) {
      console.error("Error updating template:", error);
      const statusCode =
        error.message.includes("Không tìm thấy") ||
        error.message.includes("đã tồn tại")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Xóa template
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      await emailTemplateService.deleteTemplate(id);

      res.json({
        success: true,
        message: "Xóa mẫu email thành công",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Preview template
  previewTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { variables = {} } = req.body;

      const preview = await emailTemplateService.previewTemplate(id, variables);

      res.json({
        success: true,
        message: "Preview mẫu email thành công",
        data: preview,
      });
    } catch (error) {
      console.error("Error previewing template:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Test gửi email
  testSendEmail: async (req, res) => {
    try {
      const { id } = req.params;
      const { testEmail, variables = {} } = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp email test",
        });
      }

      const result = await emailTemplateService.testSendEmail(
        id,
        testEmail,
        variables
      );

      res.json({
        success: true,
        message: "Gửi email test thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error testing email:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Gửi email sử dụng template code
  sendEmailWithTemplate: async (req, res) => {
    try {
      const { templateCode, recipientEmail, variables = {} } = req.body;

      if (!templateCode || !recipientEmail) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp templateCode và recipientEmail",
        });
      }

      const result = await emailTemplateService.sendEmailWithTemplate(
        templateCode,
        recipientEmail,
        variables
      );

      res.json({
        success: true,
        message: "Gửi email thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error sending email with template:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },
};

module.exports = emailTemplateController;

