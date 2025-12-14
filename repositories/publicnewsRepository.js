const connectDB = require("../config/db");

class PublicNewsRepository {
  async getPublicNews() {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          NewsID,
          Title,
          Content,
          PostedDate,
          Status,
          StaffID,
          Image
         FROM news
         WHERE Status = 'published'
         ORDER BY PostedDate DESC`
      );
      return rows;
    } catch (error) {
      console.error("Database error in getPubliceNews:", error);
      throw error;
    }
  }

  async getNewsById(newsId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT * FROM news 
         WHERE NewsID = ? AND Status = 'published'`,
        [newsId]
      );
      return rows.length > 0 ? rows[0] : null; // Trả về null nếu không tìm thấy
    } catch (error) {
      console.error("Database error in getNewsById:", error);
      throw error;
    }
  }
}

module.exports = new PublicNewsRepository();