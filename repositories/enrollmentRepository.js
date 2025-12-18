const connectDB = require("../config/db");

class EnrollmentRepository {
  async create(enrollmentData) {
    const pool = await connectDB();
    const { LearnerID, ClassID, EnrollmentDate, Status } = enrollmentData;

    const query = `
      INSERT INTO enrollment (LearnerID, ClassID, EnrollmentDate, Status)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      LearnerID,
      ClassID,
      EnrollmentDate,
      Status || "Enrolled",
    ]);

    return { EnrollmentID: result.insertId, ...enrollmentData };
  }

  async findById(id) {
    const pool = await connectDB();
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        cl.Name as className,
        c.Title as courseTitle
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE e.EnrollmentID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findByLearnerId(learnerId) {
    const pool = await connectDB();
    const query = `
      SELECT 
        e.*,
        cl.Name as ClassName,
        cl.ClassID,
        cl.Status as ClassStatus,
        cl.Fee as ClassFee,
        cl.OpendatePlan,
        cl.Opendate,
        cl.Numofsession,
        cl.Maxstudent,
        c.CourseID,
        c.Title as CourseTitle,
        c.Description as CourseDescription,
        c.Duration,
        c.Level as CourseLevel,
        c.Code as CourseCode,
        i.FullName as InstructorName
      FROM enrollment e
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      WHERE e.LearnerID = ?
      ORDER BY e.EnrollmentDate DESC
    `;

    const [rows] = await pool.execute(query, [learnerId]);
    return rows;
  }

  async findByClassId(classId) {
    const pool = await connectDB();
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        a.Email,
        a.Phone,
        cl.Name as ClassName,
        c.Title as courseTitle,
        i.FullName as instructorName,
        p.Amount,
        p.PaymentMethod,
        p.PaymentDate
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN account a ON l.AccID = a.AccID
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN payment p ON e.EnrollmentID = p.EnrollmentID
      WHERE e.ClassID = ?
    `;

    const [rows] = await pool.execute(query, [classId]);
    return rows;
  }

  async findByCourseId(courseId) {
    const pool = await connectDB();
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        a.Email,
        cl.Name as className
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN account a ON l.AccID = a.AccID
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      WHERE cl.CourseID = ?
      ORDER BY e.EnrollmentDate DESC
    `;

    const [rows] = await pool.execute(query, [courseId]);
    return rows;
  }

  async deleteByClassId(classId) {
    const pool = await connectDB();
    const query = `DELETE FROM enrollment WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [classId]);
    return result.affectedRows;
  }

  async findAll() {
    const pool = await connectDB();
    const query = `
      SELECT 
        e.*,
        l.FullName as learnerName,
        cl.Name as className,
        c.Title as courseTitle
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      ORDER BY e.EnrollmentDate DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async update(id, updateData) {
    const pool = await connectDB();
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE enrollment SET ${setClause} WHERE EnrollmentID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const pool = await connectDB();
    const query = `DELETE FROM enrollment WHERE EnrollmentID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const pool = await connectDB();
    const query = `SELECT 1 FROM enrollment WHERE EnrollmentID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async checkEnrollmentExists(learnerId, classId) {
    const pool = await connectDB();
    const query = `SELECT 1 FROM enrollment WHERE LearnerID = ? AND ClassID = ?`;
    const [rows] = await pool.execute(query, [learnerId, classId]);
    return rows.length > 0;
  }

  async findOneByLearnerAndClass(learnerId, classId) {
    const pool = await connectDB();
    const query = `
      SELECT 
        e.*
      FROM enrollment e
      WHERE e.LearnerID = ? AND e.ClassID = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [learnerId, classId]);
    return rows[0] || null;
  }
}

module.exports = new EnrollmentRepository();
