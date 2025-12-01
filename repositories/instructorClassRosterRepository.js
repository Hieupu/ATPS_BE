const connectDB = require("../config/db");
const Enrollment = require("../models/enrollment");
const Learner = require("../models/learner");
const Session = require("../models/session");

class InstructorClassRosterRepository {
  async getStudents(classId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT l.LearnerID, l.FullName, l.ProfilePicture, a.Email, a.Phone
       FROM enrollment e
       JOIN learner l ON e.LearnerID = l.LearnerID
       JOIN account a ON l.AccID = a.AccID
       WHERE e.ClassID = ? AND e.Status = 'Enrolled'
       ORDER BY l.FullName ASC`,
      [classId]
    );
    return rows.map(
      (row) =>
        new Learner({
          LearnerID: row.LearnerID,
          FullName: row.FullName,
          ProfilePicture: row.ProfilePicture,
          Email: row.Email || null,
          Phone: row.Phone || null,
        })
    );
  }

  //Lịch buổi học – chỉ để hiển thị thời khóa biểu
  async getSessions(classId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT
        s.SessionID,
        s.Title,
        s.Date,
        s.ZoomUUID,
        t.StartTime,
        t.EndTime,
        t.Day
     FROM session s
     JOIN timeslot t ON s.TimeslotID = t.TimeslotID
     WHERE s.ClassID = ?
     ORDER BY s.Date ASC, t.StartTime ASC`,
      [classId]
    );

