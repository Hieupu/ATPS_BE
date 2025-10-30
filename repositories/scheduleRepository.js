const connectDB = require("../config/db");

class ScheduleRepository {
  async getLearnerSchedule(learnerId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          s.SessionID,
          s.Title as SessionTitle,
          s.Description,
          s.ClassID,
          cl.Name as ClassName,
          cl.ZoomURL,
          s.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          s.Date,
          ts.StartTime,
          ts.EndTime,
          ts.Day
         FROM enrollment e
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         LEFT JOIN session s ON cl.ClassID = s.ClassID
         LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE e.LearnerID = ? AND e.Status = 'Enrolled' AND s.SessionID IS NOT NULL
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
          cl.ZoomURL,
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
         LEFT JOIN enrollment e ON cl.ClassID = e.ClassID AND e.Status = 'Enrolled'
         LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
         WHERE s.InstructorID = ?
         GROUP BY s.SessionID, s.Title, s.Description, s.InstructorID, s.ClassID, cl.Name, cl.ZoomURL, c.CourseID, c.Title, s.Date, ts.StartTime, ts.EndTime, ts.Day
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
          cl.ZoomURL,
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

      const [rows] = await db.query(
        `SELECT 
          ts.TimeslotID,
          ts.Day,
          ts.StartTime,
          ts.EndTime,
          s.SessionID,
          true as IsAvailable
         FROM timeslot ts
         LEFT JOIN session s ON ts.TimeslotID = s.TimeslotID
         WHERE (s.InstructorID = ? OR s.InstructorID IS NULL)
         ORDER BY ts.StartTime
         LIMIT 50`,
        [instructorId]
      );

      return rows;
    } catch (error) {
      console.error("Database error in getAvailableInstructorSlots:", error);
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
        // Tìm lớp đang active của giảng viên
        const [existingClassRows] = await db.query(
          `SELECT ClassID, Name FROM class WHERE InstructorID = ? AND Status = 'active' ORDER BY ClassID DESC LIMIT 1`,
          [InstructorID]
        );

        if (existingClassRows.length) {
          classId = existingClassRows[0].ClassID;
        } else {
          const defaultClassName =
            Title || `Lớp của giảng viên ${InstructorID}`;
          const [classResult] = await db.query(
            `INSERT INTO class (InstructorID, Name, ZoomURL, Status, CourseID)
             VALUES (?, ?, NULL, 'active', ?)`,
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
         VALUES (?, ?, NOW(), 'Enrolled')`,
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
}

module.exports = new ScheduleRepository();
