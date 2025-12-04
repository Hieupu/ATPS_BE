const pool = require("../config/db");

/**
 * TimeslotRepository - dbver5
 *
 * Hỗ trợ trường mới:
 * - Day: Thứ trong tuần (T2, T3, T4, T5, T6, T7, CN)
 */
class TimeslotRepository {
  async create(timeslotData) {
    const { StartTime, EndTime, Day } = timeslotData;

    // dbver5: Hỗ trợ trường Day (thứ trong tuần)
    const query = Day
      ? `
      INSERT INTO timeslot (StartTime, EndTime, Day)
      VALUES (?, ?, ?)
    `
      : `
      INSERT INTO timeslot (StartTime, EndTime)
      VALUES (?, ?)
    `;

    const params = Day ? [StartTime, EndTime, Day] : [StartTime, EndTime];
    const [result] = await pool.execute(query, params);

    return {
      TimeslotID: result.insertId,
      StartTime,
      EndTime,
      Day: Day || null,
    };
  }

  async findById(id) {
    if (!id) {
      throw new Error("ID is required");
    }
    const query = `SELECT * FROM timeslot WHERE TimeslotID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findAll(options = {}) {
    const rawPage = options.page;
    const rawLimit = options.limit;
    const parsedLimit = parseInt(rawLimit, 10);
    const limitNum =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
    const pageNum = limitNum ? parseInt(rawPage, 10) || 1 : 1;
    const offset = limitNum ? (pageNum - 1) * limitNum : 0;

    // Kiểm tra xem cột Day có tồn tại không
    let hasDayColumn = false;
    try {
      const checkQuery = `
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'timeslot' 
          AND COLUMN_NAME = 'Day'
      `;
      const [checkResult] = await pool.execute(checkQuery);
      hasDayColumn = checkResult[0].count > 0;
    } catch (error) {
      console.warn("Could not check for Day column:", error.message);
      hasDayColumn = false;
    }

    // Xây dựng query dựa trên việc cột Day có tồn tại hay không
    let query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime
    `;

    if (hasDayColumn) {
      query += `, t.Day`;
    } else {
      query += `, NULL as Day`;
    }

    query += `
      FROM timeslot t
      WHERE 1=1
    `;

    const params = [];

    // Đếm tổng số bản ghi
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/i,
      "SELECT COUNT(*) as total FROM"
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Sắp xếp ổn định và phân trang (nếu có)
    query += ` ORDER BY t.Day IS NULL, t.Day ASC, t.StartTime ASC`;

    let dataQuery = query;
    let dataParams = params;
    if (limitNum) {
      dataQuery += ` LIMIT ${limitNum} OFFSET ${offset}`;
    }

    const [timeslots] = await pool.execute(dataQuery, dataParams);

    return {
      data: timeslots,
      pagination: {
        page: pageNum,
        limit: limitNum || total,
        total,
        totalPages: limitNum ? Math.ceil(total / limitNum) : 1,
      },
    };
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE timeslot SET ${setClause} WHERE TimeslotID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM timeslot WHERE TimeslotID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM timeslot WHERE TimeslotID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async getTotalCount() {
    const query = `SELECT COUNT(*) as total FROM timeslot`;
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }

  async findByDateRange(startDate, endDate) {
    // dbver5: timeslot không có Date, phải join với session
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        s.SessionID,
        s.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription
      FROM timeslot t
      INNER JOIN session s ON t.TimeslotID = s.TimeslotID
      WHERE s.Date BETWEEN ? AND ?
      ORDER BY s.Date ASC, t.StartTime ASC
    `;
    const [rows] = await pool.execute(query, [startDate, endDate]);
    return rows;
  }

  async findByLocation(location) {
    // dbver5: timeslot không có Location
    // Method này không còn phù hợp với schema mới
    throw new Error(
      "Method findByLocation không còn hỗ trợ trong schema dbver5"
    );
  }

  // Lấy timeslots theo ClassID (dbver5 - session trực tiếp có TimeslotID)
  async findByClassId(classId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        s.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        s.ClassID,
        cl.Name as ClassName,
        c.Title as courseTitle,
        cl.ZoomID,
        cl.Zoompass
      FROM timeslot t
      INNER JOIN session s ON t.TimeslotID = s.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.ClassID = ?
      ORDER BY s.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, [classId]);
    return timeslots;
  }

  // Lấy timeslots theo CourseID (dbver5 - session trực tiếp có TimeslotID)
  async findByCourseId(courseId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        s.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        s.ClassID,
        c.Title as courseTitle,
        cl.Name as ClassName
      FROM timeslot t
      INNER JOIN session s ON t.TimeslotID = s.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE cl.CourseID = ?
      ORDER BY s.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, [courseId]);
    return timeslots;
  }

  // Lấy lịch học của học viên (dbver5 - session trực tiếp có TimeslotID)
  async getLearnerSchedule(learnerId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        s.Date,
        s.SessionID,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        c.Title as courseTitle,
        c.Duration as courseDuration,
        i.FullName as instructorName,
        cl.ZoomID,
        cl.Zoompass,
        cl.Name as ClassName
      FROM enrollment e
      INNER JOIN \`class\` cl ON e.ClassID = cl.ClassID AND e.Status = 'active'
      INNER JOIN session s ON s.ClassID = cl.ClassID
      INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      INNER JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE e.LearnerID = ?
      ORDER BY s.Date, t.StartTime
    `;

    const [schedule] = await pool.execute(query, [learnerId]);
    return schedule;
  }

  // Lấy session đầu tiên và cuối cùng của một lớp (dbver5)
  async getClassSessionTimeRange(classId) {
    const query = `
      SELECT 
        MIN(CONCAT(s.Date, ' ', t.StartTime)) as firstSessionDateTime,
        MAX(CONCAT(s.Date, ' ', t.EndTime)) as lastSessionDateTime,
        MIN(s.Date) as firstSessionDate,
        MAX(s.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots
      FROM session s
      INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      WHERE s.ClassID = ?
    `;

    const [result] = await pool.execute(query, [classId]);
    return result[0];
  }

  // Lấy session đầu tiên và cuối cùng của một khóa học (dbver5)
  async getCourseSessionTimeRange(courseId) {
    const query = `
      SELECT 
        MIN(CONCAT(s.Date, ' ', t.StartTime)) as firstSessionDateTime,
        MAX(CONCAT(s.Date, ' ', t.EndTime)) as lastSessionDateTime,
        MIN(s.Date) as firstSessionDate,
        MAX(s.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots,
        COUNT(DISTINCT cl.ClassID) as totalClasses
      FROM course c
      INNER JOIN \`class\` cl ON c.CourseID = cl.CourseID
      INNER JOIN session s ON cl.ClassID = s.ClassID
      INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      WHERE c.CourseID = ?
    `;

    const [result] = await pool.execute(query, [courseId]);
    return result[0];
  }

  // Lấy tất cả timeslots với thông tin session đầu tiên và cuối cùng (dbver5)
  async getTimeslotsWithSessionRange(classId = null, courseId = null) {
    let whereClause = "WHERE 1=1";
    const params = [];

    if (classId) {
      whereClause += " AND s.ClassID = ?";
      params.push(classId);
    }

    if (courseId) {
      whereClause += " AND cl.CourseID = ?";
      params.push(courseId);
    }

    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        s.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        s.ClassID,
        c.Title as courseTitle,
        cl.Name as ClassName,
        i.FullName as instructorName,
        CASE 
          WHEN s.Date = (
            SELECT MIN(s2.Date) 
            FROM session s2 
            INNER JOIN timeslot t2 ON s2.TimeslotID = t2.TimeslotID 
            ${classId ? "WHERE s2.ClassID = ?" : ""}
          ) THEN 'first'
          WHEN s.Date = (
            SELECT MAX(s3.Date) 
            FROM session s3 
            INNER JOIN timeslot t3 ON s3.TimeslotID = t3.TimeslotID 
            ${classId ? "WHERE s3.ClassID = ?" : ""}
          ) THEN 'last'
          ELSE 'middle'
        END as sessionPosition
      FROM timeslot t
      INNER JOIN session s ON t.TimeslotID = s.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      ${whereClause}
      ORDER BY s.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, params);
    return timeslots;
  }

