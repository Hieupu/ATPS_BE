const notificationService = require("../services/notificationService");

class NotificationController {
  async list(req, res) {
    try {
      const accId = req.user?.id || req.params.accId;
      if (!accId)
        return res.status(400).json({ message: "Account ID required" });
      const { limit } = req.query;
      const notifications = await notificationService.listByAccount(accId, {
        limit,
      });
      return res.json({ notifications });
    } catch (e) {
      console.error("Error list notifications:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async create(req, res) {
    try {
      const accId = req.user?.id || req.body.accId;
      const { content, type } = req.body;
      const created = await notificationService.create({
        content,
        type,
        accId,
      });
      return res
        .status(201)
        .json({ message: "Created", notification: created });
    } catch (e) {
      return res.status(400).json({ message: e.message || "Bad request" });
    }
  }

  async markAsRead(req, res) {
    try {
      const accId = req.user?.id || req.body.accId;
      const { id } = req.params;
      const ok = await notificationService.markAsRead(id, accId);
      return res.json({ success: ok });
    } catch (e) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const accId = req.user?.id || req.body.accId;
      const count = await notificationService.markAllAsRead(accId);
      return res.json({ updated: count });
    } catch (e) {
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new NotificationController();
