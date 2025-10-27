const connectDB = require("../config/db");
const Course = require("../models/course");

class InstructorCourseRepository {
  async findById(courseId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT CourseID, Title, Description, Duration, TuitionFee, Status, CreatedDate, UpdatedDate
       FROM course WHERE CourseID = ?`,
      [courseId]
    );
    if (!rows.length) return null;
    return new Course(rows[0]);
  }

  async findByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT DISTINCT c.CourseID, c.Title, c.Description, c.Duration, c.TuitionFee,
              c.Status, c.CreatedDate, c.UpdatedDate
       FROM course c
       JOIN class cl ON cl.CourseID = c.CourseID
       WHERE cl.InstructorID = ?
       ORDER BY c.CourseID DESC`,
      [instructorId]
    );
    return rows.map((r) => new Course(r));
  }

  async create({ Title, Description, Duration, TuitionFee, Status = "draft" }) {
    const db = await connectDB();
    const [result] = await db.query(
      `INSERT INTO course (Title, Description, Duration, TuitionFee, Status)
       VALUES (?, ?, ?, ?, ?)`,
      [Title, Description, Duration, TuitionFee, Status]
    );

    const [rows] = await db.query(
      `SELECT CourseID, Title, Description, Duration, TuitionFee, Status, CreatedDate, UpdatedDate
       FROM course WHERE CourseID = ?`,
      [result.insertId]
    );
    return new Course(rows[0]);
  }

  async update(courseId, data) {
    const db = await connectDB();
    const fields = [];
    const values = [];

    if (data.Title !== undefined) {
      fields.push("Title=?");
      values.push(data.Title);
    }
    if (data.Description !== undefined) {
      fields.push("Description=?");
      values.push(data.Description);
    }
    if (data.Duration !== undefined) {
      fields.push("Duration=?");
      values.push(data.Duration);
    }
    if (data.TuitionFee !== undefined) {
      fields.push("TuitionFee=?");
      values.push(data.TuitionFee);
    }
    if (data.Status !== undefined) {
      fields.push("Status=?");
      values.push(data.Status);
    }

    if (!fields.length) return;

    values.push(courseId);
    await db.query(
      `UPDATE course SET ${fields.join(", ")} WHERE CourseID=?`,
      values
    );
  }

  async delete(courseId) {
    const db = await connectDB();
    await db.query("DELETE FROM course WHERE CourseID=?", [courseId]);
  }
}

module.exports = new InstructorCourseRepository();
