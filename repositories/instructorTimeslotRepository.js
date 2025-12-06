const connectDB = require("../config/db");
const Timeslot = require("../models/timeslot");

class InstructorTimeslotRepository {
  async listByCourse(courseId) {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM timeslot WHERE CourseID=?", [
      courseId,
    ]);
    return rows.map((r) => new Timeslot(r));
  }

  async create(courseId, sessionId, data) {
    const db = await connectDB();
    const { Date, StartTime, EndTime } = data;
    const [result] = await db.query(
      "INSERT INTO timeslot (CourseID, LessonID, Date, StartTime, EndTime) VALUES (?, ?, ?, ?, ?)",
      [courseId, sessionId, Date, StartTime, EndTime]
    );
    return new Timeslot({
      TimeslotID: result.insertId,
      CourseID: courseId,
      LessonID: sessionId,
      Date,
      StartTime,
      EndTime,
    });
  }

  async update(timeslotId, data) {
    const db = await connectDB();
    const { Date, StartTime, EndTime } = data;
    await db.query(
      "UPDATE timeslot SET Date=?, StartTime=?, EndTime=? WHERE TimeslotID=?",
      [Date, StartTime, EndTime, timeslotId]
    );
  }

  async delete(timeslotId) {
    const db = await connectDB();
    await db.query("DELETE FROM timeslot WHERE TimeslotID=?", [timeslotId]);
  }

  // Tìm các lịch nghỉ của giảng viên
  async findLeaves(options = {}) {
    const db = await connectDB();
    const {
      instructorId = null,
      status = null,
      startDate = null,
      endDate = null,
      limit = 20,
      offset = 0,
    } = options;

    let query = `
      SELECT 
        it.InstructortimeslotID,
        it.InstructorID,
        it.TimeslotID,
        it.Date,
        it.Status,
        it.Note,
        t.StartTime,
        t.EndTime,
        i.FullName as InstructorName
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON it.InstructorID = i.InstructorID
      WHERE 1=1
    `;

    const params = [];

    if (instructorId) {
      query += ` AND it.InstructorID = ?`;
      params.push(instructorId);
    }

    if (status) {
      query += ` AND UPPER(it.Status) = UPPER(?)`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND it.Date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND it.Date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY it.Date DESC, t.StartTime ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    return rows;
  }

  // Đếm tổng số lịch nghỉ
  async countLeaves(options = {}) {
    const db = await connectDB();
    const {
      instructorId = null,
      status = null,
      startDate = null,
      endDate = null,
    } = options;

    let query = `SELECT COUNT(*) as total FROM instructortimeslot WHERE 1=1`;
    const params = [];

    if (instructorId) {
      query += ` AND InstructorID = ?`;
      params.push(instructorId);
    }

    if (status) {
      query += ` AND UPPER(Status) = UPPER(?)`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND Date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND Date <= ?`;
      params.push(endDate);
    }

    const [rows] = await db.query(query, params);
    return rows[0]?.total || 0;
  }

  // Tìm các lịch nghỉ/blocked schedules trong khoảng thời gian
  async findByDateRange(startDate, endDate, instructorId = null) {
    const db = await connectDB();
    let query = `
      SELECT 
        it.InstructortimeslotID,
        it.InstructorID,
        it.TimeslotID,
        it.Date,
        it.Status,
        it.Note,
        t.StartTime,
        t.EndTime,
        i.FullName as InstructorName
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON it.InstructorID = i.InstructorID
      WHERE it.Date >= ? AND it.Date <= ?
    `;

    const params = [startDate, endDate];

    if (instructorId) {
      query += ` AND it.InstructorID = ?`;
      params.push(instructorId);
    }

    query += ` ORDER BY it.Date ASC, t.StartTime ASC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  // Kiểm tra conflict: tìm lịch nghỉ/blocked schedule cho giảng viên vào ca học cụ thể
  async checkConflict(instructorId, timeslotId, date) {
    try {
      const db = await connectDB();

      // Tìm lịch nghỉ/blocked schedule cho giảng viên vào ca học và ngày cụ thể
      const [rows] = await db.query(
        `SELECT 
          it.InstructortimeslotID,
          it.InstructorID,
          it.TimeslotID,
          it.Date,
          it.Status,
          it.Note
        FROM instructortimeslot it
        WHERE it.InstructorID = ? 
          AND it.TimeslotID = ? 
          AND it.Date = ?`,
        [instructorId, timeslotId, date]
      );

      // Trả về record đầu tiên nếu có, hoặc null nếu không có
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Database error in checkConflict:", error);
      throw error;
    }
  }
}

module.exports = new InstructorTimeslotRepository();
