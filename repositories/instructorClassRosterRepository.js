const connectDB = require("../config/db");
const Enrollment = require("../models/enrollment");
const Learner = require("../models/learner");
const Session = require("../models/session");

class InstructorClassRosterRepository {
  async getStudents(classId) {
    const db = await connectDB();

    // BƯỚC 1: Lấy thông tin Lớp & Thống kê Session
    // Logic: Query bảng Class để lấy InstructorID chuẩn, sau đó dùng subquery để đếm session.
    const [classStats] = await db.query(
      `SELECT
            c.InstructorID,
            c.Numofsession, -- Số buổi dự kiến (theo giáo trình)
            
            -- Đếm session thực tế (Phải khớp cả ClassID lẫn InstructorID)
            (SELECT COUNT(DISTINCT SessionID) 
             FROM session s 
             WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID) as RealSessionCount,

            -- Đếm session đã diễn ra (Date <= Hôm nay)
            (SELECT COUNT(DISTINCT SessionID) 
             FROM session s 
             WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID AND s.Date <= CURDATE()) as TotalOccurred
         FROM class c
         WHERE c.ClassID = ?`,
      [classId]
    );

    // Kiểm tra nếu lớp không tồn tại
    if (classStats.length === 0) return [];

    const info = classStats[0];
    const realSessions = info.RealSessionCount || 0;
    const plannedSessions = info.Numofsession || 0;
    const totalOccurred = info.TotalOccurred || 0;
    const instructorId = info.InstructorID; // <--- Lấy ID giảng viên để dùng cho query dưới

    // Logic Fallback: Ưu tiên đếm thực tế, nếu chưa có thì lấy dự kiến
    // (Giúp hiển thị đúng "0/20" khi lớp mới tạo chưa xếp lịch)
    const totalCurriculum = realSessions > 0 ? realSessions : plannedSessions;

    // BƯỚC 2: Lấy danh sách sinh viên
    // FIX: Thêm điều kiện s.InstructorID = ? vào subquery đếm vắng
    const [rows] = await db.query(
      `SELECT
        l.LearnerID,
        l.FullName,
        l.ProfilePicture,
        a.Email,
        a.Phone,
        (
            SELECT COUNT(DISTINCT atd.SessionID)
            FROM attendance atd
            JOIN session s ON atd.SessionID = s.SessionID
            WHERE atd.LearnerID = l.LearnerID
            AND s.ClassID = e.ClassID
            AND s.InstructorID = ?  -- <--- QUAN TRỌNG: Chỉ đếm vắng các buổi của GV này
            AND atd.Status = 'absent'
            AND s.Date <= CURDATE()
        ) AS AbsentCount
       FROM enrollment e
       JOIN learner l ON e.LearnerID = l.LearnerID
       JOIN account a ON l.AccID = a.AccID
       WHERE e.ClassID = ? AND e.Status = 'Enrolled'
       ORDER BY l.FullName ASC`,
      [instructorId, classId] // Lưu ý thứ tự tham số: InstructorID trước (cho subquery), ClassID sau (cho WHERE chính)
    );

    // BƯỚC 3: Map dữ liệu
    return rows.map((row) => {
      const absentCount = row.AbsentCount || 0;

      // Present = Tổng đã diễn ra - Số vắng
      // Math.max(0) để đảm bảo an toàn tuyệt đối
      const presentCount = Math.max(0, totalOccurred - absentCount);

      // Tính % Tiến độ (So với tổng khóa)
      const courseProgress =
        totalCurriculum > 0
          ? Math.round((presentCount / totalCurriculum) * 100)
          : 0;

      // Tính % Chuyên cần (So với số buổi đã qua)
      const attendanceRate =
        totalOccurred > 0
          ? Math.round((presentCount / totalOccurred) * 100)
          : 100;

      return {
        LearnerID: row.LearnerID,
        FullName: row.FullName,
        ProfilePicture: row.ProfilePicture,
        Contact: {
          Email: row.Email || "",
          Phone: row.Phone || "",
        },
        Attendance: {
          Absent: absentCount,
          Present: presentCount,
          TotalOccurred: totalOccurred,
          TotalCurriculum: totalCurriculum,
          Rate: attendanceRate,
          Progress: courseProgress,
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
            WHEN t.StartTime = '18:00:00' THEN 5
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
          let startTime, endTime;
          switch (slot.timeslotId) {
            case 1:
              startTime = "08:00:00";
              endTime = "10:00:00";
              break;
            case 2:
              startTime = "10:20:00";
              endTime = "12:20:00";
              break;
            case 3:
              startTime = "13:00:00";
              endTime = "15:00:00";
              break;
            case 4:
              startTime = "15:20:00";
              endTime = "17:20:00";
              break;
            case 5:
              startTime = "18:00:00";
              endTime = "20:00:00";
              break;
            case 6:
              startTime = "20:00:00";
              endTime = "22:00:00";
              break;
          }

          if (startTime && endTime) {
            await connection.query(
              `INSERT INTO instructortimeslot (TimeslotID, InstructorID, Date, Status, Note)
               SELECT TimeslotID, ?, ?, 'AVAILABLE', 'Đăng ký rảnh'
               FROM timeslot
               WHERE StartTime = ? 
                 AND EndTime = ?
                 AND (Day = DAYNAME(?) OR Day IS NULL)
               LIMIT 1`,
              [instructorId, slot.date, startTime, endTime, slot.date]
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
