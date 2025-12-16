const connectDB = require("../config/db");

class CertificateRepository {
  async getAllCertificates({
    instructorId = null,
    status = null,
    page = 1,
    pageSize = 10,
    search = null,
  } = {}) {
    try {
      const db = await connectDB();
      
      // Build WHERE clause
      let whereClause = `WHERE 1=1`;
      const params = [];

      if (instructorId) {
        whereClause += ` AND c.InstructorID = ?`;
        params.push(instructorId);
      }

      if (status) {
        whereClause += ` AND c.Status = ?`;
        params.push(status);
      }

      if (search) {
        whereClause += ` AND c.Title LIKE ?`;
        params.push(`%${search}%`);
      }

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM certificate c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        INNER JOIN account a ON i.AccID = a.AccID
        ${whereClause}
      `;
      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const limit = pageSize;

      // Get paginated data
      let dataQuery = `
        SELECT 
          c.CertificateID,
          c.Title,
          c.FileURL,
          c.Status,
          c.InstructorID,
          i.FullName AS InstructorName,
          i.AccID,
          a.Email AS InstructorEmail
        FROM certificate c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        INNER JOIN account a ON i.AccID = a.AccID
        ${whereClause}
        ORDER BY c.CertificateID DESC
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];
      const [rows] = await db.query(dataQuery, dataParams);

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error("Database error in getAllCertificates:", error);
      throw error;
    }
  }

  async getCertificateById(certificateId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `
        SELECT 
          c.CertificateID,
          c.Title,
          c.FileURL,
          c.Status,
          c.InstructorID,
          i.FullName AS InstructorName,
          i.AccID,
          a.Email AS InstructorEmail
        FROM certificate c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        INNER JOIN account a ON i.AccID = a.AccID
        WHERE c.CertificateID = ?
        `,
        [certificateId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Database error in getCertificateById:", error);
      throw error;
    }
  }

  async updateCertificateStatus(certificateId, status) {
    try {
      const db = await connectDB();
      const [result] = await db.query(
        `UPDATE certificate SET Status = ? WHERE CertificateID = ?`,
        [status, certificateId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Database error in updateCertificateStatus:", error);
      throw error;
    }
  }

  async getCertificatesByInstructorId(
    instructorId,
    { page = 1, pageSize = 10, search = null, status = null } = {}
  ) {
    try {
      const db = await connectDB();

      // Build WHERE clause
      let whereClause = `WHERE c.InstructorID = ?`;
      const params = [instructorId];

      if (status) {
        whereClause += ` AND c.Status = ?`;
        params.push(status);
      }

      if (search) {
        whereClause += ` AND c.Title LIKE ?`;
        params.push(`%${search}%`);
      }

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM certificate c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        INNER JOIN account a ON i.AccID = a.AccID
        ${whereClause}
      `;
      const [countResult] = await db.query(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const limit = pageSize;

      // Get paginated data
      const dataQuery = `
        SELECT 
          c.CertificateID,
          c.Title,
          c.FileURL,
          c.Status,
          c.InstructorID,
          i.FullName AS InstructorName,
          i.AccID,
          a.Email AS InstructorEmail
        FROM certificate c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        INNER JOIN account a ON i.AccID = a.AccID
        ${whereClause}
        ORDER BY c.CertificateID DESC
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];
      const [rows] = await db.query(dataQuery, dataParams);

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error("Database error in getCertificatesByInstructorId:", error);
      throw error;
    }
  }
}

module.exports = new CertificateRepository();

