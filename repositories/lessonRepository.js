const pool = require("../config/db");

class LessonRepository {
  // Tạo bài học mới
  async create(lessonData) {
    const { Title, Description, FileURL, Type, UnitID } = lessonData;

    const query = `
      INSERT INTO lesson (
        Title, Description, FileURL, Type, UnitID,
        CreatedDate, UpdatedDate
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(query, [
      Title,
      Description,
      FileURL,
      Type,
      UnitID,
    ]);

    return result;
  }

  // Lấy bài học theo ID
  async findById(lessonId) {
    const query = `
      SELECT 
        l.*,
        u.UnitName,
        c.CourseName
      FROM lesson l
      LEFT JOIN unit u ON l.UnitID = u.UnitID
      LEFT JOIN course c ON u.CourseID = c.CourseID
      WHERE l.LessonID = ?
    `;

    const [rows] = await pool.execute(query, [lessonId]);
    return rows;
  }

  // Lấy tất cả bài học
  async findAll() {
    const query = `
      SELECT 
        l.*,
        u.UnitName,
        c.CourseName
      FROM lesson l
      LEFT JOIN unit u ON l.UnitID = u.UnitID
      LEFT JOIN course c ON u.CourseID = c.CourseID
      ORDER BY l.CreatedDate DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  // Lấy bài học theo UnitID
  async findByUnitId(unitId) {
    const query = `
      SELECT 
        l.*,
        u.UnitName,
        c.CourseName
      FROM lesson l
      LEFT JOIN unit u ON l.UnitID = u.UnitID
      LEFT JOIN course c ON u.CourseID = c.CourseID
      WHERE l.UnitID = ?
      ORDER BY l.CreatedDate ASC
    `;

    const [rows] = await pool.execute(query, [unitId]);
    return rows;
  }

  // Cập nhật bài học
  async update(lessonId, updateData) {
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);
    values.push(lessonId);

    const query = `
      UPDATE lesson 
      SET ${fields}, UpdatedDate = NOW() 
      WHERE LessonID = ?
    `;

    const [result] = await pool.execute(query, values);
    return result;
  }

  // Xóa bài học
  async delete(lessonId) {
    const query = `DELETE FROM lesson WHERE LessonID = ?`;
    const [result] = await pool.execute(query, [lessonId]);
    return result;
  }
}

module.exports = new LessonRepository();
