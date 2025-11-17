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
    
    // Lấy thông tin enrollment để lấy AccID của learner
    const [enrollmentRows] = await db.query(
      `SELECT e.*, l.AccID 
       FROM enrollment e 
       INNER JOIN learner l ON e.LearnerID = l.LearnerID 
       WHERE e.EnrollmentID = ?`,
      [enrollmentId]
    );
    
    if (enrollmentRows.length === 0) return;
    
    const enrollment = enrollmentRows[0];
    const messages = {
      'requested': `Yêu cầu hoàn tiền #${refundId} của bạn đã được gửi thành công và đang chờ xử lý.`,
      'cancelled': `Yêu cầu hoàn tiền #${refundId} của bạn đã được hủy.`,
      'approved': `Yêu cầu hoàn tiền #${refundId} của bạn đã được chấp nhận.`,
      'rejected': `Yêu cầu hoàn tiền #${refundId} của bạn đã bị từ chối.`
    };

    const content = messages[action] || `Cập nhật trạng thái hoàn tiền #${refundId}`;

    // Tạo notification - BỎ CreatedDate
    await db.query(
      `INSERT INTO notification (AccID, Content, Type, Status) 
       VALUES (?, ?, 'refund', 'unread')`,
      [enrollment.AccID, content]
    );

    console.log(`Refund notification created for AccID: ${enrollment.AccID}, Action: ${action}`);
  } catch (error) {
    console.error("Error creating refund notification:", error);
    // Không throw error để không ảnh hưởng đến flow chính
  }
}
}

module.exports = new NotificationService();
