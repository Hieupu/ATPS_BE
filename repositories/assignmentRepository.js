const connectDB = require("../config/db");

class AssignmentRepository {
  async canInstructorAccessUnit(instructorAccId, unitId) {
    const db = await connectDB();
    const query = `
      SELECT 1
      FROM unit u
      JOIN course co ON u.CourseID = co.CourseID
      JOIN class cl ON co.CourseID = cl.CourseID
      JOIN instructor i ON cl.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND u.UnitID = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, unitId]);
    return rows.length > 0;
  }

  // Giảng viên có quyền với Assignment này không?
  async canInstructorAccessAssignment(instructorAccId, assignmentId) {
    const db = await connectDB();
    const query = `
      SELECT 1
      FROM assignment a
      JOIN unit u ON a.UnitID = u.UnitID
      JOIN course co ON u.CourseID = co.CourseID
      JOIN class cl ON co.CourseID = cl.CourseID
      JOIN instructor i ON cl.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND a.AssignmentID = ?
      LIMIT 1
    `;
    const [rows] = await db.query(query, [instructorAccId, assignmentId]);
    return rows.length > 0;
  }

  // Tạo bài tập theo schema mới (có Status NOT NULL)
  async createAssignment({ title, description, deadline, type, unitId, status }) {
    const db = await connectDB();
    const insert = `
      INSERT INTO assignment
      (Title, Description, Deadline, Type, UnitID, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insert, [
      title,
      description,
      deadline,
      type,
      unitId ?? null,
      status, // "active" mặc định
    ]);

    return {
      AssignmentID: result.insertId,
      Title: title,
      Description: description,
      Deadline: deadline,
      Type: type,
      UnitID: unitId ?? null,
      Status: status,
    };
  }

  // Cập nhật (partial update — chỉ cột được truyền)
  async updateAssignment(assignmentId, { title, description, deadline, type, unitId, status }) {
    const db = await connectDB();
    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push("Title = ?"); params.push(title); }
    if (description !== undefined) { fields.push("Description = ?"); params.push(description); }
    if (deadline !== undefined) { fields.push("Deadline = ?"); params.push(deadline); }
    if (type !== undefined) { fields.push("Type = ?"); params.push(type); }
    if (unitId !== undefined) { fields.push("UnitID = ?"); params.push(unitId); }
    if (status !== undefined) { fields.push("Status = ?"); params.push(status); }

    if (!fields.length) return this.getAssignmentById(assignmentId);

    const sql = `UPDATE assignment SET ${fields.join(", ")} WHERE AssignmentID = ?`;
    params.push(assignmentId);
    await db.query(sql, params);

    return this.getAssignmentById(assignmentId);
  }

  // Xóa mềm: đổi trạng thái
  async softDeleteAssignment(assignmentId, newStatus = "inactive") {
    const db = await connectDB();
    await db.query(
      `UPDATE assignment SET Status = ? WHERE AssignmentID = ?`,
      [newStatus, assignmentId]
    );
    return this.getAssignmentById(assignmentId);
  }

  async getAssignmentById(assignmentId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT AssignmentID, Title, Description, Deadline, Type, UnitID, Status
       FROM assignment
       WHERE AssignmentID = ?`,
      [assignmentId]
    );
    return rows[0] || null;
  }

  // Danh sách bài tập của giảng viên (chỉ active)
  async getAssignmentsByInstructor(instructorAccId) {
    const db = await connectDB();
    const query = `
      SELECT 
        a.AssignmentID, a.Title, a.Description, a.Deadline, a.Type, a.Status,
        u.UnitID, u.Title AS UnitTitle,
        co.CourseID, co.Title AS CourseTitle,
        cl.ClassID, cl.Name AS ClassName
      FROM assignment a
      JOIN unit u ON a.UnitID = u.UnitID
      JOIN course co ON u.CourseID = co.CourseID
      JOIN class cl ON co.CourseID = cl.CourseID
      JOIN instructor i ON cl.InstructorID = i.InstructorID
      WHERE i.AccID = ? AND a.Status = 'active'
      ORDER BY a.Deadline DESC
    `;
    const [rows] = await db.query(query, [instructorAccId]);
    return rows;
  }
}

module.exports = new AssignmentRepository();
