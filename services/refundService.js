const refundRepository = require("../repositories/refundRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const paymentRepository = require("../repositories/paymentRepository");
const notificationService = require("../services/notificationService");
const classRepository = require("../repositories/classRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class RefundService {
  // Tạo yêu cầu hoàn tiền
  async createRefund(refundData) {
    try {
      // Validate required fields
      if (!refundData.EnrollmentID || !refundData.Reason) {
        throw new ServiceError("Thiếu EnrollmentID hoặc Reason", 400);
      }

      // Kiểm tra enrollment tồn tại
      const enrollment = await enrollmentRepository.findById(
        refundData.EnrollmentID
      );
      if (!enrollment) {
        throw new ServiceError("Enrollment không tồn tại", 404);
      }

      // Kiểm tra đã có yêu cầu hoàn tiền pending chưa
      const existingRefund = await refundRepository.findByEnrollmentId(
        refundData.EnrollmentID
      );
      if (existingRefund && existingRefund.Status === "pending") {
        throw new ServiceError(
          "Đã có yêu cầu hoàn tiền đang chờ xử lý cho enrollment này",
          409
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
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
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
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
      }

      // Bảng refundrequest hiện không có cột TargetClassID, tránh cập nhật gây lỗi
      const safeUpdate = { ...updateData };
      delete safeUpdate.TargetClassID;

      const updatedRefund = await refundRepository.update(refundId, safeUpdate);

      // Nếu admin duyệt chuyển lớp (classapproved) và FE gửi kèm TargetClassID
      if (
        updateData &&
        typeof updateData.Status === "string" &&
        updateData.Status.toLowerCase() === "classapproved" &&
        updateData.TargetClassID &&
        existingRefund.EnrollmentID
      ) {
        try {
          // Lấy thông tin lớp cũ và lớp mới để hiển thị trong notification
          const oldClassData = await classRepository.findById(
            existingRefund.ClassID
          );
          const newClassData = await classRepository.findById(
            updateData.TargetClassID
          );

          const oldClassCoreName =
            (Array.isArray(oldClassData) && oldClassData[0]?.Name) ||
            existingRefund.ClassName ||
            "";
          const newClassCoreName =
            (Array.isArray(newClassData) && newClassData[0]?.Name) || "";

          const oldClassLabel = existingRefund.ClassID
            ? `${oldClassCoreName || "Lớp cũ"}`
            : oldClassCoreName || `Lớp ${existingRefund.ClassID || ""}`;

          const newClassLabel = updateData.TargetClassID
            ? `${newClassCoreName || "Lớp mới"}`
            : newClassCoreName || `Lớp ${updateData.TargetClassID}`;

          // Tạo notification in-app cho học viên
          await notificationService.createClassChangeNotification(
            existingRefund.EnrollmentID,
            oldClassLabel,
            newClassLabel
          );
        } catch (notifyError) {
          // Không block flow updateRefund nếu tạo thông báo lỗi
          console.error(
            "[updateRefund] Error creating class change notification:",
            notifyError
          );
        }
      }

      return updatedRefund;
    } catch (error) {
      throw error;
    }
  }

  // Xóa yêu cầu hoàn tiền
  async deleteRefund(refundId) {
    try {
      const deleted = await refundRepository.delete(refundId);
      if (!deleted) {
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Tính toán số tiền hoàn dựa trên quy tắc:
  // - Trước 1 tuần và học ít hơn 4 buổi: 100%
  // - Sau tuần 1 đến < 50% số buổi: 50%
  // - Sau 50% số buổi: 0%
  async calculateRefundAmount(enrollmentId) {
    try {
      const enrollment = await enrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new ServiceError("Không tìm thấy enrollment", 404);
      }

      // Lấy thông tin lớp học
      const classRepository = require("../repositories/classRepository");
      const classData = await classRepository.findById(enrollment.ClassID);
      if (!classData || classData.length === 0) {
        throw new ServiceError("Không tìm thấy lớp học", 404);
      }
      const classInfo = classData[0];

      // Lấy số tiền đã thanh toán
      const payment = await paymentRepository.findByEnrollmentId(enrollmentId);
      if (!payment || payment.length === 0) {
        throw new ServiceError("Không tìm thấy thông tin thanh toán", 404);
      }
      const paymentAmount = payment[0].Amount || 0;

      // Lấy ngày bắt đầu lớp (ưu tiên Opendate, nếu không có thì dùng OpendatePlan)
      const classStartDate = classInfo.Opendate
        ? new Date(classInfo.Opendate)
        : classInfo.OpendatePlan
        ? new Date(classInfo.OpendatePlan)
        : null;

      if (!classStartDate) {
        throw new ServiceError("Không tìm thấy ngày bắt đầu lớp học", 404);
      }

      // Lấy tổng số buổi học
      const totalSessions = classInfo.Numofsession || 0;

      // Đếm số buổi đã học (có attendance với Status = 'Present')
      const attendanceRepository = require("../repositories/attendanceRepository");
      const connectDB = require("../config/db");
      const db = await connectDB();
      const [attendanceRows] = await db.execute(
        `SELECT COUNT(DISTINCT a.SessionID) as attendedSessions
         FROM attendance a
         INNER JOIN session s ON a.SessionID = s.SessionID
         WHERE a.LearnerID = ? 
           AND s.ClassID = ? 
           AND a.Status = 'Present'`,
        [enrollment.LearnerID, enrollment.ClassID]
      );
      const attendedSessions = attendanceRows[0]?.attendedSessions || 0;

      // Tính số ngày từ ngày bắt đầu lớp đến hiện tại
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(classStartDate);
      startDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const isBeforeOneWeek = daysDiff < 7;

      // Tính phần trăm số buổi đã học
      const sessionPercentage =
        totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

      // Áp dụng quy tắc hoàn tiền
      let refundPercentage = 0;
      let refundReason = "";

      if (isBeforeOneWeek && attendedSessions < 4) {
        // Trước 1 tuần và học ít hơn 4 buổi: 100%
        refundPercentage = 100;
        refundReason = `Hoàn 100% học phí vì yêu cầu hoàn tiền trước 1 tuần kể từ ngày bắt đầu lớp (${startDate.toLocaleDateString(
          "vi-VN"
        )}) và đã học ít hơn 4 buổi (đã học ${attendedSessions}/${totalSessions} buổi)`;
      } else if (sessionPercentage < 50) {
        // Sau tuần 1 đến < 50% số buổi: 50%
        refundPercentage = 50;
        refundReason = `Hoàn 50% học phí vì đã học dưới 50% số buổi của lớp (đã học ${attendedSessions}/${totalSessions} buổi, tương đương ${sessionPercentage.toFixed(
          1
        )}%)`;
      } else {
        // Sau 50% số buổi: 0%
        refundPercentage = 0;
        refundReason = `Không hoàn tiền vì đã học từ 50% số buổi trở lên (đã học ${attendedSessions}/${totalSessions} buổi, tương đương ${sessionPercentage.toFixed(
          1
        )}%)`;
      }

      const refundAmount = Math.round((paymentAmount * refundPercentage) / 100);

      return {
        refundAmount,
        refundPercentage,
        refundReason,
        paymentAmount,
        attendedSessions,
        totalSessions,
        sessionPercentage: sessionPercentage.toFixed(1),
        isBeforeOneWeek,
        daysDiff,
      };
    } catch (error) {
      console.error("[calculateRefundAmount] Error:", error);
      throw error;
    }
  }

  // Duyệt yêu cầu hoàn tiền (chuyển status từ pending sang approved)
  async approveRefund(refundId) {
    try {
      const refund = await refundRepository.findById(refundId);
      if (!refund) {
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
      }

      if (refund.Status !== "pending") {
        throw new ServiceError(
          "Chỉ có thể duyệt yêu cầu hoàn tiền ở trạng thái pending",
          400
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
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
      }

      if (refund.Status !== "pending") {
        throw new ServiceError(
          "Chỉ có thể từ chối yêu cầu hoàn tiền ở trạng thái pending",
          400
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
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
      }

      // Chỉ gửi khi đang pending (đang chờ xử lý)
      if (refund.Status !== "pending") {
        throw new ServiceError(
          "Chỉ gửi yêu cầu thông tin khi yêu cầu hoàn tiền đang chờ xử lý",
          400
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
        throw new ServiceError("Không tìm thấy yêu cầu hoàn tiền", 404);
      }
      return await refundRepository.findRelatedClasses(refundId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RefundService();
