const emailTemplateService = require("../services/emailTemplateService");
const accountRepository = require("../repositories/accountRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const classRepository = require("../repositories/classRepository");
const paymentRepository = require("../repositories/paymentRepository");

/**
 * Helper function để gửi email tự động khi có sự kiện
 * @param {string} templateCode - Mã template email
 * @param {string} recipientEmail - Email người nhận
 * @param {Object} variables - Các biến để thay thế trong template
 * @returns {Promise<Object>} - Kết quả gửi email
 */
async function sendEmailNotification(templateCode, recipientEmail, variables = {}) {
  try {
    if (!recipientEmail) {
      console.warn(`[sendEmailNotification] Không có email người nhận cho template ${templateCode}`);
      return { success: false, message: "Không có email người nhận" };
    }

    const result = await emailTemplateService.sendEmailWithTemplate(
      templateCode,
      recipientEmail,
      variables
    );

    console.log(`[sendEmailNotification] Đã gửi email ${templateCode} đến ${recipientEmail}`);
    return result;
  } catch (error) {
    console.error(`[sendEmailNotification] Lỗi khi gửi email ${templateCode}:`, error);
    // Không throw error để không làm gián đoạn flow chính
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email khi trạng thái tài khoản thay đổi
 */
async function notifyAccountStatusChange(accountId, oldStatus, newStatus) {
  try {
    const account = await accountRepository.findById(accountId);
    if (!account || !account.Email) {
      return { success: false, message: "Không tìm thấy email của tài khoản" };
    }

    // Lấy tên người dùng từ learner hoặc instructor
    let userName = account.Email;
    try {
      const learnerRepository = require("../repositories/learnerRepository");
      const learner = await learnerRepository.findByAccountId(accountId);
      if (learner && learner.FullName) {
        userName = learner.FullName;
      } else {
        // Không phải learner, thử instructor
        const instructorRepository = require("../repositories/instructorRepository");
        const instructor = await instructorRepository.findByAccountId(accountId);
        if (instructor && instructor.FullName) {
          userName = instructor.FullName;
        }
      }
    } catch (e) {
      // Không tìm thấy, dùng email
      console.warn(`[notifyAccountStatusChange] Không tìm thấy learner/instructor cho AccID ${accountId}:`, e.message);
    }

    return await sendEmailNotification(
      "ACCOUNT_STATUS_CHANGED",
      account.Email,
      {
        userName,
        oldStatus: oldStatus || "N/A",
        newStatus: newStatus || "N/A",
      }
    );
  } catch (error) {
    console.error("[notifyAccountStatusChange] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email khi lớp học bị hủy
 */
async function notifyClassCancelled(classId, reason = "Lớp học đã bị hủy") {
  try {
    const classData = await classRepository.findById(classId);
    if (!classData || classData.length === 0) {
      return { success: false, message: "Không tìm thấy lớp học" };
    }

    const classInfo = classData[0];
    const enrollments = await enrollmentRepository.findByClassId(classId);

    const results = [];

    for (const enrollment of enrollments) {
      try {
        const learnerRepository = require("../repositories/learnerRepository");
        const learner = await learnerRepository.findById(enrollment.LearnerID);
        if (!learner) continue;

        const account = await accountRepository.findById(learner.AccID);
        if (!account || !account.Email) continue;

        const result = await sendEmailNotification(
          "CLASS_CANCELLED",
          account.Email,
          {
            userName: learner.FullName || account.Email,
            className: classInfo.Name || "N/A",
            classCode: `ClassID: ${classId}`,
            reason: reason,
          }
        );

        results.push({ email: account.Email, result });
      } catch (error) {
        console.error(`[notifyClassCancelled] Error sending to enrollment ${enrollment.EnrollmentID}:`, error);
        results.push({ email: "N/A", result: { success: false, error: error.message } });
      }
    }

    return {
      success: true,
      totalSent: results.filter((r) => r.result.success).length,
      totalFailed: results.filter((r) => !r.result.success).length,
      results,
    };
  } catch (error) {
    console.error("[notifyClassCancelled] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email khi tạo yêu cầu hoàn tiền
 */
async function notifyRefundCreated(refundId) {
  try {
    const refundRepository = require("../repositories/refundRepository");
    const refund = await refundRepository.findById(refundId);
    if (!refund) {
      return { success: false, message: "Không tìm thấy yêu cầu hoàn tiền" };
    }

    const enrollment = await enrollmentRepository.findById(refund.EnrollmentID);
    if (!enrollment) {
      return { success: false, message: "Không tìm thấy enrollment" };
    }

    const learnerRepository = require("../repositories/learnerRepository");
    const learner = await learnerRepository.findById(enrollment.LearnerID);
    if (!learner) {
      return { success: false, message: "Không tìm thấy học viên" };
    }

    const account = await accountRepository.findById(learner.AccID);
    if (!account || !account.Email) {
      return { success: false, message: "Không tìm thấy email của học viên" };
    }

    const classData = await classRepository.findById(enrollment.ClassID);
    const className = classData && classData.length > 0 ? classData[0].Name : "N/A";

    const payment = await paymentRepository.findByEnrollmentId(refund.EnrollmentID);
    const refundAmount = payment && payment.length > 0 ? payment[0].Amount : 0;

    return await sendEmailNotification(
      "REFUND_CREATED",
      account.Email,
      {
        userName: learner.FullName || account.Email,
        className: className,
        refundCode: `RefundID: ${refundId}`,
        refundAmount: new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(refundAmount),
        reason: refund.Reason || "N/A",
      }
    );
  } catch (error) {
    console.error("[notifyRefundCreated] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email khi duyệt yêu cầu hoàn tiền
 */
async function notifyRefundApproved(refundId) {
  try {
    const refundRepository = require("../repositories/refundRepository");
    const refund = await refundRepository.findById(refundId);
    if (!refund) {
      return { success: false, message: "Không tìm thấy yêu cầu hoàn tiền" };
    }

    const enrollment = await enrollmentRepository.findById(refund.EnrollmentID);
    if (!enrollment) {
      return { success: false, message: "Không tìm thấy enrollment" };
    }

    const learnerRepository = require("../repositories/learnerRepository");
    const learner = await learnerRepository.findById(enrollment.LearnerID);
    if (!learner) {
      return { success: false, message: "Không tìm thấy học viên" };
    }

    const account = await accountRepository.findById(learner.AccID);
    if (!account || !account.Email) {
      return { success: false, message: "Không tìm thấy email của học viên" };
    }

    const classData = await classRepository.findById(enrollment.ClassID);
    const className = classData && classData.length > 0 ? classData[0].Name : "N/A";

    const payment = await paymentRepository.findByEnrollmentId(refund.EnrollmentID);
    const refundAmount = payment && payment.length > 0 ? payment[0].Amount : 0;

    return await sendEmailNotification(
      "REFUND_APPROVED",
      account.Email,
      {
        userName: learner.FullName || account.Email,
        refundCode: `RefundID: ${refundId}`,
        refundAmount: new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(refundAmount),
        className: className,
      }
    );
  } catch (error) {
    console.error("[notifyRefundApproved] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email khi từ chối yêu cầu hoàn tiền
 */
async function notifyRefundRejected(refundId, rejectionReason = "") {
  try {
    const refundRepository = require("../repositories/refundRepository");
    const refund = await refundRepository.findById(refundId);
    if (!refund) {
      return { success: false, message: "Không tìm thấy yêu cầu hoàn tiền" };
    }

    const enrollment = await enrollmentRepository.findById(refund.EnrollmentID);
    if (!enrollment) {
      return { success: false, message: "Không tìm thấy enrollment" };
    }

    const learnerRepository = require("../repositories/learnerRepository");
    const learner = await learnerRepository.findById(enrollment.LearnerID);
    if (!learner) {
      return { success: false, message: "Không tìm thấy học viên" };
    }

    const account = await accountRepository.findById(learner.AccID);
    if (!account || !account.Email) {
      return { success: false, message: "Không tìm thấy email của học viên" };
    }

    return await sendEmailNotification(
      "REFUND_REJECTED",
      account.Email,
      {
        userName: learner.FullName || account.Email,
        refundCode: `RefundID: ${refundId}`,
        rejectionReason: rejectionReason || "Không được cung cấp",
      }
    );
  } catch (error) {
    console.error("[notifyRefundRejected] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email khi hoàn tiền hoàn tất
 */
async function notifyRefundCompleted(refundId) {
  try {
    const refundRepository = require("../repositories/refundRepository");
    const refund = await refundRepository.findById(refundId);
    if (!refund) {
      return { success: false, message: "Không tìm thấy yêu cầu hoàn tiền" };
    }

    const enrollment = await enrollmentRepository.findById(refund.EnrollmentID);
    if (!enrollment) {
      return { success: false, message: "Không tìm thấy enrollment" };
    }

    const learnerRepository = require("../repositories/learnerRepository");
    const learner = await learnerRepository.findById(enrollment.LearnerID);
    if (!learner) {
      return { success: false, message: "Không tìm thấy học viên" };
    }

    const account = await accountRepository.findById(learner.AccID);
    if (!account || !account.Email) {
      return { success: false, message: "Không tìm thấy email của học viên" };
    }

    const classData = await classRepository.findById(enrollment.ClassID);
    const className = classData && classData.length > 0 ? classData[0].Name : "N/A";

    const payment = await paymentRepository.findByEnrollmentId(refund.EnrollmentID);
    const refundAmount = payment && payment.length > 0 ? payment[0].Amount : 0;

    const completedDate = new Date().toLocaleDateString("vi-VN");

    return await sendEmailNotification(
      "REFUND_COMPLETED",
      account.Email,
      {
        userName: learner.FullName || account.Email,
        refundCode: `RefundID: ${refundId}`,
        refundAmount: new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(refundAmount),
        className: className,
        completedDate: completedDate,
      }
    );
  } catch (error) {
    console.error("[notifyRefundCompleted] Error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmailNotification,
  notifyAccountStatusChange,
  notifyClassCancelled,
  notifyRefundCreated,
  notifyRefundApproved,
  notifyRefundRejected,
  notifyRefundCompleted,
};

