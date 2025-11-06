const connectDB = require("../config/db");

class AssignmentRepository {
  // Kiểm tra quyền với Unit
  async canInstructorAccessUnit(instructorAccId, unitId) {
    const db = await connectDB();
    const query = `
      SELECT 1
      FROM unit u
      JOIN course co ON u.CourseID = co.CourseID
      JOIN instructor i ON co.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND u.UnitID = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, unitId]);
    return rows.length > 0;
  }

  // Kiểm tra quyền với Assignment
  async canInstructorAccessAssignment(instructorAccId, assignmentId) {
    const db = await connectDB();
    const query = `
      SELECT 1
      FROM assignment a
      JOIN instructor i ON a.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND a.AssignmentID = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, assignmentId]);
    return rows.length > 0;
  }

  // Tìm UnitID theo Title (của giảng viên hiện tại)
  async findUnitIdByTitleForInstructor(instructorAccId, unitTitle) {
    const db = await connectDB();
    const query = `
      SELECT u.UnitID
      FROM unit u
      JOIN course co ON u.CourseID = co.CourseID
      JOIN instructor i ON co.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND u.Title = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, unitTitle]);
    return rows[0]?.UnitID ?? null;
  }

  // Tạo assignment (draft hoặc active)
  async createAssignment({ instructorId, title, description, deadline, type, unitId, status, fileURL }) {
    const db = await connectDB();
    const insert = `
      INSERT INTO assignment
      (InstructorID, UnitID, Title, Description, Deadline, Type, Status, FileURL)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insert, [
      instructorId,
      unitId ?? null,
      title,
      description,
      deadline ?? null,
      type,
      status,
      fileURL ?? null,
    ]);

    return this.getAssignmentById(result.insertId);
  }

  // Cập nhật assignment (partial update)
  async updateAssignment(assignmentId, updates) {
    const db = await connectDB();
    if (Object.prototype.hasOwnProperty.call(updates, "unitId")) {
      updates.UnitID = updates.unitId;
      delete updates.unitId;
    }

    const allowed = new Set([
      "Title", "Description", "Deadline", "Type", "Status",
      "FileURL", "UnitID"
    ]);
    const fields = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && allowed.has(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (!fields.length) return this.getAssignmentById(assignmentId);
    const sql = `UPDATE assignment SET ${fields.join(", ")} WHERE AssignmentID = ?`;
    params.push(assignmentId);
    await db.query(sql, params);
    return this.getAssignmentById(assignmentId);
  }

  // Xóa mềm
  async softDeleteAssignment(assignmentId) {
    const db = await connectDB();
    await db.query(`UPDATE assignment SET Status = 'deleted' WHERE AssignmentID = ?`, [assignmentId]);
    return this.getAssignmentById(assignmentId);
  }

  // Lấy chi tiết assignment
  async getAssignmentById(assignmentId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `
      SELECT 
        a.AssignmentID, a.Title, a.Description, a.Deadline, a.Type, a.FileURL, a.Status,
        u.UnitID, u.Title AS UnitTitle,
        co.CourseID, co.Title AS CourseTitle,
        i.FullName AS InstructorName
      FROM assignment a
      LEFT JOIN unit u ON a.UnitID = u.UnitID
      LEFT JOIN course co ON u.CourseID = co.CourseID
      LEFT JOIN instructor i ON a.InstructorID = i.InstructorID
      WHERE a.AssignmentID = ?
      `,
      [assignmentId]
    );
    return rows[0] || null;
  }

  // Danh sách assignment của giảng viên (bao gồm draft)
  async getAssignmentsByInstructor(instructorAccId) {
    const db = await connectDB();
    const query = `
      SELECT 
        a.AssignmentID, a.Title, a.Description, a.Deadline, a.Type, a.FileURL, a.Status,
        u.Title AS UnitTitle
      FROM assignment a
      JOIN instructor i ON a.InstructorID = i.InstructorID
      LEFT JOIN unit u ON a.UnitID = u.UnitID
      WHERE i.AccID = ?
      ORDER BY a.Status DESC, a.Deadline DESC
    `;
    const [rows] = await db.query(query, [instructorAccId]);
    return rows;
  }

  // Lấy toàn bộ Unit của giảng viên (theo AccID) để fill dropdown
  async getUnitsByInstructor(instructorAccId) {
    const db = await connectDB();
    const sql = `
      SELECT
        u.UnitID,
        u.Title,
        u.Status,
        c.Title AS CourseTitle,
        c.CourseID
      FROM unit u
      JOIN course c ON u.CourseID = c.CourseID
      JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE i.AccID = ?
        AND (u.Status IS NULL OR LOWER(u.Status) != 'deleted')
        AND (c.Status IS NULL OR LOWER(c.Status) != 'deleted')
      ORDER BY c.Title ASC, u.Title ASC
    `;
    const [rows] = await db.query(sql, [instructorAccId]);

    console.log(`[DEBUG] getUnitsByInstructor - AccID: ${instructorAccId}, Found: ${rows.length} units`);

    return rows;
  }
  // Lấy danh sách courses của instructor (để làm dropdown Course)
  async getCoursesByInstructor(instructorAccId) {
    const db = await connectDB();
    const sql = `
    SELECT c.CourseID, c.Title, c.Status
    FROM course c
    JOIN instructor i ON c.InstructorID = i.InstructorID
    WHERE i.AccID = ?
      AND (c.Status IS NULL OR LOWER(c.Status) <> 'deleted')
    ORDER BY c.Title ASC
  `;
    const [rows] = await db.query(sql, [instructorAccId]);
    return rows;
  }
  // Lấy Units theo instructor + courseId (lọc động theo course đã chọn)
  async getUnitsByInstructorAndCourse(instructorAccId, courseId) {
    const db = await connectDB();
    const sql = `
    SELECT u.UnitID, u.Title, u.Status
    FROM unit u
    JOIN course c ON u.CourseID = c.CourseID
    JOIN instructor i ON c.InstructorID = i.InstructorID
    WHERE i.AccID = ?
      AND c.CourseID = ?
      AND (u.Status IS NULL OR LOWER(u.Status) <> 'deleted')
    ORDER BY u.Title ASC
  `;
    const [rows] = await db.query(sql, [instructorAccId, courseId]);
    return rows;
  }

}

module.exports = new AssignmentRepository();