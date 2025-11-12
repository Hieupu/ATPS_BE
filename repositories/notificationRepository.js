const connectDB = require("../config/db");

class NotificationRepository {
  async getNotificationsByAccount(accId, { limit = 20 } = {}) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT NotificationID, Content, Type, Status, AccID
       FROM notification
       WHERE AccID = ?
       ORDER BY NotificationID DESC
       LIMIT ?`,
      [accId, Math.max(1, Number(limit))]
    );
    return rows;
  }

  async createNotification({
    content,
    type = "info",
    status = "unread",
    accId,
  }) {
    const db = await connectDB();
    const [result] = await db.query(
      `INSERT INTO notification (Content, Type, Status, AccID)
       VALUES (?, ?, ?, ?)`,
      [content, type, status, accId]
    );
    return { NotificationID: result.insertId };
  }

  async markAsRead(notificationId, accId) {
    const db = await connectDB();
    const [result] = await db.query(
      `UPDATE notification SET Status = 'read' WHERE NotificationID = ? AND AccID = ?`,
      [notificationId, accId]
    );
    return result.affectedRows > 0;
  }

  async markAllAsRead(accId) {
    const db = await connectDB();
    const [result] = await db.query(
      `UPDATE notification SET Status = 'read' WHERE AccID = ? AND Status <> 'read'`,
      [accId]
    );
    return result.affectedRows;
  }

  // Xóa notification payment dựa trên OrderCode (extract từ Content)
  async deletePaymentNotificationByOrderCode(accId, orderCode) {
    const db = await connectDB();
    // Tìm và xóa notification có Type = 'payment' và Content chứa OrderCode
    const [result] = await db.query(
      `DELETE FROM notification 
       WHERE AccID = ? 
       AND Type = 'payment' 
       AND Content LIKE ?`,
      [accId, `%Mã đơn hàng: ${orderCode}%`]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new NotificationRepository();
