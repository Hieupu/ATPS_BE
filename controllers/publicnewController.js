const publicnewsService = require("../services/publicnewsService");

class PublicnewController {
  async getPublicNews(req, res) {
    try {
      const news = await publicnewsService.getPublicNews();
      
      return res.json({
        success: true,
        data: news,
        count: news.length
      });
    } catch (error) {
      console.error("Error in getActiveNews:", error.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách tin tức",
      });
    }
  }

  async getNewsById(req, res) {
    try {
      const { newsId } = req.params;

      if (!newsId || isNaN(parseInt(newsId))) {
        return res.status(400).json({ 
          success: false,
          message: "ID tin tức không hợp lệ" 
        });
      }

      const news = await publicnewsService.getNewsById(newsId);
      
      return res.json({
        success: true,
        data: news
      });
    } catch (error) {
      console.error("Error getting news:", error.message);
      
      if (error.message === "Không tìm thấy tin tức") {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy chi tiết tin tức",
      });
    }
  }
}

module.exports = new PublicnewController();