const notificationRepository = require("../repositories/notificationRepository");

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
}

module.exports = new NotificationService();
