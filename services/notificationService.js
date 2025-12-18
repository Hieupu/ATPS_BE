const notificationRepository = require("../repositories/notificationRepository");
const connectDB = require("../config/db");
class NotificationService {
  // Format "YYYY-MM-DD" (or any parsable date string) to "DD/MM/YYYY" for Vietnamese content
  formatDateVI(dateStr) {
    try {
      if (!dateStr) return "";
      // Common case: YYYY-MM-DD
      if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
      }
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return String(dateStr);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return String(dateStr || "");
    }
  }

  async getLearnerAccIdsByClassId(classId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT DISTINCT l.AccID
       FROM enrollment e
       INNER JOIN learner l ON e.LearnerID = l.LearnerID
       WHERE e.ClassID = ?
         AND l.AccID IS NOT NULL
         AND e.Status = 'Enrolled'`,
      [classId]
    );
    return rows.map((r) => r.AccID).filter(Boolean);
  }

  async createBulk({ accIds = [], content, type = "info" }) {
    if (!Array.isArray(accIds) || accIds.length === 0) return;
    await Promise.all(
      accIds.filter(Boolean).map(async (accId) => {
        try {
          await notificationRepository.createNotification({
            accId,
            content,
            type,
            status: "unread",
          });
        } catch (e) {
          console.error(
            `[notificationService] Failed to create notification for AccID=${accId}:`,
            e?.message || e
          );
        }
      })
    );
  }

  async listByAccount(accId, options) {
    return await notificationRepository.getNotificationsByAccount(
      accId,
      options
    );
  }

  async create({ content, type, accId }) {
    if (!accId || !content) throw new Error("Missing accId or content");
    return await notificationRepository.createNotification({
      content,
      type,
      accId,
    });
  }

  async markAsRead(notificationId, accId) {
    return await notificationRepository.markAsRead(notificationId, accId);
  }

  async markAllAsRead(accId) {
    return await notificationRepository.markAllAsRead(accId);
  }

  async deletePaymentNotificationByOrderCode(accId, orderCode) {
    return await notificationRepository.deletePaymentNotificationByOrderCode(
      accId,
      orderCode
    );
  }
async createRefundNotification(enrollmentId, refundId, action) {
  try {
    const db = await connectDB();
    
    // Lấy thông tin enrollment và tất cả AccID của admin trong một transaction
    const [results] = await db.query(
      `-- Lấy AccID của learner
       SELECT ? as RefundID, l.AccID as LearnerAccID, 'learner' as Role
       FROM enrollment e 
       INNER JOIN learner l ON e.LearnerID = l.LearnerID 
       WHERE e.EnrollmentID = ?
       
       UNION ALL
       
       -- Lấy tất cả AccID của admin active
       SELECT ? as RefundID, a.AccID as LearnerAccID, 'admin' as Role
       FROM admin a 
       INNER JOIN account acc ON a.AccID = acc.AccID 
       WHERE acc.Status = 'active'`,
      [refundId, enrollmentId, refundId]
    );
    
    if (results.length === 0) return;
    
    // Tách kết quả: phần tử đầu tiên là learner, các phần tử sau là admin
    const learnerNotification = results.find(r => r.Role === 'learner');
    const adminNotifications = results.filter(r => r.Role === 'admin');
    
    const messages = {
      'requested': {
        learner: `Yêu cầu hoàn tiền #${refundId} của bạn đã được gửi thành công và đang chờ xử lý.`,
        admin: `Có yêu cầu hoàn tiền mới #${refundId} từ học viên cần xử lý.`
      },
      'cancelled': {
        learner: `Yêu cầu hoàn tiền #${refundId} của bạn đã được hủy.`,
        admin: `Yêu cầu hoàn tiền #${refundId} đã bị hủy bởi học viên.`
      },
      'approved': {
        learner: `Yêu cầu hoàn tiền #${refundId} của bạn đã được chấp nhận.`,
        admin: `Yêu cầu hoàn tiền #${refundId} đã được phê duyệt.`
      },
      'rejected': {
        learner: `Yêu cầu hoàn tiền #${refundId} của bạn đã bị từ chối.`,
        admin: `Yêu cầu hoàn tiền #${refundId} đã bị từ chối.`
      }
    };

    const messageSet = messages[action] || {
      learner: `Cập nhật trạng thái hoàn tiền #${refundId}`,
      admin: `Cập nhật trạng thái hoàn tiền #${refundId}`
    };

    // Chuẩn bị tất cả notifications để insert một lần
    const notificationsToInsert = [];

    // Thêm notification cho learner
    if (learnerNotification) {
      notificationsToInsert.push([
        learnerNotification.LearnerAccID,
        messageSet.learner,
        'refund',
        'unread'
      ]);
    }

    // Thêm notifications cho từng admin
    adminNotifications.forEach(admin => {
      notificationsToInsert.push([
        admin.LearnerAccID,
        messageSet.admin,
        'refund_admin',
        'unread'
      ]);
    });

    // Insert tất cả notifications trong một query
    if (notificationsToInsert.length > 0) {
      await db.query(
        `INSERT INTO notification (AccID, Content, Type, Status) 
         VALUES ?`,
        [notificationsToInsert]
      );

      console.log(`Created ${notificationsToInsert.length} notifications: 1 for learner, ${adminNotifications.length} for admins`);
    }

  } catch (error) {
    console.error("Error creating refund notification:", error);
  }
}
// async createRefundNotification(enrollmentId, refundId, action) {
//     try {
//       const db = await connectDB();

//       // Lấy thông tin enrollment để lấy AccID của learner
//       const [enrollmentRows] = await db.query(
//         `SELECT e.*, l.AccID 
//          FROM enrollment e 
//          INNER JOIN learner l ON e.LearnerID = l.LearnerID 
//          WHERE e.EnrollmentID = ?`,
//         [enrollmentId]
//       );

