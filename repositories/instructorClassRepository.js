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
        c.InstructorID,
        c.CourseID,

        -- 1. FIX: Chỉ đếm session thuộc về Instructor của lớp này
        CASE 
            WHEN (SELECT COUNT(*) FROM session s WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID) > 0 
            THEN (SELECT COUNT(DISTINCT s.Date, s.TimeslotID) FROM session s WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID)
            ELSE c.Numofsession 
        END AS Numofsession,

        -- 2. FIX: Chỉ đếm session đã hoàn thành của Instructor này
        (SELECT COUNT(DISTINCT s.Date, s.TimeslotID) 
         FROM session s 
         WHERE s.ClassID = c.ClassID 
           AND s.InstructorID = c.InstructorID -- Thêm dòng này
           AND s.Date <= CURDATE()) AS completedSessions,

        -- 3. FIX: Tính progress chuẩn theo Instructor này
        (
           SELECT 
             CASE WHEN COUNT(DISTINCT Date, TimeslotID) > 0 
             THEN ROUND(
                (COUNT(DISTINCT CASE WHEN Date <= CURDATE() THEN CONCAT(Date, TimeslotID) END) * 100.0) 
                / COUNT(DISTINCT Date, TimeslotID), 
             1)
             ELSE 0 END
           FROM session 
           WHERE ClassID = c.ClassID AND InstructorID = c.InstructorID -- Thêm dòng này
        ) AS progress,

        co.Title      AS CourseTitle,
        co.Image      AS CourseImage,
        co.Level      AS CourseLevel,
        i.FullName    AS InstructorName,
        i.ProfilePicture,
        (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = c.ClassID AND e.Status = 'Enrolled') AS currentStudents,

        (
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
          FROM timeslot ts 
          JOIN session ss ON ts.TimeslotID = ss.TimeslotID
          WHERE ss.ClassID = c.ClassID AND ss.InstructorID = c.InstructorID -- Thêm dòng này
        ) AS ScheduleSummary,

        EXISTS(SELECT 1 FROM session WHERE ClassID = c.ClassID AND InstructorID = c.InstructorID AND Date = CURDATE()) AS HasSessionToday,
        (SELECT MIN(Date) FROM session WHERE ClassID = c.ClassID AND InstructorID = c.InstructorID AND Date >= CURDATE()) AS NextSessionDate

      FROM class c
      LEFT JOIN course co      ON c.CourseID = co.CourseID
      LEFT JOIN instructor i   ON c.InstructorID = i.InstructorID
      WHERE c.ClassID = ?`,
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
        c.Status AS ClassStatus,
        c.Fee,
        c.Maxstudent AS MaxStudents,
        c.OpendatePlan,
        c.Opendate,
        c.EnddatePlan,
        c.Enddate,
        c.Numofsession AS PlanSessions,

        -- 1. FIX TotalSessions: Logic Fallback + Distinct + Check Instructor
        CASE 
            WHEN (SELECT COUNT(*) FROM session s WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID) > 0 
            THEN (SELECT COUNT(DISTINCT s.Date, s.TimeslotID) FROM session s WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID)
            ELSE c.Numofsession 
        END AS TotalSessions,

        -- 2. FIX FinishedSessions: Chỉ đếm session của Instructor này
        (SELECT COUNT(DISTINCT s.Date, s.TimeslotID) 
         FROM session s 
         WHERE s.ClassID = c.ClassID 
           AND s.InstructorID = c.InstructorID 
           AND s.Date <= CURDATE()) AS FinishedSessions,

        -- 3. Course Info
        co.CourseID,
        COALESCE(co.Title, 'Lớp học tự do') AS CourseTitle,
        COALESCE(co.Image, '/images/default-course.jpg') AS CourseImage,
        co.Level AS CourseLevel,

        -- 4. Current Students
        (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = c.ClassID AND e.Status = 'Enrolled') AS CurrentStudents,

        -- 5. HasSessionToday
        EXISTS(SELECT 1 FROM session s WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID AND s.Date = CURDATE()) AS HasSessionToday,

        -- 6. NextSessionDate
        (SELECT MIN(Date) FROM session s WHERE s.ClassID = c.ClassID AND s.InstructorID = c.InstructorID AND s.Date >= CURDATE()) AS NextSessionDate,

        -- 7. ScheduleSummary: Chỉ lấy lịch của Instructor này
        (
            SELECT GROUP_CONCAT(
                CONCAT(days, ': ', time_range) 
                SEPARATOR ' | '
            )
            FROM (
                SELECT 
                    GROUP_CONCAT(
                        CASE ts.Day 
                            WHEN 'Monday' THEN 'T2' 
                            WHEN 'Tuesday' THEN 'T3' 
                            WHEN 'Wednesday' THEN 'T4' 
                            WHEN 'Thursday' THEN 'T5' 
                            WHEN 'Friday' THEN 'T6' 
                            WHEN 'Saturday' THEN 'T7' 
                            WHEN 'Sunday' THEN 'CN' 
                            ELSE LEFT(ts.Day, 3) 
                        END 
                        ORDER BY FIELD(ts.Day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
                        SEPARATOR ','
                    ) AS days,
                    CONCAT(TIME_FORMAT(ts.StartTime, '%H:%i'), '-', TIME_FORMAT(ts.EndTime, '%H:%i')) AS time_range
                FROM session s2
                JOIN timeslot ts ON s2.TimeslotID = ts.TimeslotID
                WHERE s2.ClassID = c.ClassID AND s2.InstructorID = c.InstructorID -- Check thêm ID ở đây
                GROUP BY ts.StartTime, ts.EndTime
                ORDER BY ts.StartTime
            ) AS grouped_schedule
        ) AS ScheduleSummary

      FROM class c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      WHERE c.InstructorID = ? AND c.Status != 'DELETED'
      -- Không cần GROUP BY ở cuối nữa vì đã xử lý hết trong Subquery
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
      endDatePlan: row.EnddatePlan,
      endDate: row.Enddate,
      planSessions: row.PlanSessions,
      totalSessions: row.TotalSessions,
      finishedSessions: row.FinishedSessions,
      progressPercent:
        row.TotalSessions > 0
          ? Math.round((row.FinishedSessions / row.TotalSessions) * 100)
          : 0,
      courseId: row.CourseID,
      courseTitle: row.CourseTitle,
      courseImage: row.CourseImage,
      courseLevel: row.CourseLevel,
      hasSessionToday: !!row.HasSessionToday,
      nextSessionDate: row.NextSessionDate,
      scheduleSummary: row.ScheduleSummary || "Chưa có lịch cố định",
    }));
  }
}

module.exports = new InstructorClassRepository();