  // Lấy thống kê chi tiết về timeslots và sessions (dbver5)
  async getSessionStatistics(classId = null, courseId = null) {
    let whereClause = "WHERE 1=1";
    const params = [];

    if (classId) {
      whereClause += " AND s.ClassID = ?";
      params.push(classId);
    }

    if (courseId) {
      whereClause += " AND cl.CourseID = ?";
      params.push(courseId);
    }

    const query = `
      SELECT 
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT cl.ClassID) as totalClasses,
        MIN(s.Date) as earliestDate,
        MAX(s.Date) as latestDate,
        MIN(t.StartTime) as earliestTime,
        MAX(t.EndTime) as latestTime,
        AVG(TIME_TO_SEC(TIMEDIFF(t.EndTime, t.StartTime))/3600) as avgSessionDurationHours,
        GROUP_CONCAT(DISTINCT DAYNAME(s.Date)) as daysOfWeek,
        COUNT(DISTINCT DATE(s.Date)) as totalDays
      FROM timeslot t
      INNER JOIN session s ON t.TimeslotID = s.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      ${whereClause}
    `;

    const [result] = await pool.execute(query, params);
    return result[0];
  }

  // Lấy danh sách lớp với thông tin thời gian session (dbver5)
  async getClassesWithTimeInfo() {
    const query = `
      SELECT 
        cl.ClassID,
        cl.Name as ClassName,
        cl.Status as classStatus,
        cl.ZoomID,
        cl.Zoompass,
        c.Title as courseTitle,
        c.Duration as courseDuration,
        c.TuitionFee as courseFee,
        c.Description as courseDescription,
        i.FullName as instructorName,
        i.InstructorID,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots,
        COUNT(DISTINCT e.LearnerID) as totalEnrolled,
        MIN(s.Date) as firstSessionDate,
        MAX(s.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        MIN(CONCAT(s.Date, ' ', t.StartTime)) as firstSessionDateTime,
        MAX(CONCAT(s.Date, ' ', t.EndTime)) as lastSessionDateTime,
        GROUP_CONCAT(DISTINCT DATE_FORMAT(s.Date, '%d/%m/%Y') ORDER BY s.Date SEPARATOR ', ') as sessionDates,
        GROUP_CONCAT(DISTINCT CONCAT(TIME_FORMAT(t.StartTime, '%H:%i'), '-', TIME_FORMAT(t.EndTime, '%H:%i')) ORDER BY t.StartTime SEPARATOR ', ') as sessionTimes
      FROM \`class\` cl
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN session s ON cl.ClassID = s.ClassID
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
      GROUP BY cl.ClassID, cl.Name, cl.Status, cl.ZoomID, cl.Zoompass, c.Title, c.Duration, c.TuitionFee, c.Description, i.FullName, i.InstructorID
      ORDER BY cl.ClassID DESC
    `;

    const [classes] = await pool.execute(query);

    // Transform data để phù hợp với frontend format
    const transformedClasses = [];
    for (const classItem of classes) {
      // Lấy schedule cho class này
      const schedule = await this.getClassSchedule(classItem.ClassID);

      const transformedClass = {
        ClassID: classItem.ClassID,
        ClassName: classItem.ClassName,
        Status: classItem.classStatus,
        ZoomID: classItem.ZoomID,
        Zoompass: classItem.Zoompass,
        Opendate: classItem.firstSessionDate,
        Enddate: classItem.lastSessionDate,
        Course: {
          CourseID: classItem.ClassID,
          Title: classItem.courseTitle,
          Description: classItem.courseDescription,
          Duration: classItem.courseDuration,
          TuitionFee: classItem.courseFee,
        },
        Instructor: {
          InstructorID: classItem.InstructorID,
          FullName: classItem.instructorName,
        },
        schedule: schedule,
        totalSessions: classItem.totalSessions,
        totalTimeslots: classItem.totalTimeslots,
        totalEnrolled: classItem.totalEnrolled,
      };

      transformedClasses.push(transformedClass);
    }

    return transformedClasses;
  }

