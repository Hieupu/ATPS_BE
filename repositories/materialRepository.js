const pool = require("../config/db");

class MaterialRepository {
  async create(materialData) {
    const { Title, Description, FilePath, FileType, UploadDate, SessionID } =
      materialData;

    const query = `
      INSERT INTO material (Title, Description, FilePath, FileType, UploadDate, SessionID)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Title,
      Description,
      FilePath,
      FileType,
      UploadDate,
      SessionID,
    ]);

    return { MaterialID: result.insertId, ...materialData };
  }

  async findById(id) {
    const query = `
      SELECT 
        m.*,
        s.Title as sessionTitle
      FROM material m
      LEFT JOIN session s ON m.SessionID = s.SessionID
      WHERE m.MaterialID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findBySessionId(sessionId) {
    const query = `
      SELECT 
        m.*,
        s.Title as sessionTitle
      FROM material m
      LEFT JOIN session s ON m.SessionID = s.SessionID
      WHERE m.SessionID = ?
      ORDER BY m.UploadDate DESC
    `;

    const [rows] = await pool.execute(query, [sessionId]);
    return rows;
  }

  async findAll() {
    const query = `
      SELECT 
        m.*,
        s.Title as sessionTitle
      FROM material m
      LEFT JOIN session s ON m.SessionID = s.SessionID
      ORDER BY m.UploadDate DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByFileType(fileType) {
    const query = `
      SELECT 
        m.*,
        s.Title as sessionTitle
      FROM material m
      LEFT JOIN session s ON m.SessionID = s.SessionID
      WHERE m.FileType = ?
      ORDER BY m.UploadDate DESC
    `;

    const [rows] = await pool.execute(query, [fileType]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE material SET ${setClause} WHERE MaterialID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM material WHERE MaterialID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM material WHERE MaterialID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }
}

module.exports = new MaterialRepository();
