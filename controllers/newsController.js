const newsService = require("../services/newsService");
const logService = require("../services/logService");

const newsController = {
  // Tạo tin tức mới
  createNews: async (req, res) => {
    try {
      const newsData = req.body;
      const staffId = req.user?.StaffID || newsData.StaffID; // Lấy từ auth middleware hoặc body
      const adminAccID = req.user ? req.user.AccID : null;

      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "StaffID là bắt buộc",
        });
      }

      newsData.StaffID = staffId;
      const newNews = await newsService.createNews(newsData);

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

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: status || null,
        search: search || "",
      };

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
      const statusCode = error.message.includes("Không tìm thấy") || error.message.includes("Chỉ có thể") ? 400 : 500;
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
      const adminAccID = req.user ? req.user.AccID : null;
      const updatedNews = await newsService.rejectNews(id);

      // Ghi log REJECT_NEWS
      if (adminAccID && updatedNews?.NewsID) {
        await logService.logAction({
          action: "REJECT_NEWS",
          accId: adminAccID,
          detail: `NewsID: ${updatedNews.NewsID}, Title: ${updatedNews.Title}`,
        });
      }

      res.json({
        success: true,
        message: "Từ chối tin tức thành công",
        data: updatedNews,
      });
    } catch (error) {
      console.error("Error rejecting news:", error);
      const statusCode = error.message.includes("Không tìm thấy") || error.message.includes("Chỉ có thể") ? 400 : 500;
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


