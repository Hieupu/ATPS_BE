const emailTemplateRepository = require("../repositories/emailTemplateRepository");
const { sendEmail } = require("../utils/emailUtils");
const emailLogService = require("./emailLogService");
const accountRepository = require("../repositories/accountRepository");

const emailTemplateService = {
  // Lấy danh sách templates với pagination
  getAllTemplates: async (filters = {}) => {
    try {
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const offset = (page - 1) * limit;

      const templates = await emailTemplateRepository.findAll({
        ...filters,
        limit,
        offset,
      });
      const total = await emailTemplateRepository.count(filters);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error getting all templates:", error);
      throw error;
    }
  },

  // Lấy template theo ID
  getTemplateById: async (templateId) => {
    try {
      const template = await emailTemplateRepository.findById(templateId);
      if (!template) {
        throw new Error("Không tìm thấy mẫu email");
      }

      // Parse Variables nếu có
      if (template.Variables) {
        try {
          template.Variables = JSON.parse(template.Variables);
        } catch (e) {
          template.Variables = [];
        }
      } else {
        template.Variables = [];
      }

      return template;
    } catch (error) {
      console.error("Error getting template by ID:", error);
      throw error;
    }
  },

  // Lấy danh sách biến có thể sử dụng cho EventType
  getAvailableVariables: async (eventType) => {
    try {
      const variables = await emailTemplateRepository.getAvailableVariables(
        eventType
      );
      return variables;
    } catch (error) {
      console.error("Error getting available variables:", error);
      throw error;
    }
  },

  // Lấy template theo Code
  getTemplateByCode: async (templateCode) => {
    try {
      const template = await emailTemplateRepository.findByCode(templateCode);
      if (!template) {
        throw new Error(`Không tìm thấy mẫu email với mã: ${templateCode}`);
      }

      // Parse Variables nếu có
      if (template.Variables) {
        try {
          template.Variables = JSON.parse(template.Variables);
        } catch (e) {
          template.Variables = [];
        }
      } else {
        template.Variables = [];
      }

      return template;
    } catch (error) {
      console.error("Error getting template by code:", error);
      throw error;
    }
  },

  // Tạo template mới
  createTemplate: async (templateData) => {
    try {
      // Kiểm tra TemplateCode đã tồn tại chưa
      const existing = await emailTemplateRepository.findByCode(
        templateData.TemplateCode
      );
      if (existing) {
        throw new Error("Mã mẫu email đã tồn tại");
      }

      const template = await emailTemplateRepository.create(templateData);

      // Parse Variables
      if (template.Variables) {
        try {
          template.Variables = JSON.parse(template.Variables);
        } catch (e) {
          template.Variables = [];
        }
      } else {
        template.Variables = [];
      }

      return template;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  },

  // Cập nhật template
  updateTemplate: async (templateId, templateData) => {
    try {
      const existing = await emailTemplateRepository.findById(templateId);
      if (!existing) {
        throw new Error("Không tìm thấy mẫu email");
      }

      // Nếu đổi TemplateCode, kiểm tra trùng
      if (
        templateData.TemplateCode &&
        templateData.TemplateCode !== existing.TemplateCode
      ) {
        const codeExists = await emailTemplateRepository.findByCode(
          templateData.TemplateCode
        );
        if (codeExists) {
          throw new Error("Mã mẫu email đã tồn tại");
        }
      }

      const template = await emailTemplateRepository.update(
        templateId,
        templateData
      );

      // Parse Variables
      if (template.Variables) {
        try {
          template.Variables = JSON.parse(template.Variables);
        } catch (e) {
          template.Variables = [];
        }
      } else {
        template.Variables = [];
      }

      return template;
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  },

  // Xóa template
  deleteTemplate: async (templateId) => {
    try {
      const template = await emailTemplateRepository.findById(templateId);
      if (!template) {
        throw new Error("Không tìm thấy mẫu email");
      }

      await emailTemplateRepository.delete(templateId);
      return true;
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  },

  // Thay thế các biến trong template
  replaceVariables: (template, variables = {}) => {
    let subject = template.Subject || "";
    let body = template.Body || "";

    // Thay thế các biến trong Subject và Body
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      const value = variables[key] || "";
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    return { subject, body };
  },

  // Gửi email sử dụng template
  sendEmailWithTemplate: async (
    templateCode,
    recipientEmail,
    variables = {}
  ) => {
    let emailLogId = null;
    try {
      // Lấy template
      const template = await emailTemplateService.getTemplateByCode(
        templateCode
      );

      // Thay thế biến
      const { subject, body } = emailTemplateService.replaceVariables(
        template,
        variables
      );

      // Tìm RecipientAccID từ email
      let recipientAccID = null;
      try {
        const account = await accountRepository.findAccountByEmail(
          recipientEmail
        );
        if (account && account.AccID) {
          recipientAccID = account.AccID;
        }
      } catch (e) {
        // Không tìm thấy account, tiếp tục với recipientAccID = null
        console.warn(
          `[sendEmailWithTemplate] Không tìm thấy account cho email ${recipientEmail}:`,
          e.message
        );
      }

      // Tạo log trước khi gửi (status: PENDING)
      try {
        const logData = {
          TemplateID: template.TemplateID || null,
          TemplateCode: templateCode,
          RecipientEmail: recipientEmail,
          RecipientAccID: recipientAccID,
          Subject: subject,
          Body: body,
          Variables: variables, // emailLogRepository sẽ tự động stringify
          Status: "PENDING",
        };
        const logResult = await emailLogService.createEmailLog(logData);
        // logResult có format: { success: true, data: { EmailLogID: ... } }
        emailLogId = logResult.data?.EmailLogID || logResult.data || logResult;
        console.log(
          `[sendEmailWithTemplate] Đã tạo email log với ID: ${emailLogId}`
        );
      } catch (logError) {
        console.error(
          "[sendEmailWithTemplate] Lỗi khi tạo email log:",
          logError
        );
        // Tiếp tục gửi email dù có lỗi log
      }

      // Gửi email
      const result = await sendEmail({
        to: recipientEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br>"), // Convert newlines to HTML breaks
      });

      // Cập nhật log thành công (status: SENT)
      if (emailLogId) {
        try {
          await emailLogService.updateEmailLogStatus(emailLogId, "SENT");
          console.log(
            `[sendEmailWithTemplate] Đã cập nhật email log ${emailLogId} thành SENT`
          );
        } catch (logError) {
          console.error(
            "[sendEmailWithTemplate] Lỗi khi cập nhật email log thành SENT:",
            logError
          );
        }
      }

      return {
        success: true,
        message: "Email đã được gửi thành công",
        templateCode,
        recipientEmail,
        emailLogId,
        result,
      };
    } catch (error) {
      console.error("Error sending email with template:", error);

      // Cập nhật log thất bại (status: FAILED)
      if (emailLogId) {
        try {
          await emailLogService.updateEmailLogStatus(
            emailLogId,
            "FAILED",
            error.message || "Lỗi không xác định khi gửi email"
          );
          console.log(
            `[sendEmailWithTemplate] Đã cập nhật email log ${emailLogId} thành FAILED`
          );
        } catch (logError) {
          console.error(
            "[sendEmailWithTemplate] Lỗi khi cập nhật email log thành FAILED:",
            logError
          );
        }
      } else {
        // Nếu chưa có log, tạo log với status FAILED
        try {
          const template = await emailTemplateService
            .getTemplateByCode(templateCode)
            .catch(() => null);
          const { subject, body } = template
            ? emailTemplateService.replaceVariables(template, variables)
            : { subject: "N/A", body: "N/A" };

          let recipientAccID = null;
          try {
            const account = await accountRepository.findAccountByEmail(
              recipientEmail
            );
            if (account && account.AccID) {
              recipientAccID = account.AccID;
            }
          } catch (e) {
            // Ignore
          }

          const logData = {
            TemplateID: template?.TemplateID || null,
            TemplateCode: templateCode,
            RecipientEmail: recipientEmail,
            RecipientAccID: recipientAccID,
            Subject: subject,
            Body: body,
            Variables: variables, // emailLogRepository sẽ tự động stringify
            Status: "FAILED",
            ErrorMessage: error.message || "Lỗi không xác định khi gửi email",
          };
          await emailLogService.createEmailLog(logData);
          console.log(`[sendEmailWithTemplate] Đã tạo email log FAILED`);
        } catch (logError) {
          console.error(
            "[sendEmailWithTemplate] Lỗi khi tạo email log FAILED:",
            logError
          );
        }
      }

      throw error;
    }
  },

  // Test gửi email (gửi đến email test)
  testSendEmail: async (templateId, testEmail, variables = {}) => {
    try {
      const template = await emailTemplateService.getTemplateById(templateId);

      // Thay thế biến
      const { subject, body } = emailTemplateService.replaceVariables(
        template,
        variables
      );

      // Gửi email test
      const result = await sendEmail({
        to: testEmail,
        subject: `[TEST] ${subject}`,
        text: body,
        html: body.replace(/\n/g, "<br>"),
      });

      return {
        success: true,
        message: "Email test đã được gửi thành công",
        templateId,
        testEmail,
        result,
      };
    } catch (error) {
      console.error("Error testing email:", error);
      throw error;
    }
  },

  // Preview template với variables
  previewTemplate: async (templateId, variables = {}) => {
    try {
      const template = await emailTemplateService.getTemplateById(templateId);

      // Thay thế biến
      const { subject, body } = emailTemplateService.replaceVariables(
        template,
        variables
      );

      return {
        subject,
        body,
        html: body.replace(/\n/g, "<br>"),
      };
    } catch (error) {
      console.error("Error previewing template:", error);
      throw error;
    }
  },
};

module.exports = emailTemplateService;
