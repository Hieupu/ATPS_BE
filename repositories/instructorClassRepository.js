const connectDB = require("../config/db");
const Class = require("../models/class");

class InstructorClassRepository {
  async findById(classId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT 
      c.ClassID,                  
      c.Name,                       
      c.Status,                  
      c.ZoomID,
      c.Zoompass,
      c.Fee,
      c.Maxstudent,
      c.OpendatePlan,
      c.Opendate,
      c.EnddatePlan,
      c.Enddate,
      c.Numofsession,
      c.InstructorID,             

      co.Title       AS CourseTitle,
      co.Image       AS CourseImage,
      co.Level       AS CourseLevel,

      i.FullName     AS InstructorName,
      i.ProfilePicture,

      COALESCE(COUNT(DISTINCT e.LearnerID), 0)              AS currentStudents,
      COALESCE(SUM(CASE WHEN s.Date <= CURDATE() THEN 1 ELSE 0 END), 0) AS completedSessions,

      CASE WHEN c.Numofsession > 0 
           THEN ROUND(COALESCE(SUM(CASE WHEN s.Date <= CURDATE() THEN 1 ELSE 0 END),0) * 100.0 / c.Numofsession, 1)
           ELSE 0 END AS progress,

      COALESCE((
        SELECT GROUP_CONCAT(
          DISTINCT CONCAT(
            CASE Day WHEN 'Monday' THEN 'T2' WHEN 'Tuesday' THEN 'T3' WHEN 'Wednesday' THEN 'T4'
            WHEN 'Thursday' THEN 'T5' WHEN 'Friday' THEN 'T6' WHEN 'Saturday' THEN 'T7'
            WHEN 'Sunday' THEN 'CN' ELSE Day END,
            ' ', TIME_FORMAT(StartTime, '%H:%i'), '-', TIME_FORMAT(EndTime, '%H:%i')
          )
          ORDER BY FIELD(Day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
          SEPARATOR ' | '
        )
        FROM timeslot ts JOIN session ss ON ts.TimeslotID = ss.TimeslotID
        WHERE ss.ClassID = c.ClassID
      ), 'Chưa có lịch cố định') AS ScheduleSummary,

      EXISTS(SELECT 1 FROM session WHERE ClassID = c.ClassID AND Date = CURDATE()) AS HasSessionToday,

      (SELECT MIN(Date) FROM session WHERE ClassID = c.ClassID AND Date >= CURDATE()) AS NextSessionDate

    FROM class c
    LEFT JOIN course co      ON c.CourseID = co.CourseID
    LEFT JOIN instructor i   ON c.InstructorID = i.InstructorID
    LEFT JOIN enrollment e   ON c.ClassID = e.ClassID AND e.Status = 'Enrolled'
    LEFT JOIN session s      ON c.ClassID = s.ClassID
    WHERE c.ClassID = ?
    GROUP BY c.ClassID`,
      [classId]
    );

    if (!rows.length) return null;

    return rows[0];
  }

  async listByInstructor(instructorId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT 
      c.ClassID,
      c.Name AS ClassName,
      c.InstructorID,
      c.Status AS ClassStatus,
      c.Fee,
      c.Maxstudent AS MaxStudents,
      c.OpendatePlan,
      c.Opendate,
      c.Numofsession AS TotalSessions,

      co.CourseID,
      COALESCE(co.Title, 'Lớp học tự do') AS CourseTitle,
      COALESCE(co.Image, '/images/default-course.jpg') AS CourseImage,
      co.Level AS CourseLevel,

      COUNT(e.EnrollmentID) AS CurrentStudents,

      COALESCE(SUM(CASE WHEN s.Date <= CURDATE() THEN 1 ELSE 0 END), 0) AS CompletedSessions,
      MAX(CASE WHEN s.Date = CURDATE() THEN 1 ELSE 0 END) AS HasSessionToday,
      MIN(CASE WHEN s.Date >= CURDATE() THEN s.Date END) AS NextSessionDate,

      GROUP_CONCAT(
        DISTINCT CONCAT(
          CASE ts.Day
            WHEN 'Monday'    THEN 'T2'
            WHEN 'Tuesday'   THEN 'T3'
            WHEN 'Wednesday' THEN 'T4'
            WHEN 'Thursday'  THEN 'T5'
            WHEN 'Friday'    THEN 'T6'
            WHEN 'Saturday'  THEN 'T7'
            WHEN 'Sunday'    THEN 'CN'
            ELSE LEFT(ts.Day, 3)
          END,
          ' ', TIME_FORMAT(ts.StartTime, '%H:%i'), '-', TIME_FORMAT(ts.EndTime, '%H:%i')
        )
        SEPARATOR ' | '
      ) AS ScheduleSummary

    FROM class c
    LEFT JOIN course co ON c.CourseID = co.CourseID
    LEFT JOIN enrollment e ON e.ClassID = c.ClassID AND e.Status = 'Enrolled'
    LEFT JOIN session s ON s.ClassID = c.ClassID
    LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID

    WHERE c.InstructorID = ?
      AND c.Status != 'DELETED'

    GROUP BY c.ClassID, co.CourseID, co.Title, co.Image, co.Level

    ORDER BY COALESCE(c.Opendate, c.OpendatePlan) DESC, c.ClassID DESC`,
      [instructorId]
    );

    return rows.map((row) => ({
      classId: row.ClassID,
      className: row.ClassName,
      classStatus: row.ClassStatus,
      fee: Number(row.Fee),
      maxStudents: row.MaxStudents,
      currentStudents: row.CurrentStudents || 0,
      openDatePlan: row.OpendatePlan,
      openDate: row.Opendate,
      totalSessions: row.TotalSessions,

      courseId: row.CourseID,
      courseTitle: row.CourseTitle,
      courseImage: row.CourseImage,
      courseLevel: row.CourseLevel,

      completedSessions: row.CompletedSessions,
      hasSessionToday: !!row.HasSessionToday,
      nextSessionDate: row.NextSessionDate,
      scheduleSummary: row.ScheduleSummary || "Chưa có lịch cố định",
    }));
  }
}

module.exports = new InstructorClassRepository();
