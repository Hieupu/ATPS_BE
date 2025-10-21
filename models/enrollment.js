const pool = require("../config/db");

const Enrollment = {
  // Tạo enrollment mới
  create: async (enrollmentData) => {
    const { LearnerID, ClassID, Status = "Paid" } = enrollmentData;

    // Kiểm tra xem đã enroll chưa
    const [existing] = await pool.execute(
      `SELECT EnrollmentID FROM enrollment WHERE LearnerID = ? AND ClassID = ? AND Status = 'Paid'`,
      [LearnerID, ClassID]
    );

    if (existing.length > 0) {
      throw new Error("Học viên đã đăng ký lớp học này");
    }

    const query = `
      INSERT INTO enrollment (EnrollmentDate, Status, LearnerID, ClassID)
      VALUES (CURDATE(), ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [Status, LearnerID, ClassID]);
    return { EnrollmentID: result.insertId, ...enrollmentData };
  },

  // Lấy enrollment theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status,
        e.LearnerID,
        l.FullName as learnerName,
        a.Email as learnerEmail
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE e.EnrollmentID = ?
    `;

    const [enrollments] = await pool.execute(query, [id]);
    return enrollments.length > 0 ? enrollments[0] : null;
  },

  // Lấy enrollments theo ClassID
  findByClassId: async (classId) => {
    const query = `
      SELECT 
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status,
        e.LearnerID,
        e.ClassID,
        l.FullName as learnerName,
        a.Email as learnerEmail,
        c.Title as courseTitle,
        cl.ZoomURL
      FROM enrollment e
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      LEFT JOIN account a ON l.AccID = a.AccID
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE e.ClassID = ? AND e.Status = 'Paid'
      ORDER BY e.EnrollmentDate DESC
    `;

    const [enrollments] = await pool.execute(query, [classId]);
    return enrollments;
  },

  // Lấy enrollments theo LearnerID
  findByLearnerId: async (learnerId) => {
    const query = `
      SELECT 
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status,
        e.LearnerID,
        e.ClassID,
        c.CourseID,
        c.Title as courseTitle,
        c.Description as courseDescription,
        c.TuitionFee,
        i.FullName as instructorName,
        cl.ZoomURL
      FROM enrollment e
      LEFT JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE e.LearnerID = ? AND e.Status = 'Paid'
      ORDER BY e.EnrollmentDate DESC
    `;

    const [enrollments] = await pool.execute(query, [learnerId]);
    return enrollments;
  },

  // Lấy enrollment theo LearnerID và ClassID
  findByLearnerAndClass: async (learnerId, classId) => {
    const query = `
      SELECT 
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status,
        e.LearnerID,
        e.ClassID
      FROM enrollment e
      WHERE e.LearnerID = ? AND e.ClassID = ?
    `;

    const [enrollments] = await pool.execute(query, [learnerId, classId]);
    return enrollments.length > 0 ? enrollments[0] : null;
  },

  // Cập nhật enrollment
  update: async (id, enrollmentData) => {
    const { Status } = enrollmentData;

    const query = `
      UPDATE enrollment 
      SET Status = ?
      WHERE EnrollmentID = ?
    `;

    const [result] = await pool.execute(query, [Status, id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { EnrollmentID: id, ...enrollmentData };
  },

  // Xóa enrollment
  delete: async (id) => {
    const query = `DELETE FROM enrollment WHERE EnrollmentID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra enrollment có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT EnrollmentID FROM enrollment WHERE EnrollmentID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Hủy đăng ký lớp học
  cancelEnrollment: async (learnerId, classId) => {
    const query = `
      UPDATE enrollment 
      SET Status = 'Cancelled'
      WHERE LearnerID = ? AND ClassID = ? AND Status = 'Paid'
    `;

    const [result] = await pool.execute(query, [learnerId, classId]);
    return result.affectedRows > 0;
  },
};

module.exports = Enrollment;
