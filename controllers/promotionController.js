const promotionService = require("../services/promotionService");
const logService = require("../services/logService");

const promotionController = {
  // Tạo promotion mới
  createPromotion: async (req, res) => {
    try {
      const promotionData = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      // Đảm bảo CreateBy luôn có giá trị từ authenticated user
      // Middleware verifyToken đã validate AccID tồn tại trong database
      if (!adminAccID) {
        console.error("[createPromotion] req.user is missing:", req.user);
        return res.status(401).json({
          success: false,
          message: "Không xác định được người tạo. Vui lòng đăng nhập lại.",
        });
      }

      // Override CreateBy từ req.user để đảm bảo an toàn
      // AccID đã được validate trong middleware verifyToken
      promotionData.CreateBy = adminAccID;

      const newPromotion = await promotionService.createPromotion(
        promotionData
      );

      // Ghi log CREATE_PROMOTION
      if (adminAccID && newPromotion?.PromotionID) {
        await logService.logAction({
          action: "CREATE_PROMOTION",
          accId: adminAccID,
          detail: `PromotionID: ${newPromotion.PromotionID}, Code: ${newPromotion.Code}`,
        });
      }

      res.status(201).json({
        success: true,
        message: "Tạo promotion thành công",
        data: newPromotion,
      });
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo promotion",
        error: error.message,
      });
    }
  },

  // Lấy tất cả promotions
  getAllPromotions: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: status || null,
        search: search || "",
      };

      const result = await promotionService.getAllPromotions(options);

      res.json({
        success: true,
        message: "Lấy danh sách promotion thành công",
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("Error getting promotions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách promotion",
        error: error.message,
      });
    }
  },

  // Lấy promotion theo ID
  getPromotionById: async (req, res) => {
    try {
      const { id } = req.params;
      const promotion = await promotionService.getPromotionById(id);

      res.json({
        success: true,
        message: "Lấy thông tin promotion thành công",
        data: promotion,
      });
    } catch (error) {
      console.error("Error getting promotion:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Lấy promotion theo Code
  getPromotionByCode: async (req, res) => {
    try {
      const { code } = req.params;
      const promotion = await promotionService.getPromotionByCode(code);

      res.json({
        success: true,
        message: "Lấy thông tin promotion thành công",
        data: promotion,
      });
    } catch (error) {
      console.error("Error getting promotion by code:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Cập nhật promotion
  updatePromotion: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      const updatedPromotion = await promotionService.updatePromotion(
        id,
        updateData
      );

      // Ghi log UPDATE_PROMOTION
      if (adminAccID && updatedPromotion?.PromotionID) {
        await logService.logAction({
          action: "UPDATE_PROMOTION",
          accId: adminAccID,
          detail: `PromotionID: ${updatedPromotion.PromotionID}, Code: ${updatedPromotion.Code}`,
        });
      }

      res.json({
        success: true,
        message: "Cập nhật promotion thành công",
        data: updatedPromotion,
      });
    } catch (error) {
      console.error("Error updating promotion:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Xóa promotion
  deletePromotion: async (req, res) => {
    try {
      const { id } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;

      // Lấy thông tin promotion trước khi xóa để log
      let promotion = null;
      if (adminAccID) {
        promotion = await promotionService.getPromotionById(id);
      }

      await promotionService.deletePromotion(id);

      // Ghi log DELETE_PROMOTION
      if (adminAccID && promotion) {
        await logService.logAction({
          action: "DELETE_PROMOTION",
          accId: adminAccID,
          detail: `PromotionID: ${promotion.PromotionID}, Code: ${promotion.Code}`,
        });
      }

      res.json({
        success: true,
        message: "Xóa promotion thành công",
      });
    } catch (error) {
      console.error("Error deleting promotion:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Lấy promotions theo trạng thái
  getPromotionsByStatus: async (req, res) => {
    try {
      const { status } = req.query;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status là bắt buộc",
        });
      }

      const promotions = await promotionService.getPromotionsByStatus(status);

      res.json({
        success: true,
        message: "Lấy danh sách promotion theo trạng thái thành công",
        data: promotions,
      });
    } catch (error) {
      console.error("Error getting promotions by status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách promotion theo trạng thái",
        error: error.message,
      });
    }
  },

  // Kiểm tra promotion có hợp lệ không
  validatePromotion: async (req, res) => {
    try {
      const { code } = req.params;
      const promotion = await promotionService.validatePromotion(code);

      if (!promotion) {
        return res.json({
          success: false,
          message: "Promotion không hợp lệ hoặc đã hết hạn",
          data: null,
        });
      }

      res.json({
        success: true,
        message: "Promotion hợp lệ",
        data: promotion,
      });
    } catch (error) {
      console.error("Error validating promotion:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra promotion",
        error: error.message,
      });
    }
  },

  // Kích hoạt promotion
  activatePromotion: async (req, res) => {
    try {
      const { id } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;
      const updatedPromotion = await promotionService.activatePromotion(id);

      // Có thể log nếu muốn: ACTIVATE_PROMOTION (không được yêu cầu trong spec, nên để sau)

      res.json({
        success: true,
        message: "Kích hoạt promotion thành công",
        data: updatedPromotion,
      });
    } catch (error) {
      console.error("Error activating promotion:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kích hoạt promotion",
        error: error.message,
      });
    }
  },

  // Vô hiệu hóa promotion
  deactivatePromotion: async (req, res) => {
    try {
      const { id } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;
      const updatedPromotion = await promotionService.deactivatePromotion(id);

      // Có thể log nếu muốn: DEACTIVATE_PROMOTION (không được yêu cầu trong spec, nên để sau)

      res.json({
        success: true,
        message: "Vô hiệu hóa promotion thành công",
        data: updatedPromotion,
      });
    } catch (error) {
      console.error("Error deactivating promotion:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi vô hiệu hóa promotion",
        error: error.message,
      });
    }
  },
};

module.exports = promotionController;