    return rows.map((row) => ({
      SessionID: row.SessionID,
      sessionId: row.SessionID,
      title: row.Title,
      date: row.Date,
      zoomLink: row.ZoomUUID || null,
      startTime: row.StartTime,
      endTime: row.EndTime,
      dayOfWeek: row.Day,
    }));
  }
  //lấy buổi học theo instructor
  async getSessionsByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT
        s.SessionID,
        s.Title,
        s.Date,
        s.ZoomUUID,
        t.StartTime,
        t.EndTime,
        t.Day,
        c.ClassID,
        c.Name,
        c.CourseID
     FROM session s
     JOIN timeslot t ON s.TimeslotID = t.TimeslotID
     JOIN class c ON s.ClassID = c.ClassID
     WHERE s.InstructorID = ?
     ORDER BY s.Date ASC, t.StartTime ASC`,
      [instructorId]
    );

    return rows.map((row) => ({
      sessionId: row.SessionID,
      title: row.Title,
      date: row.Date,
      zoomLink: row.ZoomUUID || null,
      startTime: row.StartTime,
      endTime: row.EndTime,
      dayOfWeek: row.Day,
      classId: row.ClassID,
      className: row.Name,
      courseId: row.CourseID,
    }));
  }
  async getTotalEnrolledStudents(classId) {
    const db = await connectDB();
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS total 
       FROM enrollment 
       WHERE ClassID = ? AND Status = 'Enrolled'`,
      [classId]
    );
    return Number(row.total) || 0;
  }

  async getAttendedCount(sessionId) {
    const db = await connectDB();
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM attendance 
       WHERE SessionID = ? AND Status = 'PRESENT'`,
      [sessionId]
    );
    return Number(row.count) || 0;
  }

  // 1. Lấy danh sách rảnh
  async getInstructorAvailability(instructorId, startDate, endDate) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
          DATE_FORMAT(i.Date, '%Y-%m-%d') as date,
       
          CASE 
            WHEN t.StartTime = '08:00:00' THEN 1
            WHEN t.StartTime = '10:20:00' THEN 2
            WHEN t.StartTime = '13:00:00' THEN 3
            WHEN t.StartTime = '15:20:00' THEN 4
            WHEN t.StartTime = '17:40:00' THEN 5
            WHEN t.StartTime = '20:00:00' THEN 6
            ELSE 0 
          END as timeslotId
       FROM instructortimeslot i
       JOIN timeslot t ON i.TimeslotID = t.TimeslotID
       WHERE i.InstructorID = ? 
         AND i.Date BETWEEN ? AND ? 
         AND i.Status = 'AVAILABLE'`,
      [instructorId, startDate, endDate]
    );
    return rows;
  }

  // 2. Lấy danh sách ĐANG DẠY
  async getInstructorOccupiedSlots(instructorId, startDate, endDate) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
          DATE_FORMAT(s.Date, '%Y-%m-%d') as date,
          CASE 
            WHEN t.StartTime = '08:00:00' THEN 1
            WHEN t.StartTime = '10:20:00' THEN 2
            WHEN t.StartTime = '13:00:00' THEN 3
            WHEN t.StartTime = '15:20:00' THEN 4
            WHEN t.StartTime = '17:40:00' THEN 5
            WHEN t.StartTime = '20:00:00' THEN 6
            ELSE 0 
          END as timeslotId
       FROM session s
       JOIN timeslot t ON s.TimeslotID = t.TimeslotID
       WHERE s.InstructorID = ? 
         AND s.Date BETWEEN ? AND ?`,
      [instructorId, startDate, endDate]
    );
    return rows;
  }

  // 3. Cập nhật lịch rảnh
  async saveInstructorAvailability(instructorId, startDate, endDate, newSlots) {
    const db = await connectDB();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [currentRows] = await connection.query(
        `SELECT 
            i.TimeslotID as RealID, 
            DATE_FORMAT(i.Date, '%Y-%m-%d') as DateStr,
            CASE 
              WHEN t.StartTime = '08:00:00' THEN 1
              WHEN t.StartTime = '10:20:00' THEN 2
              WHEN t.StartTime = '13:00:00' THEN 3
              WHEN t.StartTime = '15:20:00' THEN 4
              WHEN t.StartTime = '17:40:00' THEN 5
              WHEN t.StartTime = '20:00:00' THEN 6
              ELSE 0 
            END as MappedID
         FROM instructortimeslot i
         JOIN timeslot t ON i.TimeslotID = t.TimeslotID
         WHERE i.InstructorID = ? 
           AND i.Date BETWEEN ? AND ? 
           AND i.Status = 'AVAILABLE'`,
        [instructorId, startDate, endDate]
      );

      const createKey = (dateStr, mappedId) => `${dateStr}_${mappedId}`;

      const currentMap = new Map();
      currentRows.forEach((row) => {
        currentMap.set(createKey(row.DateStr, row.MappedID), row.RealID);
      });

      const newKeys = new Set();
      newSlots.forEach((slot) => {
        newKeys.add(createKey(slot.date, slot.timeslotId));
      });

      for (const [key, realId] of currentMap) {
        if (!newKeys.has(key)) {
          await connection.query(
            `DELETE FROM instructortimeslot WHERE InstructortimeslotID = ? OR (InstructorID = ? AND TimeslotID = ? AND Status = 'AVAILABLE')`,
            [realId, instructorId, realId]
          );
        }
      }

      const toInsert = newSlots.filter((slot) => {
        return !currentMap.has(createKey(slot.date, slot.timeslotId));
      });

      if (toInsert.length > 0) {
        for (const slot of toInsert) {
          let startTime;
          switch (slot.timeslotId) {
            case 1:
              startTime = "08:00:00";
              break;
            case 2:
              startTime = "10:20:00";
              break;
            case 3:
              startTime = "13:00:00";
              break;
            case 4:
              startTime = "15:20:00";
              break;
            case 5:
              startTime = "17:40:00";
              break;
            case 6:
              startTime = "20:00:00";
              break;
          }

          if (startTime) {
            await connection.query(
              `INSERT INTO instructortimeslot (TimeslotID, InstructorID, Date, Status, Note)
               SELECT TimeslotID, ?, ?, 'AVAILABLE', 'Đăng ký rảnh'
               FROM timeslot
               WHERE StartTime = ? 
                 AND Day = DAYNAME(?) -- Hàm này trả về Monday, Tuesday... khớp với ngày truyền vào
               LIMIT 1`,
              [instructorId, slot.date, startTime, slot.date]
            );
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new InstructorClassRosterRepository();
