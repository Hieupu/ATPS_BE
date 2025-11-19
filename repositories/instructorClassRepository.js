const connectDB = require("../config/db");
const Class = require("../models/class");

class InstructorClassRepository {
  async findById(classId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT 
          c.ClassID,
          c.ZoomID,
          c.Zoompass,
          c.Status,
          c.CourseID,
          c.InstructorID,
          c.Name,
          c.Fee,
          c.Maxstudent,
          c.OpendatePlan,
          c.Opendate,
          c.EnddatePlan,
          c.Enddate,
          c.Numofsession,
          co.Title AS CourseTitle,
          i.FullName AS InstructorName
       FROM atps.class c
       LEFT JOIN atps.course co 
         ON c.CourseID = co.CourseID
       LEFT JOIN atps.instructor i
         ON c.InstructorID = i.InstructorID
       WHERE c.ClassID = ?`,
      [classId]
    );

    if (!rows.length) return null;

    return new Class(rows[0]);
  }

  async listByInstructor(instructorId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT 
  c.ClassID,
  c.ZoomID,
  c.Zoompass,
  c.Status,
  c.CourseID,
  c.InstructorID,
  c.Name,
  c.Fee,
  c.Maxstudent,
  c.OpendatePlan,
  c.Opendate,
  c.EnddatePlan,
  c.Enddate,
  c.Numofsession,
  co.Title AS CourseTitle,
  i.FullName AS InstructorName,
  COUNT(e.EnrollmentID) AS StudentCount
FROM atps.class c
LEFT JOIN atps.course co ON c.CourseID = co.CourseID
LEFT JOIN atps.instructor i ON c.InstructorID = i.InstructorID
LEFT JOIN atps.enrollment e 
  ON e.ClassID = c.ClassID 
  AND e.Status = 'ACTIVE'
WHERE c.InstructorID = ?
GROUP BY c.ClassID;
`,
      [instructorId]
    );

    return rows.map((row) => new Class(row));
  }
}

module.exports = new InstructorClassRepository();
