const newsRepository = require("../repositories/newsRepository");
const staffRepository = require("../repositories/staffRepository");

class NewsService {
  // Tạo tin tức mới
  async createNews(newsData) {
    try {
      // Validate required fields
      if (!newsData.Title || !newsData.Content || !newsData.StaffID) {
        throw new Error("Title, Content và StaffID là bắt buộc");
      }

      // Kiểm tra staff tồn tại
      const staff = await staffRepository.findById(newsData.StaffID);
      if (!staff) {
        throw new Error("Staff không tồn tại");
      }

      // Set default values
      const news = {
        Title: newsData.Title,
        Content: newsData.Content,
        PostedDate: newsData.PostedDate || new Date(),
        Status: newsData.Status || "pending",
        StaffID: newsData.StaffID,
        Image: newsData.Image || null,
      };

      return await newsRepository.create(news);
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả tin tức
  async getAllNews(options = {}) {
    try {
      const news = await newsRepository.findAll(options);
      const total = await newsRepository.count(options);

      return {
        data: news,
        total,
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: Math.ceil(total / (options.limit || 10)),
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy tin tức theo ID
  async getNewsById(newsId) {
    try {
      const news = await newsRepository.findById(newsId);
      if (!news) {
        throw new Error("Không tìm thấy tin tức");
      }
      return news;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật tin tức
  async updateNews(newsId, updateData) {
    try {
      // Kiểm tra tin tức tồn tại
      const existingNews = await newsRepository.findById(newsId);
      if (!existingNews) {
        throw new Error("Không tìm thấy tin tức");
      }

      // Validate nếu có StaffID mới
      if (updateData.StaffID) {
        const staff = await staffRepository.findById(updateData.StaffID);
        if (!staff) {
          throw new Error("Staff không tồn tại");
        }
      }

      return await newsRepository.update(newsId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Xóa tin tức
  async deleteNews(newsId) {
    try {
      const deleted = await newsRepository.delete(newsId);
      if (!deleted) {
        throw new Error("Không tìm thấy tin tức");
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tin tức theo trạng thái
  async getNewsByStatus(status) {
    try {
      return await newsRepository.findByStatus(status);
    } catch (error) {
      throw error;
    }
  }

  // Duyệt tin tức (chuyển status từ pending sang published)
  async approveNews(newsId) {
    try {
      const news = await newsRepository.findById(newsId);
      if (!news) {
        throw new Error("Không tìm thấy tin tức");
      }

      if (news.Status !== "pending") {
        throw new Error("Chỉ có thể duyệt tin tức ở trạng thái pending");
      }

      return await newsRepository.update(newsId, { Status: "published" });
    } catch (error) {
      throw error;
    }
  }

  // Từ chối tin tức (chuyển status từ pending sang rejected)
  async rejectNews(newsId) {
    try {
      const news = await newsRepository.findById(newsId);
      if (!news) {
        throw new Error("Không tìm thấy tin tức");
      }

      if (news.Status !== "pending") {
        throw new Error("Chỉ có thể từ chối tin tức ở trạng thái pending");
      }

      return await newsRepository.update(newsId, { Status: "rejected" });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new NewsService();
