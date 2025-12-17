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
        c.Name,  -- Lấy tên lớp (Class Name) thay vì Session Title
        s.Date,
        s.ZoomUUID,
        t.StartTime,
        t.EndTime,
        t.Day,
        scr.Status AS ChangeReqStatus 
      FROM session s
      JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      JOIN class c ON s.ClassID = c.ClassID -- Thêm JOIN bảng class để lấy tên lớp
      
      LEFT JOIN session_change_request scr 
        ON s.SessionID = scr.SessionID 
        AND scr.Status = 'PENDING'
        
      WHERE s.ClassID = ?
      AND s.InstructorID = ?
      ORDER BY s.Date ASC, t.StartTime ASC`,
      [classId, instructorId]
    );

    return rows.map((row) => ({
      sessionId: row.SessionID,
      title: row.Name, // Map Name của Class vào field title
      date: row.Date,
      zoomLink: row.ZoomUUID || null,
      startTime: row.StartTime,
      endTime: row.EndTime,
      dayOfWeek: row.Day,
      changeReqStatus: row.ChangeReqStatus || null,
    }));
  }

  // 2. Lấy danh sách buổi học theo InstructorID (Lịch dạy)
  async getSessionsByInstructor(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT
        s.SessionID,
     
        s.Date,
        t.StartTime,
        t.EndTime,
        t.Day,
        c.ClassID,
        c.Name, 
        c.CourseID,
        c.ZoomID, 
        c.Zoompass,
        scr.Status AS ChangeReqStatus  
      FROM session s
      JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      JOIN class c ON s.ClassID = c.ClassID
      
      LEFT JOIN session_change_request scr 
        ON s.SessionID = scr.SessionID 
        AND scr.Status = 'PENDING'
      
      WHERE s.InstructorID = ?
      ORDER BY s.Date ASC, t.StartTime ASC`,
      [instructorId]
    );

    return rows.map((row) => ({
      sessionId: row.SessionID,
      title: row.Name,
      date: row.Date,
      startTime: row.StartTime,
      endTime: row.EndTime,
      dayOfWeek: row.Day,
      classId: row.ClassID,
      className: row.Name,
      courseId: row.CourseID,
      ZoomID: row.ZoomID,
      ZoomPass: row.Zoompass,
      changeReqStatus: row.ChangeReqStatus || null,
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
       WHERE SessionID = ?`,
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

  // Tạo yêu cầu đổi lịch mới
  async createChangeRequest(
    sessionId,
    instructorId,
    newDate,
    newStartTime,
    reason
  ) {
    const db = await connectDB();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const dateObj = new Date(newDate);
      const dayName = days[dateObj.getDay()];

   
      const [timeslotRows] = await connection.query(
        `SELECT TimeslotID FROM timeslot WHERE StartTime = ? AND Day = ? LIMIT 1`,
        [newStartTime, dayName]
      );

      if (timeslotRows.length === 0) {
        throw new Error(
          "Không tìm thấy khung giờ cố định phù hợp trong hệ thống (Sai giờ hoặc ngày)."
        );
      }
      const newTimeslotId = timeslotRows[0].TimeslotID;

 
      const [conflictRows] = await connection.query(
        `
        SELECT l.FullName, l.LearnerID
        FROM session s_existing
        JOIN enrollment e_existing ON s_existing.ClassID = e_existing.ClassID
        JOIN learner l ON e_existing.LearnerID = l.LearnerID
        WHERE s_existing.Date = ? 
          AND s_existing.TimeslotID = ?
          AND s_existing.SessionID != ? 
          AND e_existing.LearnerID IN (
              
              SELECT e_current.LearnerID
              FROM session s_current
              JOIN enrollment e_current ON s_current.ClassID = e_current.ClassID
              WHERE s_current.SessionID = ?
          )
        LIMIT 1;
        `,
        [newDate, newTimeslotId, sessionId, sessionId]
      );

      if (conflictRows.length > 0) {
        throw new Error(
          `Không thể đổi lịch vì học viên ${conflictRows[0].FullName} đã có lịch học khác vào khung giờ này.`
        );
      }

   
      const [result] = await connection.query(
        `INSERT INTO session_change_request 
          (SessionID, InstructorID, NewDate, NewTimeslotID, Reason, Status, CreatedDate) 
         VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())`,
        [sessionId, instructorId, newDate, newTimeslotId, reason]
      );

      const newRequestId = result.insertId;

    
      const [instructorRows] = await connection.query(
        `SELECT FullName FROM instructor WHERE InstructorID = ?`,
        [instructorId]
      );
      const instructorName = instructorRows[0]
        ? instructorRows[0].FullName
        : "Giảng viên";

      const [admins] = await connection.query(`SELECT AccID FROM admin`);

      if (admins.length > 0) {
        const notiContent = `${instructorName} đã gửi một yêu cầu đổi lịch mới.`;
        const notiType = "CHANGE_REQUEST";
        const notiStatus = "unread";

        const notificationValues = admins.map((admin) => [
          notiContent,
          notiType,
          notiStatus,
          admin.AccID,
        ]);

        await connection.query(
          `INSERT INTO notification (Content, Type, Status, AccID) VALUES ?`,
          [notificationValues]
        );
      }

      await connection.commit();

      return newRequestId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getSessionById(sessionId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT SessionID, InstructorID FROM session WHERE SessionID = ?`,
      [sessionId]
    );
    return rows[0];
  }

  //admin duyệt yêu cầu đổi lịch
  // 1. Admin DUYỆT yêu cầu đổi lịch (Đã sửa lỗi Timestamp)
  async approveChangeRequest(requestId, adminId) {
    const db = await connectDB();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // B1: Lấy thông tin request
      const [reqRows] = await connection.query(
        `SELECT * FROM session_change_request WHERE RequestID = ? FOR UPDATE`,
        [requestId]
      );

      if (reqRows.length === 0) throw new Error("Yêu cầu không tồn tại.");
      const request = reqRows[0];

      if (request.Status !== "PENDING") {
        throw new Error("Yêu cầu này đã được xử lý trước đó.");
      }

      // B2: Cập nhật lịch chính thức
      await connection.query(
        `UPDATE session 
         SET Date = ?, TimeslotID = ? 
         WHERE SessionID = ?`,
        [request.NewDate, request.NewTimeslotID, request.SessionID]
      );

      // B3: Cập nhật trạng thái Request
      await connection.query(
        `UPDATE session_change_request 
         SET Status = 'APPROVED', ApprovedBy = ? 
         WHERE RequestID = ?`,
        [adminId, requestId]
      );

      // B4: Gửi thông báo (ĐÃ SỬA: Bỏ cột Timestamp)
      const [instRows] = await connection.query(
        `SELECT AccID FROM instructor WHERE InstructorID = ?`,
        [request.InstructorID]
      );

      if (instRows.length > 0) {
        const instructorAccId = instRows[0].AccID;
        const message = `Yêu cầu đổi lịch của bạn đã được Admin chấp nhận.`;

        await connection.query(
          `INSERT INTO notification (Content, Type, Status, AccID) 
           VALUES (?, 'REQUEST_APPROVED', 'unread', ?)`,
          [message, instructorAccId]
        );
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

  // 2. Admin TỪ CHỐI yêu cầu (Đã sửa lỗi Timestamp)
  async rejectChangeRequest(requestId, adminId, rejectReason) {
    const db = await connectDB();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [reqRows] = await connection.query(
        `SELECT * FROM session_change_request WHERE RequestID = ? FOR UPDATE`,
        [requestId]
      );

      if (reqRows.length === 0) throw new Error("Yêu cầu không tồn tại.");
      if (reqRows[0].Status !== "PENDING")
        throw new Error("Yêu cầu này đã được xử lý.");

      const request = reqRows[0];

      // B2: Cập nhật trạng thái REJECTED
      await connection.query(
        `UPDATE session_change_request 
         SET Status = 'REJECTED', ApprovedBy = ? 
         WHERE RequestID = ?`,
        [adminId, requestId]
      );

      // B3: Gửi thông báo (ĐÃ SỬA: Bỏ cột Timestamp)
      const [instRows] = await connection.query(
        `SELECT AccID FROM instructor WHERE InstructorID = ?`,
        [request.InstructorID]
      );

      if (instRows.length > 0) {
        const instructorAccId = instRows[0].AccID;
        const message = `Yêu cầu đổi lịch đã bị từ chối. Lý do: ${
          rejectReason || "Không có"
        }`;

        await connection.query(
          `INSERT INTO notification (Content, Type, Status, AccID) 
           VALUES (?, 'REQUEST_REJECTED', 'unread', ?)`,
          [message, instructorAccId]
        );
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

  // Lấy danh sách tất cả yêu cầu đổi lịch (cho admin)
  async getAllSessionChangeRequests() {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
        scr.RequestID,
        scr.SessionID,
        scr.InstructorID,
        scr.NewDate,
        scr.NewTimeslotID,
        scr.Reason,
        scr.Status,
        scr.CreatedDate,
        s.Date AS OldDate,
        s.TimeslotID AS OldTimeslotID,
        i.FullName AS InstructorName
      FROM session_change_request scr
      LEFT JOIN session s ON scr.SessionID = s.SessionID
      LEFT JOIN instructor i ON scr.InstructorID = i.InstructorID
      ORDER BY scr.CreatedDate DESC`
    );
    return rows;
  }
}

module.exports = new InstructorClassRosterRepository();