  // Lấy schedule cho một class (dbver5)
  async getClassSchedule(classId) {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.ClassID,
        s.InstructorID,
        s.TimeslotID,
        s.Date,
        t.StartTime,
        t.EndTime,
        CONCAT(s.Date, 'T00:00:00.000Z') as DateFormatted,
        'Phòng A101' as Location
      FROM session s
      INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      WHERE s.ClassID = ?
      ORDER BY s.Date ASC, t.StartTime ASC
    `;

    const [rows] = await pool.execute(query, [classId]);

    // Group by SessionID để tạo structure phù hợp với frontend
    const sessionMap = new Map();

    for (const row of rows) {
      if (!sessionMap.has(row.SessionID)) {
        sessionMap.set(row.SessionID, {
          SessionID: row.SessionID,
          Title: row.Title,
          Description: row.Description,
          ClassID: row.ClassID,
          InstructorID: row.InstructorID,
          Timeslots: [],
        });
      }

      const session = sessionMap.get(row.SessionID);
      session.Timeslots.push({
        TimeslotID: row.TimeslotID,
        Date: row.DateFormatted,
        StartTime: row.StartTime,
        EndTime: row.EndTime,
        Location: row.Location,
      });
    }

    return Array.from(sessionMap.values());
  }

  // Lấy class sessions theo format frontend cần (dbver5 schema - không có sessiontimeslot)
  async getClassSessionsForFrontend(classId) {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.ClassID,
        s.InstructorID,
        s.TimeslotID,
        s.Date,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName,
        i.FullName as InstructorName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE s.ClassID = ?
      ORDER BY s.Date ASC, t.StartTime ASC
    `;

    const [rows] = await pool.execute(query, [classId]);

    return rows;
  }