//       if (enrollmentRows.length === 0) return;

//       const enrollment = enrollmentRows[0];
//       const messages = {
//         requested: `Yêu cầu hoàn tiền #${refundId} của bạn đã được gửi thành công và đang chờ xử lý.`,
//         cancelled: `Yêu cầu hoàn tiền #${refundId} của bạn đã được hủy.`,
//         approved: `Yêu cầu hoàn tiền #${refundId} của bạn đã được chấp nhận.`,
//         rejected: `Yêu cầu hoàn tiền #${refundId} của bạn đã bị từ chối.`,
//       };

//       const content =
//         messages[action] || `Cập nhật trạng thái hoàn tiền #${refundId}`;

//       await db.query(
//         `INSERT INTO notification (AccID, Content, Type, Status) 
//          VALUES (?, ?, 'refund', 'unread')`,
//         [enrollment.AccID, content]
//       );

//       console.log(
//         `Refund notification created for AccID: ${enrollment.AccID}, Action: ${action}`
//       );
//     } catch (error) {
//       console.error("Error creating refund notification:", error);
//       // Không throw error để không ảnh hưởng đến flow chính
//     }
//   }

//   /**
//    * Thông báo đổi lớp cho học viên
//    * Ví dụ nội dung: "Bạn đã được đổi lớp từ lớp {oldClassName} sang {newClassName}."
//    */
//   async createClassChangeNotification(
//     enrollmentId,
//     oldClassName,
//     newClassName
//   ) {
//     try {
//       const db = await connectDB();

//       const [enrollmentRows] = await db.query(
//         `SELECT e.*, l.AccID 
//          FROM enrollment e 
//          INNER JOIN learner l ON e.LearnerID = l.LearnerID 
//          WHERE e.EnrollmentID = ?`,
//         [enrollmentId]
//       );

//       if (enrollmentRows.length === 0) return;

//       const enrollment = enrollmentRows[0];
//       const safeOldName = oldClassName || "lớp cũ";
//       const safeNewName = newClassName || "lớp mới";

//       const content = `Bạn đã được đổi lớp từ lớp "${safeOldName}" sang "${safeNewName}".`;

//       await db.query(
//         `INSERT INTO notification (AccID, Content, Type, Status) 
//          VALUES (?, ?, 'class', 'unread')`,
//         [enrollment.AccID, content]
//       );

//       console.log(
//         `Class change notification created for AccID: ${enrollment.AccID}, from "${safeOldName}" to "${safeNewName}"`
//       );
//     } catch (error) {
//       console.error("Error creating class change notification:", error);
//       // Không throw error để không ảnh hưởng đến flow chính
//     }
//   }

//   /**
//    * Notify learners of a class when a session is rescheduled successfully.
//    * Content (VI): Buổi học của lớp {} ngày {} đã được chuyển sang ngày {}...
//    */
//   async notifyClassSessionRescheduled({
//     classId,
//     className,
//     oldDate,
//     newDate,
//   }) {
//     try {
//       const safeName = className || `Class ${classId}`;
//       const oldD = this.formatDateVI(oldDate);
//       const newD = this.formatDateVI(newDate);

//       const content = `Buổi học của lớp "${safeName}" ngày ${oldD} đã được chuyển sang ngày ${newD}. Vui lòng xem lại lịch học để nắm thông tin cập nhật mới nhất.`;
//       const learnerAccIds = await this.getLearnerAccIdsByClassId(classId);
//       if (!learnerAccIds || learnerAccIds.length === 0) return;

//       await this.createBulk({
//         accIds: learnerAccIds,
//         content,
//         type: "session_rescheduled",
//       });
//     } catch (error) {
//       console.error("Error notifyClassSessionRescheduled:", error);
//       // Don't throw to avoid breaking main flow
//     }
//   }

//   /**
//    * Notify learners (if any), instructor, and staff when class start date is postponed.
//    * Content (VI): Lớp {} đã được điều chỉnh ngày bắt đầu sang {}...
//    */
//   async notifyClassStartDatePostponed({
//     classId,
//     className,
//     newOpendatePlan,
//     instructorId,
//     createdByStaffId,
//   }) {
//     try {
//       const safeName = className || `Class ${classId}`;
//       const newD = this.formatDateVI(newOpendatePlan);
//       const content = `Lớp "${safeName}" đã được điều chỉnh ngày bắt đầu sang ${newD}. Vui lòng xem lại lịch học để nắm thông tin cập nhật mới nhất.`;

//       const accIds = new Set();

//       // Learners (if any)
//       const learnerAccIds = await this.getLearnerAccIdsByClassId(classId);
//       learnerAccIds.forEach((id) => accIds.add(id));

//       // Instructor
//       if (instructorId) {
//         const instructorRepository = require("../repositories/instructorRepository");
//         const instructor = await instructorRepository.findById(instructorId);
//         if (instructor?.AccID) accIds.add(instructor.AccID);
//       }

//       // Staff (creator)
//       if (createdByStaffId) {
//         const staffRepository = require("../repositories/staffRepository");
//         const staff = await staffRepository.findById(createdByStaffId);
//         if (staff?.AccID) accIds.add(staff.AccID);
//       }

//       const finalAccIds = Array.from(accIds).filter(Boolean);
//       if (finalAccIds.length === 0) return;

//       await this.createBulk({
//         accIds: finalAccIds,
//         content,
//         type: "class_startdate_changed",
//       });
//     } catch (error) {
//       console.error("Error notifyClassStartDatePostponed:", error);
//       // Don't throw to avoid breaking main flow
//     }
//   }
}

module.exports = new NotificationService();
