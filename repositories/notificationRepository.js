const connectDB = require("../config/db");

class NotificationRepository {
  async create({ Content, Type = "info", Status = "unread", AccID }) {
    return this.createNotification({
      content: Content,
      type: Type,
      status: Status,
      accId: AccID,
    });
  }
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

// const pool = require("../config/db");

// class NotificationRepository {
//   async create(notificationData) {
//     const { Content, Type, Status, AccID } = notificationData;

//     const query = `
//       INSERT INTO notification (Content, Type, Status, AccID)
//       VALUES (?, ?, ?, ?)
//     `;

//     const [result] = await pool.execute(query, [Content, Type, Status, AccID]);

//     return { NotificationID: result.insertId, ...notificationData };
//   }

//   async findByAccountId(accountId, options = {}) {
//     const { status, limit = 50 } = options;

//     let query = `
//       SELECT n.*, a.Email, a.Username
//       FROM notification n
//       LEFT JOIN account a ON n.AccID = a.AccID
//       WHERE n.AccID = ?
//     `;

//     const params = [accountId];

//     if (status) {
//       query += ` AND n.Status = ?`;
//       params.push(status);
//     }

//     query += ` ORDER BY n.NotificationID DESC LIMIT ?`;
//     params.push(limit);

//     const [rows] = await pool.execute(query, params);
//     return rows;
//   }

//   async markAsRead(notificationId, accountId) {
//     const query = `
//       UPDATE notification
//       SET Status = 'read'
//       WHERE NotificationID = ? AND AccID = ?
//     `;

//     const [result] = await pool.execute(query, [notificationId, accountId]);
//     return result.affectedRows > 0;
//   }

//   async markAllAsRead(accountId) {
//     const query = `
//       UPDATE notification
//       SET Status = 'read'
//       WHERE AccID = ? AND Status = 'unread'
//     `;

//     const [result] = await pool.execute(query, [accountId]);
//     return result.affectedRows;
//   }

//   async delete(notificationId, accountId) {
//     const query = `
//       DELETE FROM notification
//       WHERE NotificationID = ? AND AccID = ?
//     `;

//     const [result] = await pool.execute(query, [notificationId, accountId]);
//     return result.affectedRows > 0;
//   }

//   async getUnreadCount(accountId) {
//     const query = `
//       SELECT COUNT(*) as count
//       FROM notification
//       WHERE AccID = ? AND Status = 'unread'
//     `;

//     const [rows] = await pool.execute(query, [accountId]);
//     return rows[0].count;
//   }
// }

// module.exports = new NotificationRepository();
