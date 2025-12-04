const connectDB = require("../config/db");
const Enrollment = require("../models/enrollment");
const Learner = require("../models/learner");
const Session = require("../models/session");

class InstructorClassRosterRepository {
  async getStudents(classId) {
    const db = await connectDB();

    const [classStats] = await db.query(
      `SELECT 
            c.InstructorID,
            c.Numofsession, 
            (SELECT COUNT(DISTINCT SessionID) FROM session s WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID) as RealSessionCount
         FROM class c
         WHERE c.ClassID = ?`,
      [classId]
    );

    if (classStats.length === 0) return [];

    const info = classStats[0];
    const instructorId = info.InstructorID;
    const realSessions = info.RealSessionCount || 0;
    const plannedSessions = info.Numofsession || 0;
    const totalCurriculum = realSessions > 0 ? realSessions : plannedSessions;

    const [allSessions] = await db.query(
      `SELECT SessionID, Date, DAYNAME(Date) as DayOfWeek
         FROM session 
         WHERE ClassID = ? AND InstructorID = ?
         ORDER BY Date ASC`,
      [classId, instructorId]
    );

    const [attendanceRecords] = await db.query(
      `SELECT atd.LearnerID, atd.SessionID, atd.Status
         FROM attendance atd
         JOIN session s ON atd.SessionID = s.SessionID
         WHERE s.ClassID = ? AND s.InstructorID = ?`,
      [classId, instructorId]
    );

    const attendanceMap = new Map();
    attendanceRecords.forEach((rec) => {
      const normalizedStatus = rec.Status ? rec.Status.toLowerCase() : "";
      attendanceMap.set(`${rec.LearnerID}-${rec.SessionID}`, normalizedStatus);
    });

    const [students] = await db.query(
      `SELECT 
          l.LearnerID, l.FullName, l.ProfilePicture, a.Email, a.Phone
        FROM enrollment e
        JOIN learner l ON e.LearnerID = l.LearnerID
        JOIN account a ON l.AccID = a.AccID
        WHERE e.ClassID = ? AND e.Status = 'Enrolled'
        ORDER BY l.FullName ASC`,
      [classId]
    );

    return students.map((std) => {
      let presentCount = 0;
      let timelineOccurred = 0;

      const sessionDetails = allSessions.map((session) => {
        const sessionKey = `${std.LearnerID}-${session.SessionID}`;
        const status = attendanceMap.get(sessionKey);

        const sessionDate = new Date(session.Date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        sessionDate.setHours(0, 0, 0, 0);

        const isPast = sessionDate <= now;

        if (isPast) {
          timelineOccurred++;
        }

        let displayStatus = null;

        if (status === "present") {
          displayStatus = true;
          if (isPast) {
            presentCount++;
          }
        } else if (status === "absent") {
          displayStatus = false;
        }

        return {
          SessionID: session.SessionID,
          Date: session.Date,
          DayOfWeek: session.DayOfWeek,
          IsPresent: displayStatus,
        };
      });

      const attendanceRate =
        timelineOccurred > 0
          ? Math.round((presentCount / timelineOccurred) * 100)
          : 0;

      const studentProgress =
        totalCurriculum > 0
          ? Math.round((presentCount / totalCurriculum) * 100)
          : 0;

      return {
        LearnerID: std.LearnerID,
        FullName: std.FullName,
        ProfilePicture: std.ProfilePicture,
        Contact: {
          Email: std.Email || "",
          Phone: std.Phone || "",
        },
        Attendance: {
          Present: presentCount,
          TotalOccurred: timelineOccurred,
          TotalCurriculum: totalCurriculum,
          Rate: attendanceRate,
          Progress: studentProgress,
          History: sessionDetails,
        },
      };
    });
  }

  //Lịch buổi học theo classid va instructorid
  async getSessions(classId, instructorId) {
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
     AND s.InstructorID = ?
     ORDER BY s.Date ASC, t.StartTime ASC`,
      [classId, instructorId]
    );

    return rows.map((row) => ({
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
        t.StartTime,
        t.EndTime,
        t.Day,
        c.ClassID,
        c.Name,
        c.CourseID,
        c.ZoomID, 
        c.Zoompass   
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
      startTime: row.StartTime,
      endTime: row.EndTime,
      dayOfWeek: row.Day,
      classId: row.ClassID,
      className: row.Name,
      courseId: row.CourseID,

      ZoomID: row.ZoomID,
      ZoomPass: row.Zoompass,
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

  async getInstructorAvailability(instructorId, startDate, endDate) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
          DATE_FORMAT(i.Date, '%Y-%m-%d') as date,
          inst.Type as instructorType,
          CASE 
            WHEN t.StartTime = '08:00:00' THEN 1
            WHEN t.StartTime = '10:20:00' THEN 2
            WHEN t.StartTime = '13:00:00' THEN 3
            WHEN t.StartTime = '15:20:00' THEN 4
            WHEN t.StartTime = '18:00:00' THEN 5
            WHEN t.StartTime = '20:00:00' THEN 6
            ELSE 0 
          END as timeslotId
       FROM instructortimeslot i
       JOIN timeslot t ON i.TimeslotID = t.TimeslotID
       JOIN instructor inst ON i.InstructorID = inst.InstructorID
       WHERE i.InstructorID = ? 
         AND i.Date BETWEEN ? AND ? 
         AND i.Status = 'AVAILABLE'`,
      [instructorId, startDate, endDate]
    );
    return rows;
  }

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
            WHEN t.StartTime = '18:00:00' THEN 5
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
              WHEN t.StartTime = '18:00:00' THEN 5
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
              startTime = "18:00:00";
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
                 AND Day = DAYNAME(?) 
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

  async addInstructorAvailability(instructorId, newSlots) {
    const db = await connectDB();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      for (const slot of newSlots) {
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
            startTime = "18:00:00";
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
               AND Day = DAYNAME(?) 
               AND NOT EXISTS (
                   SELECT 1 FROM instructortimeslot 
                   WHERE InstructorID = ? 
                   AND Date = ? 
                   AND TimeslotID = timeslot.TimeslotID 
               )
             LIMIT 1`,
            [
              instructorId,
              slot.date,
              startTime,
              slot.date,
              instructorId,
              slot.date,
            ]
          );
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
