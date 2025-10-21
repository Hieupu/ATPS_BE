const pool = require("../config/db");

const Class = {
  // Tạo lớp học mới
  create: async (classData) => {
    const { ClassName, ZoomURL, Status, CourseID, InstructorID } = classData;

    const query = `
      INSERT INTO \`class\` (ClassName, ZoomURL, Status, CourseID, InstructorID)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      ClassName,
      ZoomURL ?? null,
      Status || "Chưa phân giảng viên",
      CourseID === undefined ? null : CourseID,
      InstructorID ?? null,
    ]);

    return { ClassID: result.insertId, ...classData };
  },

  // Lấy tất cả lớp học với thông tin chi tiết
  findAll: async (options = {}) => {
    const {
      page = 1,
      limit = 10,
      status = "",
      instructorId = "",
      courseId = "",
    } = options;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        c.ClassID,
        c.ClassName,
        c.ZoomURL,
        c.Status,
        c.CourseID,
        c.InstructorID,
        co.Title as courseTitle,
        co.Description as courseDescription,
        co.Duration as courseDuration,
        co.TuitionFee as courseTuitionFee,
        co.Status as courseStatus,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        a.Email as instructorEmail,
        0 as enrolledCount
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ` AND c.Status = ?`;
      params.push(status);
    }

    if (instructorId) {
      query += ` AND c.InstructorID = ?`;
      params.push(instructorId);
    }

    if (courseId) {
      query += ` AND c.CourseID = ?`;
      params.push(courseId);
    }

    // Đếm tổng số bản ghi (không bao gồm ORDER BY, LIMIT và OFFSET)
    // Sử dụng regex multi-line, non-greedy để thay đúng phần SELECT ... FROM
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/i,
      "SELECT COUNT(*) as total FROM"
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Thêm phân trang
    query += ` ORDER BY c.ClassID DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [classes] = await pool.execute(query, params);

    // Lấy timeslots và enrollments cho mỗi lớp học
    for (let classItem of classes) {
      // Lấy enrolledCount
      const [enrollmentCount] = await pool.execute(
        `SELECT COUNT(*) as count FROM enrollment e 
         WHERE e.ClassID = ? AND e.Status = 'Paid'`,
        [classItem.ClassID]
      );
      classItem.enrolledCount = enrollmentCount[0].count;

      const [timeslots] = await pool.execute(
        `SELECT 
          t.TimeslotID,
          t.StartTime,
          t.EndTime,
          DATE_FORMAT(t.Date, '%Y-%m-%d') as Date,
          s.Title as sessionTitle,
          s.Description as sessionDescription
        FROM timeslot t
        INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
        INNER JOIN session s ON st.SessionID = s.SessionID
        WHERE s.ClassID = ?
        ORDER BY t.Date, t.StartTime`,
        [classItem.ClassID]
      );
      classItem.schedule = timeslots;

      // Lấy enrollments
      const [enrollments] = await pool.execute(
        `SELECT 
          e.EnrollmentID,
          e.EnrollmentDate,
          e.Status,
          l.LearnerID,
          l.FullName as learnerName,
          a.Email as learnerEmail
        FROM enrollment e
        LEFT JOIN learner l ON e.LearnerID = l.LearnerID
        LEFT JOIN account a ON l.AccID = a.AccID
        WHERE e.ClassID = ?
        ORDER BY e.EnrollmentDate DESC`,
        [classItem.ClassID]
      );
      classItem.enrollments = enrollments;
    }

    return {
      data: classes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  // Lấy một lớp học theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        c.ClassID,
        c.ClassName,
        c.ZoomURL,
        c.Status,
        c.CourseID,
        c.InstructorID,
        co.Title as courseTitle,
        co.Description as courseDescription,
        co.Duration as courseDuration,
        co.TuitionFee as courseTuitionFee,
        co.Status as courseStatus,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        a.Email as instructorEmail
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE c.ClassID = ?
    `;

    const [classes] = await pool.execute(query, [id]);

    if (classes.length === 0) {
      return null;
    }

    const classItem = classes[0];

    // Lấy timeslots (qua sessiontimeslot)
    const [timeslots] = await pool.execute(
      `SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      WHERE s.ClassID = ?
      ORDER BY t.Date, t.StartTime`,
      [classItem.ClassID]
    );
    classItem.schedule = timeslots;

    return classItem;
  },

  // Lấy một lớp học theo ID với thông tin chi tiết
  findByIdDetailed: async (id) => {
    const query = `
      SELECT 
        c.ClassID,
        c.ClassName,
        c.ZoomURL,
        c.Status,
        c.CourseID,
        c.InstructorID,
        co.Title as courseTitle,
        co.Description as courseDescription,
        co.Duration as courseDuration,
        co.TuitionFee as courseTuitionFee,
        co.Status as courseStatus,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        a.Email as instructorEmail
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE c.ClassID = ?
    `;

    const [classes] = await pool.execute(query, [id]);

    if (classes.length === 0) {
      return null;
    }

    const classItem = classes[0];

    // Thêm thông tin Course và Instructor
    classItem.Course = {
      CourseID: classItem.CourseID,
      Title: classItem.courseTitle,
      Description: classItem.courseDescription,
      Duration: classItem.courseDuration,
      TuitionFee: classItem.courseTuitionFee,
      Status: classItem.courseStatus,
    };

    classItem.Instructor = {
      InstructorID: classItem.InstructorID,
      FullName: classItem.instructorName,
      Major: classItem.instructorMajor,
      Email: classItem.instructorEmail,
    };

    // Lấy timeslots (qua sessiontimeslot)
    const [timeslots] = await pool.execute(
      `SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      WHERE s.ClassID = ?
      ORDER BY t.Date, t.StartTime`,
      [classItem.ClassID]
    );
    classItem.schedule = timeslots;

    return classItem;
  },

  // Cập nhật lớp học
  update: async (id, classData) => {
    const { ClassName, ZoomURL, Status, CourseID, InstructorID } = classData;

    // Tạo dynamic query chỉ update các field được cung cấp
    const updateFields = [];
    const values = [];

    if (ClassName !== undefined) {
      updateFields.push("ClassName = ?");
      values.push(ClassName);
    }

    if (ZoomURL !== undefined) {
      updateFields.push("ZoomURL = ?");
      values.push(ZoomURL);
    }

    if (Status !== undefined) {
      updateFields.push("Status = ?");
      values.push(Status);
    }

    if (CourseID !== undefined) {
      updateFields.push("CourseID = ?");
      values.push(CourseID);
    }

    if (InstructorID !== undefined) {
      updateFields.push("InstructorID = ?");
      values.push(InstructorID);
    }

    if (updateFields.length === 0) {
      return { ClassID: id, ...classData };
    }

    values.push(id);
    const query = `UPDATE \`class\` SET ${updateFields.join(
      ", "
    )} WHERE ClassID = ?`;

    const [result] = await pool.execute(query, values);

    if (result.affectedRows === 0) {
      return null;
    }

    return { ClassID: id, ...classData };
  },

  // Xóa lớp học
  delete: async (id) => {
    const query = `DELETE FROM \`class\` WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra lớp học có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT ClassID FROM \`class\` WHERE ClassID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Lấy thống kê lớp học
  getStatistics: async (classId) => {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(e.EnrollmentID) as totalEnrolled
      FROM \`class\` c
      LEFT JOIN enrollment e ON e.ClassID = c.ClassID AND e.Status = 'Paid'
      WHERE c.ClassID = ?
      GROUP BY c.ClassID`,
      [classId]
    );

    if (stats.length === 0) {
      return null;
    }

    return {
      totalEnrolled: stats[0].totalEnrolled || 0,
      paidCount: stats[0].totalEnrolled || 0, // Số học viên đã thanh toán
      pendingPaymentCount: 0, // Cần implement payment logic
      enrollmentRate: null,
    };
  },

  // Tính StartDate và EndDate từ session timeslots
  getClassDateRange: async (classId) => {
    const query = `
      SELECT 
        DATE_FORMAT(MIN(t.Date), '%Y-%m-%d') as StartDate,
        DATE_FORMAT(MAX(t.Date), '%Y-%m-%d') as EndDate
      FROM session s
      JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE s.ClassID = ?
    `;

    const [result] = await pool.execute(query, [classId]);
    return result[0] || { StartDate: null, EndDate: null };
  },

  // Tự động cập nhật trạng thái lớp học dựa trên session timeslots
  autoUpdateStatus: async () => {
    const today = new Date().toISOString().split("T")[0];

    // Cập nhật trạng thái dựa trên session timeslots
    const [result] = await pool.execute(
      `UPDATE \`class\` c
       SET Status = CASE
         WHEN c.Status = 'Sắp khai giảng' AND c.InstructorID IS NOT NULL AND EXISTS (
           SELECT 1 FROM session s 
           JOIN sessiontimeslot st ON s.SessionID = st.SessionID 
           JOIN timeslot t ON st.TimeslotID = t.TimeslotID 
           WHERE s.ClassID = c.ClassID AND t.Date <= CURDATE()
         ) THEN 'Đang hoạt động'
         WHEN c.Status = 'Đang hoạt động' AND NOT EXISTS (
           SELECT 1 FROM session s 
           JOIN sessiontimeslot st ON s.SessionID = st.SessionID 
           JOIN timeslot t ON st.TimeslotID = t.TimeslotID 
           WHERE s.ClassID = c.ClassID AND t.Date >= CURDATE()
         ) THEN 'Đã kết thúc'
         ELSE c.Status
       END`
    );

    return result.affectedRows;
  },

  // Lấy tất cả lớp học với lịch học (sessions)
  findAllWithSchedules: async () => {
    try {
      const query = `
        SELECT 
          c.ClassID,
          c.ClassName,
          c.ZoomURL,
          c.Status,
          c.CourseID,
          c.InstructorID,
          co.Title as courseTitle,
          co.Description as courseDescription,
          co.Duration as courseDuration,
          co.TuitionFee as courseTuitionFee,
          co.Status as courseStatus,
          i.FullName as instructorName,
          i.Email as instructorEmail,
          i.Phone as instructorPhone,
          i.Specialization as instructorSpecialization,
          i.Experience as instructorExperience,
          DATE_FORMAT(MIN(t.Date), '%Y-%m-%d') as StartDate,
          DATE_FORMAT(MAX(t.Date), '%Y-%m-%d') as EndDate,
          GROUP_CONCAT(
            CONCAT(
              '{"TimeslotID":"', st.TimeslotID, 
              '","Date":"', t.Date, 
              '","StartTime":"', t.StartTime, 
              '","EndTime":"', t.EndTime, 
              '","sessionTitle":"', COALESCE(s.Title, ''), 
              '","sessionDescription":"', COALESCE(s.Description, ''), '"}' 
            ) 
            SEPARATOR ','
          ) as schedule_data
        FROM \`class\` c
        LEFT JOIN course co ON c.CourseID = co.CourseID
        LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
        LEFT JOIN session s ON c.ClassID = s.ClassID
        LEFT JOIN sessiontimeslot st ON s.SessionID = st.SessionID
        LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
        GROUP BY c.ClassID
        ORDER BY c.ClassID DESC
      `;

      const [rows] = await pool.execute(query);

      return rows.map((row) => ({
        ...row,
        StartDate: row.StartDate,
        EndDate: row.EndDate,
        schedule: row.schedule_data
          ? row.schedule_data
              .split(",")
              .map((item) => {
                try {
                  return JSON.parse(item);
                } catch (e) {
                  console.warn("Failed to parse schedule item:", item);
                  return null;
                }
              })
              .filter((item) => item !== null)
          : [],
      }));
    } catch (error) {
      console.error("Error fetching classes with schedules:", error);
      throw error;
    }
  },
};

module.exports = Class;
