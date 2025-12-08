const refundService = require("../services/refundService");
const logService = require("../services/logService");

const refundController = {
  // Tạo yêu cầu hoàn tiền
  createRefund: async (req, res) => {
    try {
      const refundData = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      const newRefund = await refundService.createRefund(refundData);

      // Ghi log CREATE_REFUND_REQUEST
      if (adminAccID && newRefund?.RefundID) {
        await logService.logAction({
          action: "CREATE_REFUND_REQUEST",
          accId: adminAccID,
          detail: `RefundID: ${newRefund.RefundID}, EnrollmentID: ${newRefund.EnrollmentID}`,
        });
      }

      res.status(201).json({
        success: true,
        message: "Tạo yêu cầu hoàn tiền thành công",
        data: newRefund,
      });
    } catch (error) {
      console.error("Error creating refund:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo yêu cầu hoàn tiền",
        error: error.message,
      });
    }
  },

  // Lấy tất cả yêu cầu hoàn tiền
  getAllRefunds: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: status || null,
        search: search || "",
      };

      const result = await refundService.getAllRefunds(options);

      res.json({
        success: true,
        message: "Lấy danh sách yêu cầu hoàn tiền thành công",
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("Error getting refunds:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách yêu cầu hoàn tiền",
        error: error.message,
      });
    }
  },

  // Lấy yêu cầu hoàn tiền theo ID
  getRefundById: async (req, res) => {
    try {
      const { id } = req.params;
      const refund = await refundService.getRefundById(id);

      res.json({
        success: true,
        message: "Lấy thông tin yêu cầu hoàn tiền thành công",
        data: refund,
      });
    } catch (error) {
      console.error("Error getting refund:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Cập nhật yêu cầu hoàn tiền
  updateRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      const updatedRefund = await refundService.updateRefund(id, updateData);

      // Có thể add log UPDATE_REFUND nếu sau này cần

      res.json({
        success: true,
        message: "Cập nhật yêu cầu hoàn tiền thành công",
        data: updatedRefund,
      });
    } catch (error) {
      console.error("Error updating refund:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Xóa yêu cầu hoàn tiền
  deleteRefund: async (req, res) => {
    try {
      const { id } = req.params;
      await refundService.deleteRefund(id);

      res.json({
        success: true,
        message: "Xóa yêu cầu hoàn tiền thành công",
      });
    } catch (error) {
      console.error("Error deleting refund:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Lấy yêu cầu hoàn tiền theo trạng thái
  getRefundsByStatus: async (req, res) => {
    try {
      const { status } = req.query;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status là bắt buộc",
        });
      }

      const refunds = await refundService.getRefundsByStatus(status);

      res.json({
        success: true,
        message: "Lấy danh sách yêu cầu hoàn tiền theo trạng thái thành công",
        data: refunds,
      });
    } catch (error) {
      console.error("Error getting refunds by status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách yêu cầu hoàn tiền theo trạng thái",
        error: error.message,
      });
    }
  },

  // Duyệt yêu cầu hoàn tiền
  approveRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;
      const updatedRefund = await refundService.approveRefund(id);

      // Ghi log APPROVE_REFUND
      if (adminAccID && updatedRefund?.RefundID) {
        await logService.logAction({
          action: "APPROVE_REFUND",
          accId: adminAccID,
          detail: `RefundID: ${updatedRefund.RefundID}, EnrollmentID: ${updatedRefund.EnrollmentID}`,
        });
      }

      res.json({
        success: true,
        message: "Duyệt yêu cầu hoàn tiền thành công",
        data: updatedRefund,
      });
    } catch (error) {
      console.error("Error approving refund:", error);
      const statusCode =
        error.message.includes("Không tìm thấy") ||
        error.message.includes("Chỉ có thể")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Từ chối yêu cầu hoàn tiền
  rejectRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const adminAccID = req.user ? req.user.AccID : null;
      const updatedRefund = await refundService.rejectRefund(
        id,
        rejectionReason
      );

      // Ghi log REJECT_REFUND
      if (adminAccID && updatedRefund?.RefundID) {
        await logService.logAction({
          action: "REJECT_REFUND",
          accId: adminAccID,
          detail: `RefundID: ${updatedRefund.RefundID}, EnrollmentID: ${updatedRefund.EnrollmentID}`,
        });
      }

      res.json({
        success: true,
        message: "Từ chối yêu cầu hoàn tiền thành công",
        data: updatedRefund,
      });
    } catch (error) {
      console.error("Error rejecting refund:", error);
      const statusCode =
        error.message.includes("Không tìm thấy") ||
        error.message.includes("Chỉ có thể")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Hoàn tiền (approved -> completed)
  completeRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;

      const updatedRefund = await refundService.completeRefund(id);

      // Ghi log COMPLETE_REFUND
      if (adminAccID && updatedRefund?.RefundID) {
        await logService.logAction({
          action: "COMPLETE_REFUND",
          accId: adminAccID,
          detail: `RefundID: ${updatedRefund.RefundID}, EnrollmentID: ${updatedRefund.EnrollmentID}`,
        });
      }

      res.json({
        success: true,
        message: "Hoàn tiền thành công",
        data: updatedRefund,
      });
    } catch (error) {
      console.error("Error completing refund:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi hoàn tiền",
        error: error.message,
      });
    }
  },
};

module.exports = refundController;
