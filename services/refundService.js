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
      const enrollment = await enrollmentRepository.findById(
        refundData.EnrollmentID
      );
      if (!enrollment) {
        throw new Error("Enrollment không tồn tại");
      }

      // Kiểm tra đã có yêu cầu hoàn tiền pending chưa
      const existingRefund = await refundRepository.findByEnrollmentId(
        refundData.EnrollmentID
      );
      if (existingRefund && existingRefund.Status === "pending") {
        throw new Error(
          "Đã có yêu cầu hoàn tiền đang chờ xử lý cho enrollment này"
        );
      }

      const refund = {
        RequestDate: refundData.RequestDate || new Date(),
        Reason: refundData.Reason,
        Status: refundData.Status || "pending",
        EnrollmentID: refundData.EnrollmentID,
      };

      const createdRefund = await refundRepository.create(refund);

      // Gửi email thông báo khi tạo refund (không block nếu lỗi)
      if (createdRefund && createdRefund.RefundID) {
        try {
          const {
            notifyRefundCreated,
          } = require("../utils/emailNotificationHelper");
          await notifyRefundCreated(createdRefund.RefundID);
        } catch (emailError) {
          console.error(
            "[createRefund] Error sending email notification:",
            emailError
          );
        }
      }

      return createdRefund;
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

      // Bảng refundrequest hiện không có cột TargetClassID, tránh cập nhật gây lỗi
      const safeUpdate = { ...updateData };
      delete safeUpdate.TargetClassID;

      return await refundRepository.update(refundId, safeUpdate);
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

  // Duyệt yêu cầu hoàn tiền (chuyển status từ pending sang approved)
  async approveRefund(refundId) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }

      if (refund.Status !== "pending") {
        throw new Error(
          "Chỉ có thể duyệt yêu cầu hoàn tiền ở trạng thái pending"
        );
      }

      // Cập nhật status của refund sang approved
      await refundRepository.update(refundId, { Status: "approved" });

      const updatedRefund = await refundRepository.findById(refundId);

      // Cập nhật trạng thái enrollment thành Cancelled (hủy đăng ký)
      if (updatedRefund?.EnrollmentID) {
        try {
          const enrollment = await enrollmentRepository.findById(
            updatedRefund.EnrollmentID
          );
          if (enrollment && enrollment.Status !== "Cancelled") {
            await enrollmentRepository.update(updatedRefund.EnrollmentID, {
              Status: "Change",
            });
          }
        } catch (enrollmentError) {
          console.error(
            "[approveRefund] Error updating enrollment status:",
            enrollmentError
          );
          // Không throw error để không block việc approve refund
        }
      }

      // Gửi email thông báo (không block nếu lỗi)
      try {
        const {
          notifyRefundApproved,
        } = require("../utils/emailNotificationHelper");
        await notifyRefundApproved(refundId);
      } catch (emailError) {
        console.error(
          "[approveRefund] Error sending email notification:",
          emailError
        );
      }

      return updatedRefund;
    } catch (error) {
      throw error;
    }
  }

  // // Hoàn tiền (chuyển status từ approved sang completed)
  // async completeRefund(refundId) {
  //   try {
  //     const refund = await refundRepository.findById(refundId);
  //     if (!refund) {
  //       throw new Error("Không tìm thấy yêu cầu hoàn tiền");
  //     }

  //     if (refund.Status !== "approved") {
  //       throw new Error(
  //         "Chỉ có thể hoàn tiền khi yêu cầu ở trạng thái approved"
  //       );
  //     }

  //     // Cập nhật status của refund sang completed
  //     await refundRepository.update(refundId, { Status: "completed" });

  //     // Cập nhật status của payment thành refunded
  //     if (refund.PaymentID) {
  //       await paymentRepository.update(refund.PaymentID, {
  //         Status: "refunded",
  //       });
  //     }

  //     // Cập nhật status của enrollment nếu cần
  //     // await enrollmentRepository.update(refund.EnrollmentID, { Status: "cancelled" });

  //     const updatedRefund = await refundRepository.findById(refundId);

  //     // Gửi email thông báo (không block nếu lỗi)
  //     try {
  //       const {
  //         notifyRefundCompleted,
  //       } = require("../utils/emailNotificationHelper");
  //       await notifyRefundCompleted(refundId);
  //     } catch (emailError) {
  //       console.error(
  //         "[completeRefund] Error sending email notification:",
  //         emailError
  //       );
  //     }

  //     return updatedRefund;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // Từ chối yêu cầu hoàn tiền (chuyển status từ pending sang rejected)
  async rejectRefund(refundId, rejectionReason = null) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }

      if (refund.Status !== "pending") {
        throw new Error(
          "Chỉ có thể từ chối yêu cầu hoàn tiền ở trạng thái pending"
        );
      }

      const updateData = { Status: "rejected" };
      if (rejectionReason) {
        updateData.Reason = `${refund.Reason}\n\nLý do từ chối: ${rejectionReason}`;
      }

      await refundRepository.update(refundId, updateData);

      // Gửi email thông báo (không block nếu lỗi)
      try {
        const {
          notifyRefundRejected,
        } = require("../utils/emailNotificationHelper");
        await notifyRefundRejected(refundId, rejectionReason);
      } catch (emailError) {
        console.error(
          "[rejectRefund] Error sending email notification:",
          emailError
        );
      }

      return await refundRepository.findById(refundId);
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

  // Gửi email yêu cầu thông tin tài khoản để hoàn tiền
  async requestAccountInfo(refundId) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }

      // Chỉ gửi khi đang pending (đang chờ xử lý)
      if (refund.Status !== "pending") {
        throw new Error(
          "Chỉ gửi yêu cầu thông tin khi yêu cầu hoàn tiền đang chờ xử lý"
        );
      }

      const {
        notifyRefundAccountInfoRequest,
      } = require("../utils/emailNotificationHelper");

      await notifyRefundAccountInfoRequest(refundId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách lớp có thể chuyển (cùng giảng viên & khóa học, trạng thái ACTIVE)
  async getRelatedClasses(refundId) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new Error("Không tìm thấy yêu cầu hoàn tiền");
      }
      return await refundRepository.findRelatedClasses(refundId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RefundService();
