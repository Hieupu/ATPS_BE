const pool = require("../config/db");

class PromotionRepository {
  // Tạo promotion mới
  async create(promotionData) {
    try {
      const { Code, Discount, StartDate, EndDate, CreateBy, Status } = promotionData;

      const query = `
        INSERT INTO promotion (Code, Discount, StartDate, EndDate, CreateBy, Status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute(query, [
        Code,
        Discount,
        StartDate,
        EndDate,
        CreateBy,
        Status || "active",
      ]);

      return {
        PromotionID: result.insertId,
        ...promotionData,
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả promotions
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, status = null, search = "" } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          p.PromotionID,
          p.Code,
          p.Discount,
          p.StartDate,
          p.EndDate,
          p.CreateBy,
          p.Status,
          a.username as CreatedByUsername,
          a.Email as CreatedByEmail
        FROM promotion p
        LEFT JOIN account a ON p.CreateBy = a.AccID
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += ` AND p.Status = ?`;
        params.push(status);
      }

      if (search) {
        query += ` AND (p.Code LIKE ? OR a.username LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY p.StartDate DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Đếm tổng số promotions
  async count(options = {}) {
    try {
      const { status = null, search = "" } = options;

      let query = `
        SELECT COUNT(*) as total 
        FROM promotion p
        LEFT JOIN account a ON p.CreateBy = a.AccID
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ` AND p.Status = ?`;
        params.push(status);
      }

      if (search) {
        query += ` AND (p.Code LIKE ? OR a.username LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Lấy promotion theo ID
  async findById(promotionId) {
    try {
      const query = `
        SELECT 
          p.PromotionID,
          p.Code,
          p.Discount,
          p.StartDate,
          p.EndDate,
          p.CreateBy,
          p.Status,
          a.username as CreatedByUsername,
          a.Email as CreatedByEmail
        FROM promotion p
        LEFT JOIN account a ON p.CreateBy = a.AccID
        WHERE p.PromotionID = ?
      `;

      const [rows] = await pool.execute(query, [promotionId]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy promotion theo Code
  async findByCode(code) {
    try {
      const query = `
        SELECT 
          p.PromotionID,
          p.Code,
          p.Discount,
          p.StartDate,
          p.EndDate,
          p.CreateBy,
          p.Status,
          a.username as CreatedByUsername
        FROM promotion p
        LEFT JOIN account a ON p.CreateBy = a.AccID
        WHERE p.Code = ?
      `;

      const [rows] = await pool.execute(query, [code]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật promotion
  async update(promotionId, updateData) {
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

      values.push(promotionId);

      const query = `UPDATE promotion SET ${fields.join(", ")} WHERE PromotionID = ?`;

      const [result] = await pool.execute(query, values);

      if (result.affectedRows === 0) {
        return null;
      }

      return await this.findById(promotionId);
    } catch (error) {
      throw error;
    }
  }

  // Xóa promotion
  async delete(promotionId) {
    try {
      const query = `DELETE FROM promotion WHERE PromotionID = ?`;

      const [result] = await pool.execute(query, [promotionId]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Lấy promotions theo trạng thái
  async findByStatus(status) {
    try {
      const query = `
        SELECT 
          p.PromotionID,
          p.Code,
          p.Discount,
          p.StartDate,
          p.EndDate,
          p.CreateBy,
          p.Status,
          a.username as CreatedByUsername
        FROM promotion p
        LEFT JOIN account a ON p.CreateBy = a.AccID
        WHERE p.Status = ?
        ORDER BY p.StartDate DESC
      `;

      const [rows] = await pool.execute(query, [status]);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra promotion có hợp lệ không (active và trong thời gian hiệu lực)
  async findValidPromotion(code) {
    try {
      const now = new Date();
      const query = `
        SELECT 
          p.PromotionID,
          p.Code,
          p.Discount,
          p.StartDate,
          p.EndDate,
          p.Status
        FROM promotion p
        WHERE p.Code = ?
          AND p.Status = 'active'
          AND p.StartDate <= ?
          AND (p.EndDate IS NULL OR p.EndDate >= ?)
      `;

      const [rows] = await pool.execute(query, [code, now, now]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PromotionRepository();


