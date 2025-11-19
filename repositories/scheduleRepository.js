const connectDB = require("../config/db");

class ScheduleRepository {
  async getLearnerSchedule(learnerId) {
    try {
      const db = await connectDB();
      // Hiển thị lịch học sau khi đã thanh toán:
      // - Enrollment status = 'Enrolled' (đã thanh toán)
      // - Class status IN ('active', 'paid')
      //   + 'active' = đã được giáo viên xác nhận và active
      //   + 'paid' = đã thanh toán, đợi giáo viên xác nhận (vẫn hiển thị lịch)
      // - Có session
      const [rows] = await db.query(
        `SELECT 
          s.SessionID,
          s.Title as SessionTitle,
          s.Description,
          s.ClassID,
          s.ZoomUUID,
          cl.Name as ClassName,
           cl.ZoomID,
        cl.Zoompass,
          cl.Status as ClassStatus,
          s.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          s.Date,
          ts.StartTime,
          ts.EndTime,
          ts.Day
         FROM enrollment e
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         INNER JOIN session s ON cl.ClassID = s.ClassID
         LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE e.LearnerID = ? 
           AND e.Status = 'Enrolled' 
           AND cl.Status IN ('active', 'ongoing')
           AND s.SessionID IS NOT NULL
         ORDER BY s.Date DESC, ts.StartTime DESC`,
        [learnerId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getLearnerSchedule:", error);
      throw error;
    }
  }

  async getInstructorSchedule(instructorId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          s.SessionID,
          s.Title as SessionTitle,
          s.Description,
          s.InstructorID,
          s.ClassID,
          cl.Name as ClassName,
          cl.ZoomID,
        cl.Zoompass,
          c.CourseID,
          c.Title as CourseTitle,
          s.Date,
          ts.StartTime,
          ts.EndTime,
          ts.Day,
          COUNT(DISTINCT e.LearnerID) as EnrolledCount
         FROM session s
         INNER JOIN instructor i ON s.InstructorID = i.InstructorID
         LEFT JOIN class cl ON s.ClassID = cl.ClassID
         LEFT JOIN course c ON cl.CourseID = c.CourseID
         LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE s.InstructorID = ?
           AND (
             -- Class có enrollment với status = 'Enrolled' (đã thanh toán)
             (e.Status = 'Enrolled')
             OR
             -- Class không có enrollment nào (class thông thường, không phải 1-on-1)
             (e.EnrollmentID IS NULL AND NOT EXISTS (
               SELECT 1 FROM enrollment e2 WHERE e2.ClassID = cl.ClassID
             ))
           )
         GROUP BY s.SessionID, s.Title, s.Description, s.InstructorID, s.ClassID, cl.Name, cl.ZoomID,
        cl.Zoompass, c.CourseID, c.Title, s.Date, ts.StartTime, ts.EndTime, ts.Day
         ORDER BY s.Date DESC, ts.StartTime DESC`,
        [instructorId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getInstructorSchedule:", error);
      throw error;
    }
  }

  async getSessionDetails(sessionId) {
    try {
      const db = await connectDB();
      const [sessionRows] = await db.query(
        `SELECT 
          s.SessionID,
          s.Title as SessionTitle,
          s.Description,
          s.InstructorID,
          s.ZoomUUID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar
         FROM session s
         INNER JOIN instructor i ON s.InstructorID = i.InstructorID
         WHERE s.SessionID = ?`,
        [sessionId]
      );

      if (!sessionRows.length) {
        return null;
      }

      const session = sessionRows[0];

      const [timeslotRows] = await db.query(
        `SELECT 
          s.TimeslotID,
          s.Date,
          ts.StartTime,
          ts.EndTime,
          ts.Day
         FROM session s
         INNER JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE s.SessionID = ?`,
        [sessionId]
      );

      const [learnerRows] = await db.query(
        `SELECT 
          l.LearnerID,
          l.FullName as LearnerName,
          l.ProfilePicture as LearnerAvatar,
          e.EnrollmentID,
          e.Status as EnrollmentStatus
         FROM enrollment e
         INNER JOIN learner l ON e.LearnerID = l.LearnerID
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         WHERE cl.ClassID = ? AND e.Status = 'Enrolled'`,
        [session.ClassID]
      );

      return {
        ...session,
        Timeslot: timeslotRows[0] || null,
        EnrolledLearners: learnerRows,
      };
    } catch (error) {
      console.error("Database error in getSessionDetails:", error);
      throw error;
    }
  }

  async getClassesByInstructor(instructorId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          cl.ClassID,
          cl.Name as ClassName,
          cl.Status,
          cl.ZoomID,
        cl.Zoompass,
          cl.CourseID,
          (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = cl.ClassID AND e.Status = 'Enrolled') as StudentCount
         FROM class cl
         WHERE cl.InstructorID = ? AND cl.Status = 'active'
         ORDER BY cl.ClassID DESC`,
        [instructorId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getClassesByInstructor:", error);
      throw error;
    }
  }

  async getClassSchedule(classId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          s.SessionID,
          s.Title,
          s.Description,
          s.Date,
          s.ZoomUUID,
          ts.StartTime,
          ts.EndTime,
          ts.Day
         FROM session s
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE s.ClassID = ?
         ORDER BY s.Date DESC, ts.StartTime DESC`,
        [classId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getClassSchedule:", error);
      throw error;
    }
  }

  async createSession(sessionData) {
    try {
      const db = await connectDB();
      const { Title, Description, InstructorID, ClassID, TimeslotID, Date } =
        sessionData;

      const [result] = await db.query(
        `INSERT INTO session (Title, Description, InstructorID, ClassID, TimeslotID, Date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [Title, Description, InstructorID, ClassID, TimeslotID, Date]
      );

      return { SessionID: result.insertId };
    } catch (error) {
      console.error("Database error in createSession:", error);
      throw error;
    }
  }

  async createTimeslot(timeslotData) {
    try {
      const db = await connectDB();
      const { StartTime, EndTime, Day } = timeslotData;

      const [result] = await db.query(
        `INSERT INTO timeslot (StartTime, EndTime, Day)
         VALUES (?, ?, ?)`,
        [StartTime, EndTime, Day]
      );

      return { TimeslotID: result.insertId };
    } catch (error) {
      console.error("Database error in createTimeslot:", error);
      throw error;
    }
  }

  async getAvailableInstructorSlots(instructorId) {
    try {
      const db = await connectDB();

      // Lấy tất cả timeslots, kiểm tra availability dựa trên sessions
      // Một timeslot available nếu:
      // - Chưa có session nào, HOẶC
      // - Có session của instructor này (có thể đổi lịch)
      // Sử dụng GROUP BY và MAX/MIN để lấy một SessionID duy nhất khi có nhiều sessions
      const [rows] = await db.query(
        `SELECT 
          ts.TimeslotID,
          ts.Day,
          ts.StartTime,
          ts.EndTime,
          MAX(CASE WHEN s.InstructorID = ? THEN s.SessionID END) as SessionID,
          CASE 
            WHEN COUNT(CASE WHEN s.InstructorID != ? AND s.InstructorID IS NOT NULL THEN 1 END) > 0 
              THEN false
            ELSE true
          END as IsAvailable
         FROM timeslot ts
         LEFT JOIN session s ON ts.TimeslotID = s.TimeslotID
         GROUP BY ts.TimeslotID, ts.Day, ts.StartTime, ts.EndTime
         HAVING IsAvailable = true
         ORDER BY ts.StartTime
         LIMIT 50`,
        [instructorId, instructorId]
      );

      return rows;
    } catch (error) {
      console.error("Database error in getAvailableInstructorSlots:", error);
      throw error;
    }
  }

  // Lấy lịch học của giảng viên theo tuần (từ instructortimeslot và Session)
async getInstructorWeeklySchedule(instructorId, weekStartDate) {
    try {
      const db = await connectDB();

      // Tính ngày bắt đầu và kết thúc của tuần
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // 7 ngày (0-6)

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      console.log('=== WEEK RANGE ===');
      console.log('Start Date:', startDateStr);
      console.log('End Date:', endDateStr);
      console.log('Instructor ID:', instructorId);

      // Lấy tất cả timeslots
      const [allTimeslots] = await db.query(
        `SELECT TimeslotID, Day, StartTime, EndTime FROM timeslot ORDER BY 
         CASE Day
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
         END, StartTime`
      );

      console.log('\n=== ALL TIMESLOTS ===');
      console.log('Total timeslots:', allTimeslots.length);
      console.log('Sample timeslots:', allTimeslots.slice(0, 3));

      // Lấy các slot đã bận từ instructortimeslot trong tuần này
      const [busySlots] = await db.query(
        `SELECT 
          its.InstructortimeslotID,
          its.TimeslotID,
          its.Date,
          its.Status,
          ts.Day,
          ts.StartTime,
          ts.EndTime
         FROM instructortimeslot its
         INNER JOIN timeslot ts ON its.TimeslotID = ts.TimeslotID
         WHERE its.InstructorID = ? 
           AND its.Date >= ? 
           AND its.Date <= ?
           AND its.Status = 'busy'`,
        [instructorId, startDateStr, endDateStr]
      );

      console.log('\n=== BUSY SLOTS ===');
      console.log('Total busy slots:', busySlots.length);
      console.log('Busy slots data:', JSON.stringify(busySlots, null, 2));

      // Lấy các session đang dạy trong tuần này
      const [teachingSessions] = await db.query(
        `SELECT 
          s.TimeslotID,
          s.Date,
          ts.Day,
          ts.StartTime,
          ts.EndTime
         FROM session s
         INNER JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         LEFT JOIN class cl ON s.ClassID = cl.ClassID
         LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
         WHERE s.InstructorID = ?
           AND s.Date >= ?
           AND s.Date <= ?
           AND (
             (e.Status = 'Enrolled')
             OR
             (e.EnrollmentID IS NULL AND NOT EXISTS (
               SELECT 1 FROM enrollment e2 WHERE e2.ClassID = cl.ClassID
             ))
           )`,
        [instructorId, startDateStr, endDateStr]
      );

      console.log('\n=== TEACHING SESSIONS ===');
      console.log('Total teaching sessions:', teachingSessions.length);
      console.log('Teaching sessions data:', JSON.stringify(teachingSessions, null, 2));

      // Tạo map để đánh dấu slot bận
      const busyMap = new Map();
      const teachingMap = new Map();

      // Đánh dấu slot bận từ instructortimeslot
      busySlots.forEach((slot) => {
        let dateStr = slot.Date;
        if (dateStr instanceof Date) {
          // Sử dụng local date thay vì UTC
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === "string") {
          // Nếu là string UTC, convert sang local date
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        const key = `${dateStr}_${slot.TimeslotID}`;
        busyMap.set(key, slot);
        console.log(`[BUSY MAP] Added key: ${key}`);
      });

      console.log('\n=== BUSY MAP ===');
      console.log('Busy map keys:', Array.from(busyMap.keys()));

      // Đánh dấu slot đang dạy từ session
      teachingSessions.forEach((session) => {
        let dateStr = session.Date;
        if (dateStr instanceof Date) {
          // Sử dụng local date thay vì UTC
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === "string") {
          // Nếu là string UTC, convert sang local date
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        const key = `${dateStr}_${session.TimeslotID}`;
        teachingMap.set(key, session);
        console.log(`[TEACHING MAP] Added key: ${key}`);
      });

      console.log('\n=== TEACHING MAP ===');
      console.log('Teaching map keys:', Array.from(teachingMap.keys()));

      // Tạo lịch học theo tuần
      const schedule = [];
      const dayOrder = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 7,
      };

      // Tính ngày cho mỗi thứ trong tuần
      const dayDates = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        dayDates[dayName] = date.toISOString().split("T")[0];
      }

      console.log('\n=== DAY DATES MAPPING ===');
      console.log('Day dates:', dayDates);

      // Lấy tất cả instructortimeslot của giảng viên trong tuần
      const [allInstructorSlots] = await db.query(
      `SELECT InstructortimeslotID, TimeslotID, Date FROM instructortimeslot 
         WHERE InstructorID = ? AND Date >= ? AND Date <= ?`,
        [instructorId, startDateStr, endDateStr]
      );

      console.log('\n=== ALL INSTRUCTOR SLOTS ===');
      console.log('Total instructor slots:', allInstructorSlots.length);
      console.log('Instructor slots data:', JSON.stringify(allInstructorSlots, null, 2));

      const instructorSlotMap = new Map();
      allInstructorSlots.forEach((slot) => {
        let dateStr = slot.Date;
        if (dateStr instanceof Date) {
          // Sử dụng local date thay vì UTC
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === "string") {
          // Nếu là string UTC, convert sang local date
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        const key = `${dateStr}_${slot.TimeslotID}`;
        instructorSlotMap.set(key, true);
        console.log(`[INSTRUCTOR SLOT MAP] Added key: ${key}`);
      });

      console.log('\n=== INSTRUCTOR SLOT MAP ===');
      console.log('Instructor slot map keys:', Array.from(instructorSlotMap.keys()));

      // Tạo map: TimeslotID -> các Date
      const timeslotDateMap = new Map();
      
      allInstructorSlots.forEach((slot) => {
        let dateStr = slot.Date;
        if (dateStr instanceof Date) {
          // Sử dụng local date thay vì UTC
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === "string") {
          // Nếu là string UTC, convert sang local date
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        if (!timeslotDateMap.has(slot.TimeslotID)) {
          timeslotDateMap.set(slot.TimeslotID, new Set());
        }
        timeslotDateMap.get(slot.TimeslotID).add(dateStr);
      });

      busySlots.forEach((slot) => {
        let dateStr = slot.Date;
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === "string") {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        if (!timeslotDateMap.has(slot.TimeslotID)) {
          timeslotDateMap.set(slot.TimeslotID, new Set());
        }
        timeslotDateMap.get(slot.TimeslotID).add(dateStr);
      });

      teachingSessions.forEach((session) => {
        let dateStr = session.Date;
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === "string") {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        if (!timeslotDateMap.has(session.TimeslotID)) {
          timeslotDateMap.set(session.TimeslotID, new Set());
        }
        timeslotDateMap.get(session.TimeslotID).add(dateStr);
      });

      console.log('\n=== TIMESLOT DATE MAP ===');
      timeslotDateMap.forEach((dates, timeslotId) => {
        console.log(`TimeslotID ${timeslotId}:`, Array.from(dates));
      });

      // Tạo schedule
      for (const timeslot of allTimeslots) {
        const datesForThisTimeslot = timeslotDateMap.get(timeslot.TimeslotID);

        if (datesForThisTimeslot && datesForThisTimeslot.size > 0) {
          datesForThisTimeslot.forEach((dateStr) => {
            if (dateStr >= startDateStr && dateStr <= endDateStr) {
              const key = `${dateStr}_${timeslot.TimeslotID}`;
              const isBusy = busyMap.has(key);
              const isTeaching = teachingMap.has(key);
              const hasInstructorSlot = instructorSlotMap.has(key);

              let startTimeStr = timeslot.StartTime;
              let endTimeStr = timeslot.EndTime;

              if (startTimeStr && typeof startTimeStr === "object") {
                const hours = String(
                  startTimeStr.hours || startTimeStr.getHours?.() || 0
                ).padStart(2, "0");
                const minutes = String(
                  startTimeStr.minutes || startTimeStr.getMinutes?.() || 0
                ).padStart(2, "0");
                const seconds = String(
                  startTimeStr.seconds || startTimeStr.getSeconds?.() || 0
                ).padStart(2, "0");
                startTimeStr = `${hours}:${minutes}:${seconds}`;
              }

              if (endTimeStr && typeof endTimeStr === "object") {
                const hours = String(
                  endTimeStr.hours || endTimeStr.getHours?.() || 0
                ).padStart(2, "0");
                const minutes = String(
                  endTimeStr.minutes || endTimeStr.getMinutes?.() || 0
                ).padStart(2, "0");
                const seconds = String(
                  endTimeStr.seconds || endTimeStr.getSeconds?.() || 0
                ).padStart(2, "0");
                endTimeStr = `${hours}:${minutes}:${seconds}`;
              }

              let status = "available";
              if (isTeaching || isBusy) {
                status = "busy";
              } else if (!hasInstructorSlot) {
                status = "empty";
              }

              schedule.push({
                TimeslotID: timeslot.TimeslotID,
                Day: timeslot.Day,
                StartTime: startTimeStr,
                EndTime: endTimeStr,
                Date: dateStr,
                Status: status,
              });
            }
          });
        } else {
          const dayDate = dayDates[timeslot.Day];
          if (!dayDate) {
            continue;
          }

          const key = `${dayDate}_${timeslot.TimeslotID}`;
          const isBusy = busyMap.has(key);
          const isTeaching = teachingMap.has(key);
          const hasInstructorSlot = instructorSlotMap.has(key);

          let startTimeStr = timeslot.StartTime;
          let endTimeStr = timeslot.EndTime;

          if (startTimeStr && typeof startTimeStr === "object") {
            const hours = String(
              startTimeStr.hours || startTimeStr.getHours?.() || 0
            ).padStart(2, "0");
            const minutes = String(
              startTimeStr.minutes || startTimeStr.getMinutes?.() || 0
            ).padStart(2, "0");
            const seconds = String(
              startTimeStr.seconds || startTimeStr.getSeconds?.() || 0
            ).padStart(2, "0");
            startTimeStr = `${hours}:${minutes}:${seconds}`;
          }

          if (endTimeStr && typeof endTimeStr === "object") {
            const hours = String(
              endTimeStr.hours || endTimeStr.getHours?.() || 0
            ).padStart(2, "0");
            const minutes = String(
              endTimeStr.minutes || endTimeStr.getMinutes?.() || 0
            ).padStart(2, "0");
            const seconds = String(
              endTimeStr.seconds || endTimeStr.getSeconds?.() || 0
            ).padStart(2, "0");
            endTimeStr = `${hours}:${minutes}:${seconds}`;
          }

          let status = "available";
          if (isTeaching || isBusy) {
            status = "busy";
          } else if (!hasInstructorSlot) {
            status = "empty";
          }

          schedule.push({
            TimeslotID: timeslot.TimeslotID,
            Day: timeslot.Day,
            StartTime: startTimeStr,
            EndTime: endTimeStr,
            Date: dayDate,
            Status: status,
          });
        }
      }

      console.log('\n=== FINAL SCHEDULE ===');
      console.log('Total schedule entries:', schedule.length);
      console.log('Schedule by status:');
      console.log('- Available:', schedule.filter(s => s.Status === 'available').length);
      console.log('- Busy:', schedule.filter(s => s.Status === 'busy').length);
      console.log('- Empty:', schedule.filter(s => s.Status === 'empty').length);
      console.log('\nFirst 5 schedule entries:', JSON.stringify(schedule.slice(0, 5), null, 2));

      return schedule;
    } catch (error) {
      console.error("Database error in getInstructorWeeklySchedule:", error);
      throw error;
    }
  }

  async createOneOnOneBooking(bookingData) {
    try {
      const db = await connectDB();
      const { LearnerID, InstructorID, Title, Description, CourseID, ClassID } =
        bookingData;

      let classId = ClassID;
      if (!classId) {
        // Tìm lớp đang pending của giảng viên (booking requests)
        const [existingClassRows] = await db.query(
          `SELECT ClassID, Name FROM class WHERE InstructorID = ? AND Status = 'pending' ORDER BY ClassID DESC LIMIT 1`,
          [InstructorID]
        );

        if (existingClassRows.length) {
          classId = existingClassRows[0].ClassID;
        } else {
          // Tạo class mới với status 'pending' - chờ giảng viên xác nhận
          const defaultClassName =
            Title || `Lớp của giảng viên ${InstructorID}`;
          const [classResult] = await db.query(
            `INSERT INTO class (InstructorID, Name, ZoomURL, Status, CourseID)
             VALUES (?, ?, NULL, 'pending', ?)`,
            [InstructorID, defaultClassName, CourseID || null]
          );
          classId = classResult.insertId;
        }
      }

      // Nếu đã Enrolled hoặc Pending thì trả về hiện trạng
      const [existingEnroll] = await db.query(
        `SELECT EnrollmentID, Status FROM enrollment WHERE LearnerID = ? AND ClassID = ? AND Status IN ('Enrolled','Pending') ORDER BY EnrollmentID DESC LIMIT 1`,
        [LearnerID, classId]
      );

      if (existingEnroll.length) {
        return {
          SessionID: null,
          ClassID: classId,
          EnrollmentID: existingEnroll[0].EnrollmentID,
          TimeslotID: null,
        };
      }

      const [enrollmentResult] = await db.query(
        `INSERT INTO enrollment (LearnerID, ClassID, EnrollmentDate, Status)
         VALUES (?, ?, NOW(), 'Pending')`,
        [LearnerID, classId]
      );

      return {
        SessionID: null,
        ClassID: classId,
        EnrollmentID: enrollmentResult.insertId,
        TimeslotID: null,
      };
    } catch (error) {
      console.error("Database error in createOneOnOneBooking:", error);
      throw error;
    }
  }

  // booking-requests removed

  // Lấy chi tiết tất cả sessions của một enrollment
  async getEnrollmentSessions(enrollmentId) {
    try {
      const db = await connectDB();

      const [rows] = await db.query(
        `SELECT 
          s.SessionID,
          s.Title as SessionTitle,
          s.Description as SessionDescription,
          s.Date as SessionDate,
           s.ZoomUUID as SessionZoomUUID,
          ts.TimeslotID,
          ts.Day,
          ts.StartTime,
          ts.EndTime,
          cl.ClassID,
          cl.Name as ClassName
         FROM enrollment e
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         INNER JOIN session s ON cl.ClassID = s.ClassID
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE e.EnrollmentID = ?
         ORDER BY s.Date ASC, ts.StartTime ASC`,
        [enrollmentId]
      );

      return rows;
    } catch (error) {
      console.error("Database error in getEnrollmentSessions:", error);
      throw error;
    }
  }

  async updateSessionAction(actionData) {
    try {
      const db = await connectDB();
      const {
        SessionID,
        ClassID,
        action,
        newTimeslotID,
        newDate,
        reason,
        initiator,
      } = actionData;

      let classId = null;

      // Nếu có SessionID, lấy ClassID từ session
      if (SessionID) {
        const [sessionRows] = await db.query(
          `SELECT s.SessionID, s.ClassID, cl.InstructorID FROM session s 
           INNER JOIN class cl ON s.ClassID = cl.ClassID 
           WHERE s.SessionID = ?`,
          [SessionID]
        );

        if (!sessionRows.length) {
          throw new Error("Session not found");
        }

        const session = sessionRows[0];
        classId = session.ClassID;
      }
      // Nếu không có SessionID nhưng có ClassID, dùng trực tiếp ClassID (cho booking requests chưa có session)
      else if (ClassID) {
        // Kiểm tra class có tồn tại và có status pending không
        const [classRows] = await db.query(
          `SELECT ClassID, Status FROM class WHERE ClassID = ? AND Status = 'pending'`,
          [ClassID]
        );

        if (!classRows.length) {
          throw new Error("Class not found or not pending");
        }

        classId = ClassID;
      } else {
        throw new Error("SessionID or ClassID is required");
      }

      if (action === "confirm") {
        // Xác nhận:
        // 1. Giữ enrollment status = 'Pending' (chưa thanh toán)
        // 2. Update class status = 'active'
        // 3. Lấy thông tin enrollment để tạo notification và payment link

        // Lấy thông tin enrollment (LearnerID, OrderCode, ClassFee, AccID của learner)
        const [enrollmentRows] = await db.query(
          `SELECT e.EnrollmentID, e.LearnerID, e.OrderCode, cl.Fee as ClassFee, l.AccID
           FROM enrollment e
           INNER JOIN class cl ON e.ClassID = cl.ClassID
           INNER JOIN learner l ON e.LearnerID = l.LearnerID
           WHERE e.ClassID = ? AND e.Status = 'Pending'`,
          [classId]
        );

        if (!enrollmentRows.length) {
          throw new Error("Enrollment not found");
        }

        const enrollment = enrollmentRows[0];

        // Update class status
        await db.query(
          `UPDATE class SET Status = 'ongoing' 
           WHERE ClassID = ? AND Status = 'pending'`,
          [classId]
        );

        // Trả về thông tin để controller tạo notification và payment link
        return {
          success: true,
          message: "Đã xác nhận đơn đặt lịch",
          enrollment: {
            EnrollmentID: enrollment.EnrollmentID,
            LearnerID: enrollment.LearnerID,
            OrderCode: enrollment.OrderCode,
            ClassFee: enrollment.ClassFee,
            LearnerAccID: enrollment.AccID,
          },
        };
      } else if (action === "cancel") {
        // Hủy: đổi enrollment status và class status
        await db.query(
          `UPDATE enrollment SET Status = 'Cancelled' 
           WHERE ClassID = ? AND Status = 'Pending'`,
          [classId]
        );
        await db.query(
          `UPDATE class SET Status = 'cancelled' 
           WHERE ClassID = ?`,
          [classId]
        );
        return { success: true, message: "Đã hủy đơn đặt lịch" };
      } else if (action === "reschedule") {
        // Đổi lịch: update session với timeslot/date mới và lưu reason vào Description
        if (!newTimeslotID || !newDate) {
          throw new Error("Thiếu thông tin timeslot hoặc ngày mới");
        }

        let oldInfo = {};
        let hasOriginalBooking = false;

        // Nếu có SessionID, lấy thông tin session cũ và check xem có original booking không
        if (SessionID) {
          const [oldSessionRows] = await db.query(
            `SELECT s.TimeslotID as OldTimeslotID, s.Date as OldDate, s.Description, ts.StartTime as OldStartTime, ts.EndTime as OldEndTime
             FROM session s
             LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
             WHERE s.SessionID = ?`,
            [SessionID]
          );
          oldInfo = oldSessionRows[0] || {};

          // Check xem có tag [ORIGINAL_BOOKING] không
          if (
            oldInfo.Description &&
            oldInfo.Description.includes("[ORIGINAL_BOOKING:")
          ) {
            hasOriginalBooking = true;
          }
        } else if (classId) {
          // Nếu chưa có session, check xem session nào của class này có original booking không
          // Lấy session mới nhất để check thông tin lịch cũ
          const [sessions] = await db.query(
            `SELECT s.SessionID, s.TimeslotID, s.Date, s.Description 
             FROM session s 
             WHERE s.ClassID = ? 
             ORDER BY s.SessionID DESC LIMIT 1`,
            [classId]
          );
          if (sessions.length > 0) {
            const session = sessions[0];
            oldInfo = {
              OldTimeslotID: session.TimeslotID,
              OldDate: session.Date,
            };
            if (
              session.Description &&
              session.Description.includes("[ORIGINAL_BOOKING:")
            ) {
              hasOriginalBooking = true;
            }
          } else {
            // Nếu chưa có session nào, không có thông tin lịch cũ để so sánh
            // Nhưng vẫn cần check original booking từ class description hoặc enrollment
            // Tạm thời để oldInfo rỗng, validation trùng lịch sẽ không chạy
            oldInfo = {};
          }
        }

        // Nếu có original booking (học viên đã chọn ngày và timeslot khi đăng ký), không cho đổi lịch
        if (hasOriginalBooking) {
          throw new Error(
            "Không thể đổi lịch vì học viên đã chọn ngày và timeslot khi đăng ký. Vui lòng liên hệ học viên để đổi lịch."
          );
        }

        // Kiểm tra xem lịch mới có trùng với lịch cũ không
        // Chỉ check nếu có đầy đủ thông tin lịch cũ
        if (oldInfo.OldDate && oldInfo.OldTimeslotID) {
          // Format date để so sánh (chỉ so sánh phần ngày YYYY-MM-DD)
          let oldDateStr = "";
          if (oldInfo.OldDate instanceof Date) {
            oldDateStr = oldInfo.OldDate.toISOString().split("T")[0];
          } else if (typeof oldInfo.OldDate === "string") {
            // Nếu là string, lấy phần đầu (YYYY-MM-DD)
            // Có thể là "2025-11-03" hoặc "2025-11-03 00:00:00" hoặc Date string
            oldDateStr = oldInfo.OldDate.split(" ")[0].split("T")[0];
          }

          // Format newDate tương tự - đảm bảo format YYYY-MM-DD
          let newDateStr = newDate;
          if (newDate.includes(" ")) {
            newDateStr = newDate.split(" ")[0];
          }
          if (newDateStr.includes("T")) {
            newDateStr = newDateStr.split("T")[0];
          }

          // Normalize cả hai để so sánh chính xác
          const normalizedOldDate = oldDateStr.trim();
          const normalizedNewDate = newDateStr.trim();

          // Convert timeslot IDs sang số để so sánh chính xác
          const oldTimeslotIDNum =
            typeof oldInfo.OldTimeslotID === "number"
              ? oldInfo.OldTimeslotID
              : parseInt(oldInfo.OldTimeslotID);
          const newTimeslotIDNum =
            typeof newTimeslotID === "number"
              ? newTimeslotID
              : parseInt(newTimeslotID);

          // So sánh date và timeslot - nếu trùng hoàn toàn thì không cho đổi
          if (
            normalizedOldDate &&
            normalizedNewDate &&
            normalizedOldDate === normalizedNewDate &&
            oldTimeslotIDNum &&
            newTimeslotIDNum &&
            oldTimeslotIDNum === newTimeslotIDNum
          ) {
            throw new Error(
              "Lịch mới không được trùng với lịch hiện tại. Vui lòng chọn ngày hoặc timeslot khác."
            );
          }
        }

        // Lấy thông tin timeslot mới
        const [newTimeslotRows] = await db.query(
          `SELECT StartTime, EndTime FROM timeslot WHERE TimeslotID = ?`,
          [newTimeslotID]
        );
        const newTimeslot = newTimeslotRows[0] || {};

        // Lưu thông tin cũ và mới vào Description
        const oldInfoText =
          oldInfo.OldDate && oldInfo.OldStartTime
            ? `[Lịch cũ: ${oldInfo.OldDate} ${oldInfo.OldStartTime}-${oldInfo.OldEndTime}]`
            : `[Lịch cũ: Chưa có lịch học trước đó]`;
        const newInfoText = `[Đề xuất lịch mới: ${newDate} ${newTimeslot.StartTime}-${newTimeslot.EndTime}]`;
        const reasonText = reason ? `Lý do: ${reason}` : "";
        const initiatorTag =
          initiator === "instructor"
            ? "[RESCHEDULE_BY:instructor]"
            : "[RESCHEDULE_BY:learner]";
        const rescheduleNote = `[PENDING_RESCHEDULE] ${initiatorTag} ${oldInfoText} ${newInfoText} ${reasonText}`;

        // Nếu có session, update session
        if (SessionID) {
          await db.query(
            `UPDATE session 
             SET TimeslotID = ?, Date = ?, 
                 Description = CONCAT(COALESCE(Description, ''), ' ', ?) 
             WHERE SessionID = ?`,
            [newTimeslotID, newDate, rescheduleNote, SessionID]
          );
        } else {
          // Nếu chưa có session, tạo session mới với thông tin reschedule
          // Lấy InstructorID từ class
          const [classRows] = await db.query(
            `SELECT InstructorID FROM class WHERE ClassID = ?`,
            [classId]
          );
          const instructorId = classRows[0]?.InstructorID;

          if (!instructorId) {
            throw new Error("Không tìm thấy InstructorID");
          }

          await db.query(
            `INSERT INTO session (ClassID, InstructorID, TimeslotID, Date, Title, Description)
             VALUES (?, ?, ?, ?, 'Lịch học mới', ?)`,
            [classId, instructorId, newTimeslotID, newDate, rescheduleNote]
          );
        }

        // Nếu giảng viên khởi tạo đổi lịch, set class về trạng thái reschedule_pending để FE/BE có thể kiểm tra nhanh
        if (initiator === "instructor") {
          await db.query(
            `UPDATE class SET Status = 'reschedule_pending' WHERE ClassID = ?`,
            [classId]
          );
        }

        return {
          success: true,
          message: "Đã đề xuất đổi lịch, đang chờ học viên xác nhận",
          requiresLearnerApproval: true,
          oldSchedule: {
            date: oldInfo.OldDate,
            timeslotId: oldInfo.OldTimeslotID,
            timeRange: `${oldInfo.OldStartTime || ""}-${
              oldInfo.OldEndTime || ""
            }`,
          },
          newSchedule: {
            date: newDate,
            timeslotId: newTimeslotID,
            timeRange: `${newTimeslot.StartTime || ""}-${
              newTimeslot.EndTime || ""
            }`,
          },
        };
      }

      throw new Error("Invalid action");
    } catch (error) {
      console.error("Database error in updateSessionAction:", error);
      throw error;
    }
  }

  async updateRescheduleResponse(responseData) {
    try {
      const db = await connectDB();
      const { SessionID, response } = responseData; // response: 'accept' hoặc 'reject'

      // Lấy thông tin session
      const [sessionRows] = await db.query(
        `SELECT s.SessionID, s.ClassID, s.Description FROM session s WHERE s.SessionID = ?`,
        [SessionID]
      );

      if (!sessionRows.length) {
        throw new Error("Session not found");
      }

      const session = sessionRows[0];
      const classId = session.ClassID;

      if (response === "accept") {
        // Học viên chấp nhận: xóa tag PENDING_RESCHEDULE trong Description
        const cleanedDescription = session.Description
          ? session.Description.replace(
              /\[PENDING_RESCHEDULE\][^\[]*/g,
              ""
            ).trim()
          : session.Description;

        await db.query(
          `UPDATE session SET Description = ? WHERE SessionID = ?`,
          [cleanedDescription, SessionID]
        );

        // Nếu class đang reschedule_pending, đưa về pending để quay lại danh sách đơn
        await db.query(
          `UPDATE class SET Status = 'pending' WHERE ClassID = ? AND Status = 'reschedule_pending'`,
          [classId]
        );

        return {
          success: true,
          message: "Đã chấp nhận đề xuất đổi lịch",
        };
      } else if (response === "reject") {
        // Học viên từ chối: hủy enrollment và class
        await db.query(
          `UPDATE enrollment SET Status = 'Cancelled' 
           WHERE ClassID = ?`,
          [classId]
        );
        await db.query(
          `UPDATE class SET Status = 'cancelled' 
           WHERE ClassID = ?`,
          [classId]
        );
        return {
          success: true,
          message: "Đã từ chối đề xuất đổi lịch, đơn đặt lịch đã bị hủy",
        };
      }

      throw new Error("Invalid response");
    } catch (error) {
      console.error("Database error in updateRescheduleResponse:", error);
      throw error;
    }
  }

  async getPendingRescheduleRequestsByAccountId(accountId) {
    try {
      const db = await connectDB();

      // Lấy LearnerID từ AccountID
      const [learnerRows] = await db.query(
        "SELECT LearnerID FROM learner WHERE AccID = ?",
        [accountId]
      );

      if (!learnerRows.length || !learnerRows[0].LearnerID) {
        return null; // Không có hồ sơ học viên
      }

      const learnerId = learnerRows[0].LearnerID;

      // Lấy pending reschedule requests:
      // - Có session với description chứa [PENDING_RESCHEDULE]
      // - Enrollment thuộc về learner này
      // - Enrollment status có thể là 'Pending' hoặc 'Enrolled' (có thể đã confirm rồi mới reschedule)
      const [rows] = await db.query(
        `SELECT 
          s.SessionID,
          s.Title as SessionTitle,
          s.Description,
          s.Date as SessionDate,
          s.ClassID,
          cl.Name as ClassName,
          cl.Status as ClassStatus,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          ts.TimeslotID,
          ts.StartTime,
          ts.EndTime,
          ts.Day,
          e.EnrollmentID,
          e.Status as EnrollmentStatus
         FROM session s
         INNER JOIN class cl ON s.ClassID = cl.ClassID
         INNER JOIN enrollment e ON cl.ClassID = e.ClassID
         INNER JOIN learner l ON e.LearnerID = l.LearnerID
         INNER JOIN instructor i ON s.InstructorID = i.InstructorID
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE l.LearnerID = ? 
           AND e.Status IN ('Pending', 'Enrolled')
           AND cl.Status = 'reschedule_pending'
         ORDER BY s.Date DESC`,
        [learnerId]
      );

      return rows;
    } catch (error) {
      console.error(
        "Database error in getPendingRescheduleRequestsByAccountId:",
        error
      );
      throw error;
    }
  }
}

module.exports = new ScheduleRepository();
