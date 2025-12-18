const connectDB = require("../config/db");

class NewsRepository {
  // Tạo tin tức mới
  async create(newsData) {
    try {
      const { Title, Content, PostedDate, Status, StaffID, Image } = newsData;

      const query = `
        INSERT INTO news (Title, Content, PostedDate, Status, StaffID, Image)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const pool = await connectDB();
      const [result] = await pool.execute(query, [
        Title,
        Content,
        PostedDate || new Date(),
        Status || "pending",
        StaffID,
        Image || null,
      ]);

      return {
        NewsID: result.insertId,
        ...newsData,
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả tin tức
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        search = "",
        staffID = null,
      } = options;

      // Đảm bảo page và limit là số nguyên hợp lệ
      let validPage = 1;
      if (page !== undefined && page !== null) {
        const parsed = parseInt(page, 10);
        if (!isNaN(parsed) && parsed > 0) {
          validPage = parsed;
        }
      }

      let validLimit = 10;
      if (limit !== undefined && limit !== null) {
        const parsed = parseInt(limit, 10);
        if (!isNaN(parsed) && parsed > 0) {
          validLimit = parsed;
        }
      }

      const validOffset = Math.max(0, (validPage - 1) * validLimit);
      // Đảm bảo giá trị là số nguyên nguyên thủy cho MySQL
      const limitInt = parseInt(validLimit.toString(), 10);
      const offsetInt = parseInt(validOffset.toString(), 10);

      let query = `
        SELECT 
          n.NewsID,
          n.Title,
          n.Content,
          n.PostedDate,
          n.Status,
          n.StaffID,
          n.Image,
          s.FullName as StaffName,
          a.Email as StaffEmail
        FROM news n
        LEFT JOIN staff s ON n.StaffID = s.StaffID
        LEFT JOIN account a ON s.AccID = a.AccID
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += ` AND n.Status = ?`;
        params.push(status);
      }

      if (staffID) {
        query += ` AND n.StaffID = ?`;
        params.push(staffID);
      }

      if (search) {
        query += ` AND (n.Title LIKE ? OR n.Content LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY n.PostedDate DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const pool = await connectDB();
      const [rows] = await pool.execute(query, params);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Đếm tổng số tin tức
  async count(options = {}) {
    try {
      const { status = null, search = "", staffID = null } = options;

      let query = `SELECT COUNT(*) as total FROM news WHERE 1=1`;
      const params = [];

      if (status) {
        query += ` AND Status = ?`;
        params.push(status);
      }

      if (staffID) {
        query += ` AND StaffID = ?`;
        params.push(staffID);
      }

      if (search) {
        query += ` AND (Title LIKE ? OR Content LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      const pool = await connectDB();
      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tin tức theo ID
  async findById(newsId) {
    try {
      const query = `
        SELECT 
          n.NewsID,
          n.Title,
          n.Content,
          n.PostedDate,
          n.Status,
          n.StaffID,
          n.Image,
          s.FullName as StaffName,
          a.Email as StaffEmail
        FROM news n
        LEFT JOIN staff s ON n.StaffID = s.StaffID
        LEFT JOIN account a ON s.AccID = a.AccID
        WHERE n.NewsID = ?
      `;

      const pool = await connectDB();
      const [rows] = await pool.execute(query, [newsId]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật tin tức
  async update(newsId, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        return null;
      }

      values.push(newsId);

      const query = `UPDATE news SET ${fields.join(", ")} WHERE NewsID = ?`;

      const pool = await connectDB();
      const [result] = await pool.execute(query, values);

      if (result.affectedRows === 0) {
        return null;
      }

      return await this.findById(newsId);
    } catch (error) {
      throw error;
    }
  }

  // Xóa tin tức
  async delete(newsId) {
    try {
      const query = `DELETE FROM news WHERE NewsID = ?`;

      const pool = await connectDB();
      const [result] = await pool.execute(query, [newsId]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tin tức theo trạng thái
  async findByStatus(status) {
    try {
      const query = `
        SELECT 
          n.NewsID,
          n.Title,
          n.Content,
          n.PostedDate,
          n.Status,
          n.StaffID,
          n.Image,
          s.FullName as StaffName
        FROM news n
        LEFT JOIN staff s ON n.StaffID = s.StaffID
        WHERE n.Status = ?
        ORDER BY n.PostedDate DESC
      `;

      const pool = await connectDB();
      const [rows] = await pool.execute(query, [status]);

      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new NewsRepository();
