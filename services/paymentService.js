const paymentRepository = require("../repositories/paymentRepository");

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
        throw new Error("Không tìm thấy thông tin đăng ký học");
      }

      console.log("Enrollment details:", enrollment);

      if (!enrollment.ClassID || !enrollment.ClassName) {
        throw new Error("Không tìm thấy thông tin lớp học");
      }

      const currentDate = new Date();
      const startDate = new Date(enrollment.Opendate || enrollment.OpendatePlan);
      
      console.log("Current date:", currentDate);
      console.log("Class start date:", startDate);

      if (startDate <= currentDate) {
        throw new Error("Không thể hoàn tiền cho lớp học đã bắt đầu");
      }

      const existingRefund = await paymentRepository.getExistingRefund(enrollmentId);
      if (existingRefund) {
        throw new Error("Đã có yêu cầu hoàn tiền cho khóa học này");
      }

      const payment = await paymentRepository.getPaymentByEnrollment(enrollmentId);
      if (!payment || payment.Status !== 'success') {
        throw new Error("Chỉ có thể yêu cầu hoàn tiền cho các giao dịch đã thanh toán thành công");
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
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }

      if (refundRequest.Status !== 'pending') {
        throw new Error("Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý");
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
}

module.exports = new PaymentService();