const newsService = require("../services/newsService");
const logService = require("../services/logService");

const newsController = {
  // Tạo tin tức mới
  createNews: async (req, res) => {
    try {
      const newsData = req.body;
      const role = req.user?.role;
      const accID = req.user?.AccID;
      const adminAccID = req.user ? req.user.AccID : null;

      let staffId = null;

      if (role === "staff" && accID) {
        const staffRepository = require("../repositories/staffRepository");
        const staff = await staffRepository.findByAccID(accID);
        if (!staff || !staff.StaffID) {
          return res.status(400).json({
            success: false,
            message: "Không tìm thấy thông tin Staff cho tài khoản hiện tại",
          });
        }
        staffId = staff.StaffID;
      } else if (role === "admin") {
        // Admin phải truyền StaffID rõ ràng (người phụ trách tin)
        staffId = newsData.StaffID;
      }

      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "StaffID là bắt buộc",
        });
      }

      newsData.StaffID = staffId;
      const newNews = await newsService.createNews(newsData);

      // Nếu staff tạo tin → gửi notification tới tất cả admin
      if (role === "staff") {
        try {
          const adminRepository = require("../repositories/adminRepository");
          const notificationService = require("../services/notificationService");
          const staffRepository = require("../repositories/staffRepository");

          const [allAdmins, staff] = await Promise.all([
            adminRepository.findAll(),
            staffRepository.findById(staffId),
          ]);

          const adminAccIds =
            allAdmins?.map((a) => a.AccID).filter(Boolean) || [];

          if (adminAccIds.length > 0) {
            const staffName = staff?.FullName || `Staff #${staffId}`;
            const title = newNews?.Title || "tin tức mới";
            const content = `Nhân viên "${staffName}" đã tạo tin tức mới "${title}" và đang chờ duyệt. Vui lòng vào mục Quản lý Tin tức để xem chi tiết.`;

            await notificationService.createBulk({
              accIds: adminAccIds,
              content,
              type: "news",
            });
          }
        } catch (notifError) {
          console.error(
            "[newsController.createNews] Error sending notifications to admins:",
            notifError
          );
        }
      }

      // Ghi log CREATE_NEWS
      if (adminAccID && newNews?.NewsID) {
        await logService.logAction({
          action: "CREATE_NEWS",
          accId: adminAccID,
          detail: `NewsID: ${newNews.NewsID}, Title: ${newNews.Title}`,
        });
      }

      res.status(201).json({
        success: true,
        message: "Tạo tin tức thành công",
        data: newNews,
      });
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo tin tức",
        error: error.message,
      });
    }
  },

  // Lấy tất cả tin tức
  getAllNews: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const role = req.user?.role;
      const accID = req.user?.AccID;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: status || null,
        search: search || "",
      };

      // Nếu là staff → chỉ lấy tin của chính staff đó
      if (role === "staff" && accID) {
        const staffRepository = require("../repositories/staffRepository");
        const staff = await staffRepository.findByAccID(accID);
        if (staff && staff.StaffID) {
          options.staffID = staff.StaffID;
        } else {
          // Không có staff mapping → trả về rỗng
          return res.json({
            success: true,
            message: "Lấy danh sách tin tức thành công",
            data: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0,
            },
          });
        }
      }

      const result = await newsService.getAllNews(options);

      res.json({
        success: true,
        message: "Lấy danh sách tin tức thành công",
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("Error getting news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách tin tức",
        error: error.message,
      });
    }
  },

  // Lấy tin tức theo ID
  getNewsById: async (req, res) => {
    try {
      const { id } = req.params;
      const news = await newsService.getNewsById(id);

      res.json({
        success: true,
        message: "Lấy thông tin tin tức thành công",
        data: news,
      });
    } catch (error) {
      console.error("Error getting news:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Cập nhật tin tức
  updateNews: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      const updatedNews = await newsService.updateNews(id, updateData);

      // Ghi log UPDATE_NEWS
      if (adminAccID && updatedNews?.NewsID) {
        await logService.logAction({
          action: "UPDATE_NEWS",
          accId: adminAccID,
          detail: `NewsID: ${updatedNews.NewsID}, Title: ${updatedNews.Title}`,
        });
      }

      res.json({
        success: true,
        message: "Cập nhật tin tức thành công",
        data: updatedNews,
      });
    } catch (error) {
      console.error("Error updating news:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Xóa tin tức
  deleteNews: async (req, res) => {
    try {
      const { id } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;

      // Lấy thông tin tin tức trước khi xóa để log
      let news = null;
      if (adminAccID) {
        news = await newsService.getNewsById(id);
      }

      await newsService.deleteNews(id);

      // Ghi log DELETE_NEWS
      if (adminAccID && news) {
        await logService.logAction({
          action: "DELETE_NEWS",
          accId: adminAccID,
          detail: `NewsID: ${news.NewsID}, Title: ${news.Title}`,
        });
      }

      res.json({
        success: true,
        message: "Xóa tin tức thành công",
      });
    } catch (error) {
      console.error("Error deleting news:", error);
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Lấy tin tức theo trạng thái
  getNewsByStatus: async (req, res) => {
    try {
      const { status } = req.query;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status là bắt buộc",
        });
      }

      const news = await newsService.getNewsByStatus(status);

      res.json({
        success: true,
        message: "Lấy danh sách tin tức theo trạng thái thành công",
        data: news,
      });
    } catch (error) {
      console.error("Error getting news by status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách tin tức theo trạng thái",
        error: error.message,
      });
    }
  },

  // Duyệt tin tức
  approveNews: async (req, res) => {
    try {
      const { id } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;
      const updatedNews = await newsService.approveNews(id);

       // Gửi notification tới staff tạo tin
      try {
        const staffRepository = require("../repositories/staffRepository");
        const notificationService = require("../services/notificationService");

        if (updatedNews?.StaffID) {
          const staff = await staffRepository.findById(updatedNews.StaffID);
          if (staff?.AccID) {
            const title = updatedNews.Title || "tin tức";
            const content = `Tin tức "${title}" của bạn đã được admin duyệt và sẽ hiển thị cho học viên.`;
            await notificationService.create({
              accId: staff.AccID,
              content,
              type: "news",
            });
          }
        }
      } catch (notifError) {
        console.error(
          "[newsController.approveNews] Error sending notification to staff:",
          notifError
        );
      }

      // Ghi log APPROVE_NEWS
      if (adminAccID && updatedNews?.NewsID) {
        await logService.logAction({
          action: "APPROVE_NEWS",
          accId: adminAccID,
          detail: `NewsID: ${updatedNews.NewsID}, Title: ${updatedNews.Title}`,
        });
      }

      res.json({
        success: true,
        message: "Duyệt tin tức thành công",
        data: updatedNews,
      });
    } catch (error) {
      console.error("Error approving news:", error);
      const statusCode =
        error.message.includes("Không tìm thấy") ||
        error.message.includes("Chỉ có thể")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Từ chối tin tức
  rejectNews: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      const finalReason = (reason || "").trim();
      if (!finalReason) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do từ chối tin tức",
        });
      }

      const updatedNews = await newsService.rejectNews(id);

      // Ghi log REJECT_NEWS
      if (adminAccID && updatedNews?.NewsID) {
        await logService.logAction({
          action: "REJECT_NEWS",
          accId: adminAccID,
          detail: `NewsID: ${updatedNews.NewsID}, Title: ${updatedNews.Title}, Reason: ${finalReason}`,
        });
      }

      // Gửi notification tới staff tạo tin với lý do từ chối
      try {
        const staffRepository = require("../repositories/staffRepository");
        const notificationService = require("../services/notificationService");

        if (updatedNews?.StaffID) {
          const staff = await staffRepository.findById(updatedNews.StaffID);
          if (staff?.AccID) {
            const title = updatedNews.Title || "tin tức";
            const content = `Tin tức "${title}" của bạn đã bị admin từ chối. Lý do: ${finalReason}`;
            await notificationService.create({
              accId: staff.AccID,
              content,
              type: "news",
            });
          }
        }
      } catch (notifError) {
        console.error(
          "[newsController.rejectNews] Error sending notification to staff:",
          notifError
        );
      }

      res.json({
        success: true,
        message: "Từ chối tin tức thành công",
        data: updatedNews,
      });
    } catch (error) {
      console.error("Error rejecting news:", error);
      const statusCode =
        error.message.includes("Không tìm thấy") ||
        error.message.includes("Chỉ có thể")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }
  },

  // Upload image for news
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được tải lên",
        });
      }

      const filePath = `/assets/news/${req.file.filename}`;
      res.status(201).json({
        success: true,
        message: "Tải ảnh thành công",
        data: {
          path: filePath,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error("Error uploading news image:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải ảnh",
        error: error.message,
      });
    }
  },
};

module.exports = newsController;