  // Lấy ca học đã có sẵn trong DB của một lớp cụ thể (dbver5)
  async getExistingTimeslotsForClass(classId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        s.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        CONCAT(s.Date, 'T00:00:00.000Z') as DateFormatted,
        'Phòng A101' as Location,
        TIME_FORMAT(t.StartTime, '%H:%i') as formattedStartTime,
        TIME_FORMAT(t.EndTime, '%H:%i') as formattedEndTime,
        DATE_FORMAT(s.Date, '%d/%m/%Y') as formattedDate,
        DAYNAME(s.Date) as dayOfWeek
      FROM timeslot t
      INNER JOIN session s ON t.TimeslotID = s.TimeslotID
      WHERE s.ClassID = ?
      ORDER BY s.Date ASC, t.StartTime ASC
    `;

    const [rows] = await pool.execute(query, [classId]);

    // Transform để phù hợp với frontend format
    const transformedTimeslots = rows.map((row) => ({
      TimeslotID: row.TimeslotID,
      Date: row.DateFormatted,
      StartTime: row.StartTime,
      EndTime: row.EndTime,
      Location: row.Location,
      SessionID: row.SessionID,
      sessionTitle: row.sessionTitle,
      sessionDescription: row.sessionDescription,
      formattedStartTime: row.formattedStartTime,
      formattedEndTime: row.formattedEndTime,
      formattedDate: row.formattedDate,
      dayOfWeek: row.dayOfWeek,
    }));

    return transformedTimeslots;
  }

  // Lấy tất cả ca học đã có sẵn trong DB với thông tin lớp (dbver5)
  async getAllExistingTimeslotsWithClassInfo() {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        s.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        cl.ClassID,
        cl.Name as ClassName,
        cl.Status as classStatus,
        c.Title as courseTitle,
        i.FullName as instructorName,
        CONCAT(s.Date, ' ', t.StartTime) as sessionDateTime,
        TIME_FORMAT(t.StartTime, '%H:%i') as formattedStartTime,
        TIME_FORMAT(t.EndTime, '%H:%i') as formattedEndTime,
        DATE_FORMAT(s.Date, '%d/%m/%Y') as formattedDate,
        DAYNAME(s.Date) as dayOfWeek
      FROM timeslot t
      INNER JOIN session s ON t.TimeslotID = s.TimeslotID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      ORDER BY cl.ClassID DESC, s.Date ASC, t.StartTime ASC
    `;

    const [timeslots] = await pool.execute(query);
    return timeslots;
  }

  // Lấy thống kê ca học cho classlist (dbver5)
  async getClassListWithTimeStats() {
    const query = `
      SELECT 
        cl.ClassID,
        cl.Name as ClassName,
        cl.Status as classStatus,
        cl.ZoomID,
        cl.Zoompass,
        c.Title as courseTitle,
        c.Duration as courseDuration,
        c.TuitionFee as courseFee,
        i.FullName as instructorName,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots,
        COUNT(DISTINCT e.LearnerID) as totalEnrolled,
        CASE 
          WHEN COUNT(DISTINCT t.TimeslotID) = 0 THEN 'Chưa có ca học'
          WHEN COUNT(DISTINCT t.TimeslotID) > 0 THEN CONCAT('Có ', COUNT(DISTINCT t.TimeslotID), ' ca học')
          ELSE 'Chưa có ca học'
        END as timeStatus,
        CASE 
          WHEN COUNT(DISTINCT e.LearnerID) = 0 THEN 'Chưa có học sinh'
          WHEN COUNT(DISTINCT e.LearnerID) > 0 THEN CONCAT('Có ', COUNT(DISTINCT e.LearnerID), ' học sinh')
          ELSE 'Chưa có học sinh'
        END as enrollmentStatus,
        MIN(s.Date) as firstSessionDate,
        MAX(s.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        GROUP_CONCAT(DISTINCT DATE_FORMAT(s.Date, '%d/%m/%Y') ORDER BY s.Date SEPARATOR ', ') as sessionDatesList,
        GROUP_CONCAT(DISTINCT CONCAT(TIME_FORMAT(t.StartTime, '%H:%i'), '-', TIME_FORMAT(t.EndTime, '%H:%i')) ORDER BY t.StartTime SEPARATOR ', ') as sessionTimesList
      FROM \`class\` cl
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN session s ON cl.ClassID = s.ClassID
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
      GROUP BY cl.ClassID, cl.Name, cl.Status, cl.ZoomID, cl.Zoompass, c.Title, c.Duration, c.TuitionFee, i.FullName
      ORDER BY cl.ClassID DESC
    `;

    const [classes] = await pool.execute(query);
    return classes;
  }

