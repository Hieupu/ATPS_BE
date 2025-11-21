const pool = require("../config/db");

class NotificationRepository {
  async create(notificationData) {
    const { Content, Type, Status, AccID } = notificationData;

    const query = `
      INSERT INTO notification (Content, Type, Status, AccID)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [Content, Type, Status, AccID]);

    return { NotificationID: result.insertId, ...notificationData };
  }

  async findByAccountId(accountId, options = {}) {
    const { status, limit = 50 } = options;
    
    let query = `
      SELECT n.*, a.Email, a.Username
      FROM notification n
      LEFT JOIN account a ON n.AccID = a.AccID
      WHERE n.AccID = ?
    `;
    
    const params = [accountId];
    
    if (status) {
      query += ` AND n.Status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY n.NotificationID DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async markAsRead(notificationId, accountId) {
    const query = `
      UPDATE notification 
      SET Status = 'read' 
      WHERE NotificationID = ? AND AccID = ?
    `;

    const [result] = await pool.execute(query, [notificationId, accountId]);
    return result.affectedRows > 0;
  }

  async markAllAsRead(accountId) {
    const query = `
      UPDATE notification 
      SET Status = 'read' 
      WHERE AccID = ? AND Status = 'unread'
    `;

    const [result] = await pool.execute(query, [accountId]);
    return result.affectedRows;
  }

  async delete(notificationId, accountId) {
    const query = `
      DELETE FROM notification 
      WHERE NotificationID = ? AND AccID = ?
    `;

    const [result] = await pool.execute(query, [notificationId, accountId]);
    return result.affectedRows > 0;
  }

  async getUnreadCount(accountId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notification 
      WHERE AccID = ? AND Status = 'unread'
    `;

    const [rows] = await pool.execute(query, [accountId]);
    return rows[0].count;
  }
}

module.exports = new NotificationRepository();

