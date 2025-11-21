const pool = require("../config/db");

/**
 * ClassRepository - dbver5
 *
 * Hỗ trợ các trường mới:
 * - ZoomID, Zoompass
 * - OpendatePlan, Opendate (tự động sync)
 * - EnddatePlan, Enddate (tự động sync)
 * - Numofsession, Maxstudent
 */
class ClassRepository {
  async create(classData) {
    const {
      Name,
      CourseID,
      InstructorID,
      Status,
      ZoomID,
      Zoompass,
      Fee,
      OpendatePlan,
      EnddatePlan,
      Numofsession,
      Maxstudent,
    } = classData;

    // dbver5: Hỗ trợ các trường mới: ZoomID, Zoompass, OpendatePlan, EnddatePlan, Numofsession, Maxstudent
    // Opendate và Enddate sẽ được đồng bộ tự động từ session (synchronization function)
    // Lưu ý: dbver5 không có ZoomURL, chỉ có ZoomID và Zoompass
    const query = `
      INSERT INTO \`class\` (
        Name, CourseID, InstructorID, Status, ZoomID, Zoompass, Fee, 
        OpendatePlan, Opendate, EnddatePlan, Enddate,
        Numofsession, Maxstudent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Name,
      CourseID,
      InstructorID,
      Status || "DRAFT",
      ZoomID || null,
      Zoompass || null,
      Fee || 0,
      OpendatePlan || null,
      null, // Opendate sẽ được sync từ session
      EnddatePlan || null,
      null, // Enddate sẽ được sync từ session
      Numofsession || 0,
      Maxstudent || 0,
    ]);

    return result;
  }

  async findById(id) {
    if (!id) {
      throw new Error("ID is required");
    }
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        COUNT(e.EnrollmentID) as currentLearners
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'active'
      WHERE c.ClassID = ?
      GROUP BY c.ClassID
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows;
  }

  async findAll() {
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByCourseId(courseId) {
    const query = `
      SELECT 
        c.*,
        i.FullName as instructorName
      FROM \`class\` c
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE c.CourseID = ?
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query, [courseId]);
    return rows;
  }

  async findByInstructorId(instructorId) {
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      WHERE c.InstructorID = ?
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query, [instructorId]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE \`class\` SET ${setClause} WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM \`class\` WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM \`class\` WHERE ClassID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  // Method này không còn cần thiết vì dbver5 không có trường CurrentStudents
  // Số học viên được tính trực tiếp từ enrollment khi query
  // Giữ lại method này để backward compatibility nhưng không làm gì
  async updateStudentCount(classId) {
    // dbver5: Không có trường CurrentStudents
    // Số học viên được tính động từ enrollment trong các query SELECT
    // Method này giữ lại để không break code cũ, nhưng không thực hiện gì
    return true;
  }

  // =====================================================
  // WORKFLOW 4 BƯỚC - CLASS MANAGEMENT
  // =====================================================

  // Cập nhật lớp (workflow method - override update above)
  async updateWorkflow(classId, updateData) {
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);
    values.push(classId);

    const query = `
      UPDATE \`class\` 
      SET ${fields}
      WHERE ClassID = ?
    `;

    const [result] = await pool.execute(query, values);
    return result;
  }

  // Lấy lớp theo status
  async findByStatus(status, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        COUNT(e.EnrollmentID) as currentLearners
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'active'
      WHERE c.Status = ?
      GROUP BY c.ClassID
      ORDER BY c.ClassID DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [status, limit, offset]);
    return rows;
  }

  // Đếm lớp theo status
  async countByStatus(status) {
    const query = `
      SELECT COUNT(*) as total
      FROM class 
      WHERE Status = ?
    `;

    const [rows] = await pool.execute(query, [status]);
    return rows[0].total;
  }

  // Lấy lớp có thể đăng ký (OPEN - dbver5)
  async findAvailableClasses(options = {}) {
    const { limit = 10, offset = 0, search = "" } = options;

    let query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        COUNT(e.EnrollmentID) as currentLearners
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'active'
      WHERE c.Status = 'OPEN' OR c.Status = 'PUBLISHED'
    `;

    const params = [];

    if (search) {
      query += ` AND (c.Name LIKE ? OR co.Title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY c.ClassID
      ORDER BY c.ClassID DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Đếm lớp có thể đăng ký (OPEN - dbver5)
  async countAvailableClasses(search = "") {
    let query = `
      SELECT COUNT(*) as total
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'active'
      WHERE c.Status = 'OPEN' OR c.Status = 'PUBLISHED'
    `;

    const params = [];

    if (search) {
      query += ` AND (c.Name LIKE ? OR co.Title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows.length;
  }
}

module.exports = new ClassRepository();
