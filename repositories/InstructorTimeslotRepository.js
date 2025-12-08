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

  // ========== Instructor Leave Methods ==========

  // Tạo lịch nghỉ cho giảng viên
  async create(data) {
    try {
      const { InstructorID, TimeslotID, Date, Status, Note } = data;
      const db = await connectDB();
      const [result] = await db.execute(
        `INSERT INTO instructortimeslot (InstructorID, TimeslotID, Date, Status, Note)
         VALUES (?, ?, ?, ?, ?)`,
        [InstructorID, TimeslotID, Date, Status || "HOLIDAY", Note || null]
      );
      return {
        InstructorTimeslotID: result.insertId,
        InstructorID,
        TimeslotID,
        Date,
        Status: Status || "HOLIDAY",
        Note: Note || null,
      };
    } catch (error) {
      console.error(
        "Database error in create (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }
  // Kiểm tra xung đột với session đã có
  async checkSessionConflict(instructorId, timeslotId, date) {
    try {
      const db = await connectDB();
      const [rows] = await db.execute(
        `SELECT s.SessionID, s.Title, c.Name as ClassName
       FROM session s
       JOIN \`class\` c ON s.ClassID = c.ClassID
       WHERE s.InstructorID = ? AND s.TimeslotID = ? AND s.Date = ?`,
        [instructorId, timeslotId, date]
      );
      return rows[0] || null;
    } catch (error) {
      console.error(
        "Database error in checkSessionConflict (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }
  // Kiểm tra xung đột với lịch nghỉ đã có
  async checkConflict(instructorId, timeslotId, date) {
    try {
      const db = await connectDB();
      const [rows] = await db.execute(
        `SELECT * FROM instructortimeslot 
         WHERE InstructorID = ? AND TimeslotID = ? AND Date = ?`,
        [instructorId, timeslotId, date]
      );
      return rows[0] || null;
    } catch (error) {
      console.error(
        "Database error in checkConflict (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }

  // Tìm lịch nghỉ với filter và pagination - trả về unique ngày nghỉ
  async findLeaves(options = {}) {
    try {
      const {
        instructorId = null,
        status = null,
        startDate = null,
        endDate = null,
        limit = 20,
        offset = 0,
      } = options;

      const db = await connectDB();
      let query = `
        SELECT 
          it.Date,
          it.Status,
          it.Note,
          COUNT(DISTINCT it.InstructorID) as InstructorCount,
          GROUP_CONCAT(DISTINCT i.FullName ORDER BY i.FullName SEPARATOR ', ') as InstructorNames
        FROM instructortimeslot it
        LEFT JOIN instructor i ON it.InstructorID = i.InstructorID
        WHERE 1=1
      `;
      const params = [];

      if (instructorId) {
        query += ` AND it.InstructorID = ?`;
        params.push(instructorId);
      }

      if (status) {
        query += ` AND it.Status = ?`;
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

      query += ` GROUP BY it.Date, it.Status, it.Note`;
      query += ` ORDER BY it.Date DESC`;

      const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
      const safeOffset = Math.max(0, Number(offset) || 0);
      query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error(
        "Database error in findLeaves (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }

  // Đếm số lịch nghỉ với filter
  async countLeaves(options = {}) {
    try {
      const {
        instructorId = null,
        status = null,
        startDate = null,
        endDate = null,
      } = options;

      const db = await connectDB();
      let query = `
        SELECT COUNT(DISTINCT it.Date) as total
        FROM instructortimeslot it
        WHERE 1=1
      `;
      const params = [];

      if (instructorId) {
        query += ` AND it.InstructorID = ?`;
        params.push(instructorId);
      }

      if (status) {
        query += ` AND it.Status = ?`;
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

      const [rows] = await db.execute(query, params);
      return rows[0]?.total || 0;
    } catch (error) {
      console.error(
        "Database error in countLeaves (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }

  // Xóa lịch nghỉ theo ID
  async deleteLeave(instructorTimeslotId) {
    try {
      const db = await connectDB();
      const [result] = await db.execute(
        `DELETE FROM instructortimeslot WHERE InstructorTimeslotID = ?`,
        [instructorTimeslotId]
      );
      return {
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      console.error(
        "Database error in deleteLeave (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }

  // Xóa tất cả lịch nghỉ của một ngày
  async deleteByDate(date, status = null) {
    try {
      const db = await connectDB();
      let query = `DELETE FROM instructortimeslot WHERE Date = ?`;
      const params = [date];

      if (status) {
        query += ` AND Status = ?`;
        params.push(status);
      }

      const [result] = await db.execute(query, params);
      return {
        affectedRows: result.affectedRows,
        deleted: result.affectedRows,
      };
    } catch (error) {
      console.error(
        "Database error in deleteByDate (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }

  // Lấy lịch nghỉ/bận trong khoảng thời gian
  async findByDateRange(startDate, endDate, instructorId = null) {
    try {
      const db = await connectDB();
      let query = `
        SELECT 
          it.*,
          t.StartTime,
          t.EndTime,
          t.Day
        FROM instructortimeslot it
        LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
        WHERE it.Date >= ? AND it.Date <= ? 
      `;
      const params = [startDate, endDate];

      if (instructorId) {
        query += ` AND it.InstructorID = ?`;
        params.push(instructorId);
      }

      query += ` ORDER BY it.Date ASC, t.StartTime ASC`;

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error(
        "Database error in findByDateRange (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }

  // Xóa lịch nghỉ/bận trong khoảng thời gian (trừ các status được exclude)
  async deleteByDateRange(
    instructorId,
    startDate,
    endDate,
    excludeStatuses = []
  ) {
    try {
      const db = await connectDB();
      let query = `
        DELETE FROM instructortimeslot 
        WHERE InstructorID = ? 
          AND Date >= ? 
          AND Date <= ?
      `;
      const params = [instructorId, startDate, endDate];

      // Nếu có excludeStatuses, không xóa các status đó
      if (
        excludeStatuses &&
        Array.isArray(excludeStatuses) &&
        excludeStatuses.length > 0
      ) {
        const placeholders = excludeStatuses.map(() => "?").join(",");
        query += ` AND Status NOT IN (${placeholders})`;
        params.push(...excludeStatuses);
      }

      const [result] = await db.execute(query, params);
      return {
        affectedRows: result.affectedRows,
        deleted: result.affectedRows,
      };
    } catch (error) {
      console.error(
        "Database error in deleteByDateRange (InstructorTimeslotRepository):",
        error
      );
      throw error;
    }
  }
}

module.exports = new InstructorTimeslotRepository();
