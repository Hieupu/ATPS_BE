const paymentRepository = require("../repositories/paymentRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class PaymentService {
  async getPaymentHistory(learnerId) {
    try {
      return await paymentRepository.getPaymentHistory(learnerId);
    } catch (error) {
      console.error("Error in getPaymentHistory service:", error);
      throw error;
    }
  }

  async requestRefund(enrollmentId, reason) {
    try {
      console.log("Checking enrollment details for ID:", enrollmentId);
      
      const enrollment = await paymentRepository.getEnrollmentDetails(enrollmentId);
      
      if (!enrollment) {
        throw new ServiceError("Không tìm thấy thông tin đăng ký học", 404);
      }

      console.log("Enrollment details:", enrollment);

      if (!enrollment.ClassID || !enrollment.ClassName) {
        throw new ServiceError("Không tìm thấy thông tin lớp học", 404);
      }

      const currentDate = new Date();
      const startDate = new Date(enrollment.Opendate || enrollment.OpendatePlan);
      
      console.log("Current date:", currentDate);
      console.log("Class start date:", startDate);

      if (startDate <= currentDate) {
        throw new ServiceError("Không thể hoàn tiền cho lớp học đã bắt đầu", 400);
      }

      const existingRefund = await paymentRepository.getExistingRefund(enrollmentId);
      if (existingRefund) {
        throw new ServiceError("Đã có yêu cầu hoàn tiền cho khóa học này", 409);
      }

      const payment = await paymentRepository.getPaymentByEnrollment(enrollmentId);
      if (!payment || payment.Status !== "success") {
        throw new ServiceError(
          "Chỉ có thể yêu cầu hoàn tiền cho các giao dịch đã thanh toán thành công",
          400
        );
      }

      const refundRequest = await paymentRepository.createRefundRequest(
        enrollmentId, 
        reason
      );

      return { 
        success: true, 
        message: "Yêu cầu hoàn tiền đã được gửi thành công",
        refundRequest 
      };
    } catch (error) {
      console.error("Error in requestRefund service:", error);
      throw error;
    }
  }

  async cancelRefundRequest(refundId) {
    try {
      console.log("Canceling refund request:", refundId);
      
      // Kiểm tra refund request tồn tại
      const refundRequest = await paymentRepository.getRefundRequestById(refundId);
      
      if (!refundRequest) {
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
      }

      if (refundRequest.Status !== "pending") {
        throw new ServiceError("Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý", 400);
      }

      // Cập nhật status thành cancelled
      const updatedRefund = await paymentRepository.updateRefundStatus(
        refundId, 
        'cancelled'
      );

      return { 
        success: true, 
        message: "Đã hủy yêu cầu hoàn tiền thành công",
        refundRequest: updatedRefund
      };
    } catch (error) {
      console.error("Error in cancelRefundRequest service:", error);
      throw error;
    }
  }

  async getAdminPaymentHistory(search) {
    try {
      return await paymentRepository.getAdminPaymentHistory(search);
    } catch (error) {
      console.error("Error in getAdminPaymentHistory service:", error);
      throw error;
    }
  }
}

module.exports = new PaymentService();