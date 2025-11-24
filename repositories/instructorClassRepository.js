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
       FROM class c
       LEFT JOIN course co 
         ON c.CourseID = co.CourseID
       LEFT JOIN instructor i
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
       c.Name,
       c.Fee,
       c.Maxstudent,
       c.OpendatePlan,
       c.Opendate,
       c.EnddatePlan,
       c.Enddate,
       c.Numofsession,
       c.Status,
       co.Title AS CourseTitle,
       COUNT(e.EnrollmentID) AS StudentCount
     FROM class c
     LEFT JOIN course co ON c.CourseID = co.CourseID
     LEFT JOIN enrollment e 
       ON e.ClassID = c.ClassID 
       AND e.Status = 'Enrolled'        
     WHERE c.InstructorID = ?
       AND c.Status != 'DELETED'       
     GROUP BY c.ClassID
     ORDER BY COALESCE(c.Opendate, c.OpendatePlan) DESC`,
      [instructorId]
    );

    return rows.map((row) => new Class(row));
  }
}

module.exports = new InstructorClassRepository();