  // Lấy danh sách học sinh đã enroll vào lớp
  async getEnrolledLearners(classId) {
    const query = `
      SELECT 
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status as enrollmentStatus,
        l.LearnerID,
        l.FullName as learnerName,
        l.DateOfBirth,
        l.ProfilePicture,
        l.Job,
        l.Address,
        a.Email,
        a.Phone,
        p.PaymentID,
        p.Amount,
        p.PaymentMethod,
        p.PaymentDate
      FROM enrollment e
      INNER JOIN learner l ON e.LearnerID = l.LearnerID
      INNER JOIN account a ON l.AccID = a.AccID
      LEFT JOIN payment p ON e.EnrollmentID = p.EnrollmentID
      WHERE e.ClassID = ?
      ORDER BY e.EnrollmentDate DESC
    `;

    const [learners] = await pool.execute(query, [classId]);
    return learners;
  }

  // Lấy danh sách học sinh đã enroll với thông tin lớp
  async getAllEnrolledLearnersWithClassInfo() {
    const query = `
      SELECT 
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status as enrollmentStatus,
        l.LearnerID,
        l.FullName as learnerName,
        l.DateOfBirth,
        l.ProfilePicture,
        l.Job,
        l.Address,
        a.Email,
        a.Phone,
        cl.ClassID,
        cl.ClassName,
        cl.Status as classStatus,
        c.Title as courseTitle,
        c.Duration as courseDuration,
        c.TuitionFee as courseFee,
        i.FullName as instructorName,
        p.PaymentID,
        p.Amount,
        p.PaymentMethod,
        p.PaymentDate
      FROM enrollment e
      INNER JOIN learner l ON e.LearnerID = l.LearnerID
      INNER JOIN account a ON l.AccID = a.AccID
      INNER JOIN \`class\` cl ON e.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN payment p ON e.EnrollmentID = p.EnrollmentID
      ORDER BY cl.ClassID DESC, e.EnrollmentDate DESC
    `;

    const [learners] = await pool.execute(query);
    return learners;
  }

  // Lấy thống kê enrollment cho classlist
  async getClassEnrollmentStats() {
    const query = `
      SELECT 
        cl.ClassID,
        cl.ClassName,
        cl.Status as classStatus,
        c.Title as courseTitle,
        c.TuitionFee as courseFee,
        i.FullName as instructorName,
        COUNT(DISTINCT e.LearnerID) as totalEnrolled,
        COUNT(DISTINCT p.PaymentID) as totalPayments,
        SUM(p.Amount) as totalRevenue,
        CASE 
          WHEN COUNT(DISTINCT e.LearnerID) = 0 THEN 'Chưa có học sinh'
          WHEN COUNT(DISTINCT e.LearnerID) > 0 THEN CONCAT('Có ', COUNT(DISTINCT e.LearnerID), ' học sinh')
          ELSE 'Chưa có học sinh'
        END as enrollmentStatus,
        MIN(e.EnrollmentDate) as firstEnrollmentDate,
        MAX(e.EnrollmentDate) as lastEnrollmentDate
      FROM \`class\` cl
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
      LEFT JOIN payment p ON e.EnrollmentID = p.EnrollmentID
      GROUP BY cl.ClassID, cl.ClassName, cl.Status, c.Title, c.TuitionFee, i.FullName
      ORDER BY cl.ClassID DESC
    `;

    const [stats] = await pool.execute(query);
    return stats;
  }
}

module.exports = new TimeslotRepository();
