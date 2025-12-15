const publicnewsRepository = require("../repositories/publicnewsRepository");

class PublicNewsService {
  async getPublicNews() {
    try {
      const news = await publicnewsRepository.getPublicNews();
      
      // Format the news data
      const formattedNews = news.map((item) => ({
        NewsID: item.NewsID,
        Title: item.Title,
        Content: item.Content,
        PostedDate: item.PostedDate,
        FormattedDate: this.formatDate(item.PostedDate),
        Status: item.Status,
        StaffID: item.StaffID,
        Image: item.Image,
        Excerpt: this.createExcerpt(item.Content, 150) // Create short excerpt
      }));

      return formattedNews;
    } catch (error) {
      console.error("Error in getActiveNews service:", error);
      throw error;
    }
  }

  async getNewsById(newsId) {
    try {
      const news = await publicnewsRepository.getNewsById(newsId);
      
      if (!news) {
        throw new Error("Không tìm thấy tin tức");
      }

      return {
        NewsID: news.NewsID,
        Title: news.Title,
        Content: news.Content,
        PostedDate: news.PostedDate,
        FormattedDate: this.formatDate(news.PostedDate),
        Status: news.Status,
        StaffID: news.StaffID,
        Image: news.Image
      };
    } catch (error) {
      console.error("Error in getNewsById service:", error);
      throw error; // Re-throw để controller xử lý
    }
  }

  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  createExcerpt(content, maxLength) {
    if (!content) return '';
    const strippedContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    if (strippedContent.length <= maxLength) return strippedContent;
    return strippedContent.substring(0, maxLength) + '...';
  }
}

module.exports = new PublicNewsService();