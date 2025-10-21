const pool = require("../config/db");

const Course = {
  // Tạo khóa học mới
  create: async (courseData) => {
    const { Title, Description, Duration, TuitionFee, Status, InstructorID } =
      courseData;

    const query = `
      INSERT INTO course (Title, Description, Duration, TuitionFee, Status, InstructorID)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Title,
      Description,
      Duration,
      TuitionFee || 0,
      Status || "Active",
      InstructorID,
    ]);

    return { CourseID: result.insertId, ...courseData };
  },

  // Lấy tất cả khóa học với thông tin chi tiết
  findAll: async (options = {}) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      instructorId = "",
    } = options;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        c.CourseID,
        c.Title,
        c.Description,
        c.Duration,
        c.TuitionFee,
        c.Status,
        c.InstructorID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        a.Email as instructorEmail,
        0 as enrolledCount
      FROM course c
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE 1=1
    `;

    const params = [];

    // Tìm kiếm theo tên khóa học
    if (search) {
      query += ` AND c.Title LIKE ?`;
      params.push(`%${search}%`);
    }

    // Lọc theo trạng thái
    if (status) {
      query += ` AND c.Status = ?`;
      params.push(status);
    }

    // Lọc theo instructor
    if (instructorId) {
      query += ` AND c.InstructorID = ?`;
      params.push(instructorId);
    }

    query += ` ORDER BY c.CourseID DESC`;

    // Đếm tổng số bản ghi (không bao gồm ORDER BY, LIMIT và OFFSET)
    const countQuery = query.replace(
      /SELECT.*FROM/,
      "SELECT COUNT(*) as total FROM"
    );
    const [countResult] = await pool.execute(countQuery, [...params]);
    const total = countResult[0].total;

    // Thêm phân trang
    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

    const [courses] = await pool.execute(query, params);

    // Lấy sessions cho mỗi khóa học
    for (let course of courses) {
      // Tính enrolledCount cho course này
      const [enrollmentCount] = await pool.execute(
        `SELECT COUNT(*) as count FROM enrollment e 
         INNER JOIN class cl ON e.ClassID = cl.ClassID 
         WHERE cl.CourseID = ? AND e.Status = 'Paid'`,
        [course.CourseID]
      );
      course.enrolledCount = enrollmentCount[0].count;

      const [sessions] = await pool.execute(
        `SELECT 
          s.SessionID,
          s.Title,
          s.Description,
          s.InstructorID
        FROM session s
        WHERE s.InstructorID = ?
        ORDER BY s.SessionID`,
        [course.InstructorID]
      );
      course.sessions = sessions;

      // Lấy materials
      const [materials] = await pool.execute(
        `SELECT 
          m.MaterialID,
          m.Title,
          m.FileURL,
          m.Status
        FROM material m
        WHERE m.CourseID = ?
        ORDER BY m.MaterialID`,
        [course.CourseID]
      );
      course.materials = materials;

      // Lấy units
      const [units] = await pool.execute(
        `SELECT 
          u.UnitID,
          u.Title,
          u.Description,
          u.Duration
        FROM unit u
        WHERE u.CourseID = ?
        ORDER BY u.UnitID`,
        [course.CourseID]
      );
      course.units = units;
    }

    return {
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Lấy một khóa học theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        c.CourseID,
        c.Title,
        c.Description,
        c.Duration,
        c.TuitionFee,
        c.Status,
        c.InstructorID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        a.Email as instructorEmail
      FROM course c
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE c.CourseID = ?
    `;

    const [courses] = await pool.execute(query, [id]);

    if (courses.length === 0) {
      return null;
    }

    const course = courses[0];

    // Lấy sessions
    const [sessions] = await pool.execute(
      `SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.InstructorID
      FROM session s
      WHERE s.InstructorID = ?
      ORDER BY s.SessionID`,
      [course.InstructorID]
    );
    course.sessions = sessions;

    // Lấy materials
    const [materials] = await pool.execute(
      `SELECT 
        m.MaterialID,
        m.Title,
        m.FileURL,
        m.Status
      FROM material m
      WHERE m.CourseID = ?
      ORDER BY m.MaterialID`,
      [id]
    );
    course.materials = materials;

    // Lấy units
    const [units] = await pool.execute(
      `SELECT 
        u.UnitID,
        u.Title,
        u.Description,
        u.Duration
      FROM unit u
      WHERE u.CourseID = ?
      ORDER BY u.UnitID`,
      [id]
    );
    course.units = units;

    // Lấy timeslots (lịch học)
    const [timeslots] = await pool.execute(
      `SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription
      FROM timeslot t
      LEFT JOIN session s ON t.LessonID = s.SessionID
      WHERE t.CourseID = ?
      ORDER BY t.Date, t.StartTime`,
      [id]
    );
    course.timeslots = timeslots;

    return course;
  },

  // Cập nhật khóa học
  update: async (id, courseData) => {
    const { Title, Description, Duration, TuitionFee, Status, InstructorID } =
      courseData;

    const query = `
      UPDATE course 
      SET Title = ?, Description = ?, Duration = ?, TuitionFee = ?, Status = ?, InstructorID = ?
      WHERE CourseID = ?
    `;

    const [result] = await pool.execute(query, [
      Title || null,
      Description || null,
      Duration || null,
      TuitionFee || null,
      Status || null,
      InstructorID || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { CourseID: id, ...courseData };
  },

  // Xóa khóa học
  delete: async (id) => {
    const query = `DELETE FROM course WHERE CourseID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra khóa học có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT CourseID FROM course WHERE CourseID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Lấy khóa học có thể enroll
  getAvailableCourses: async () => {
    const query = `
      SELECT 
        c.CourseID,
        c.Title,
        c.Description,
        c.Duration,
        c.TuitionFee,
        c.Status,
        c.InstructorID,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        a.Email as instructorEmail
      FROM course c
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE c.Status = 'Active'
      ORDER BY c.CourseID DESC
    `;

    const [courses] = await pool.execute(query);
    return courses;
  },

  // Lấy khóa học đã enroll của học viên
  getEnrolledCourses: async (learnerId) => {
    const query = `
      SELECT 
        c.CourseID,
        c.Title,
        c.Description,
        c.Duration,
        c.TuitionFee,
        c.Status,
        e.EnrollmentDate,
        e.Status as enrollmentStatus,
        i.FullName as instructorName
      FROM enrollment e
      INNER JOIN course c ON e.LearnerID = ? AND e.Status = 'Active'
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE e.LearnerID = ?
      ORDER BY e.EnrollmentDate DESC
    `;

    const [courses] = await pool.execute(query, [learnerId, learnerId]);
    return courses;
  },
};

module.exports = Course;
