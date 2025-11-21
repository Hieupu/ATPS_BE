const refundRepository = require("../repositories/refundRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const paymentRepository = require("../repositories/paymentRepository");

class RefundService {
  // Tạo yêu cầu hoàn tiền
  async createRefund(refundData) {
    try {
      // Validate required fields
      if (!refundData.EnrollmentID || !refundData.Reason) {
        throw new Error("EnrollmentID và Reason là bắt buộc");
      }

      // Kiểm tra enrollment tồn tại
      const enrollment = await enrollmentRepository.findById(refundData.EnrollmentID);
      if (!enrollment) {
        throw new Error("Enrollment không tồn tại");
      }

      // Kiểm tra đã có yêu cầu hoàn tiền chưa
      const existingRefunds = await refundRepository.findByStatus("pending");
      const hasPendingRefund = existingRefunds.some(
        (r) => r.EnrollmentID === refundData.EnrollmentID
      );

      if (hasPendingRefund) {
        throw new Error("Đã có yêu cầu hoàn tiền đang chờ xử lý cho enrollment này");
      }

      const refund = {
        RequestDate: refundData.RequestDate || new Date(),
        Reason: refundData.Reason,
        Status: refundData.Status || "pending",
        EnrollmentID: refundData.EnrollmentID,
      };

      return await refundRepository.create(refund);
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả yêu cầu hoàn tiền
  async getAllRefunds(options = {}) {
    try {
      const refunds = await refundRepository.findAll(options);
      const total = await refundRepository.count(options);

      return {
        data: refunds,
        total,
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: Math.ceil(total / (options.limit || 10)),
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy yêu cầu hoàn tiền theo ID
  async getRefundById(refundId) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }
      return refund;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật yêu cầu hoàn tiền
  async updateRefund(refundId, updateData) {
    try {
      // Kiểm tra yêu cầu hoàn tiền tồn tại
      const existingRefund = await refundRepository.findById(refundId);
      if (!existingRefund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }

      return await refundRepository.update(refundId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Xóa yêu cầu hoàn tiền
  async deleteRefund(refundId) {
    try {
      const deleted = await refundRepository.delete(refundId);
      if (!deleted) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Duyệt yêu cầu hoàn tiền (chuyển status từ pending sang completed)
  async approveRefund(refundId) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }

      if (refund.Status !== "pending") {
        throw new Error("Chỉ có thể duyệt yêu cầu hoàn tiền ở trạng thái pending");
      }

      // Cập nhật status của refund
      await refundRepository.update(refundId, { Status: "completed" });

      // Cập nhật status của payment thành refunded
      if (refund.PaymentID) {
        await paymentRepository.update(refund.PaymentID, { Status: "refunded" });
      }

      // Cập nhật status của enrollment nếu cần
      // await enrollmentRepository.update(refund.EnrollmentID, { Status: "cancelled" });

      return await refundRepository.findById(refundId);
    } catch (error) {
      throw error;
    }
  }

  // Từ chối yêu cầu hoàn tiền (chuyển status từ pending sang rejected)
  async rejectRefund(refundId, rejectionReason = null) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }

      if (refund.Status !== "pending") {
        throw new Error("Chỉ có thể từ chối yêu cầu hoàn tiền ở trạng thái pending");
      }

      const updateData = { Status: "rejected" };
      if (rejectionReason) {
        updateData.Reason = `${refund.Reason}\n\nLý do từ chối: ${rejectionReason}`;
      }

      return await refundRepository.update(refundId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Lấy yêu cầu hoàn tiền theo trạng thái
  async getRefundsByStatus(status) {
    try {
      return await refundRepository.findByStatus(status);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RefundService();


