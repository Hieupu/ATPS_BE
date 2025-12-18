const notificationRepository = require("../repositories/notificationRepository");
const connectDB = require("../config/db");
class NotificationService {
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
}

module.exports = new NotificationService();
