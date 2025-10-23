const pool = require("../config/db");

class TimeslotRepository {
  async create(timeslotData) {
    const { StartTime, EndTime, Date: dateValue } = timeslotData;

    // Xử lý format ngày tháng
    let formattedDate = dateValue;
    if (dateValue && typeof dateValue === "string" && dateValue.includes("T")) {
      try {
        const date = new Date(dateValue);
        formattedDate = date.toLocaleDateString("en-CA");
      } catch (error) {
        console.error("Error parsing date:", dateValue, error);
        formattedDate = dateValue;
      }
    }

    const query = `
      INSERT INTO timeslot (StartTime, EndTime, Date)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      StartTime,
      EndTime,
      formattedDate,
    ]);

    return {
      TimeslotID: result.insertId,
      StartTime,
      EndTime,
      Date: formattedDate,
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
    const { page = 1, limit = 10, date = "" } = options;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        CASE 
          WHEN st.sessiontimeslotID IS NOT NULL THEN true 
          ELSE false 
        END as IsAssigned
      FROM timeslot t
      LEFT JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      WHERE 1=1
    `;

    const params = [];

    if (date) {
      query += ` AND t.Date = ?`;
      params.push(date);
    }

    // Đếm tổng số bản ghi
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/i,
      "SELECT COUNT(*) as total FROM"
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Thêm phân trang
    query += ` ORDER BY t.Date DESC, t.StartTime ASC LIMIT ${limitNum} OFFSET ${offset}`;

    const [timeslots] = await pool.execute(query, params);

    return {
      data: timeslots,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
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
    const query = `
      SELECT * FROM timeslot 
      WHERE Date BETWEEN ? AND ? 
      ORDER BY Date ASC, StartTime ASC
    `;
    const [rows] = await pool.execute(query, [startDate, endDate]);
    return rows;
  }

  async findByLocation(location) {
    const query = `SELECT * FROM timeslot WHERE Location = ? ORDER BY Date ASC, StartTime ASC`;
    const [rows] = await pool.execute(query, [location]);
    return rows;
  }

  // Lấy timeslots theo ClassID (qua sessiontimeslot)
  async findByClassId(classId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        c.Title as courseTitle,
        cl.ZoomURL,
        st.sessiontimeslotID
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.ClassID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, [classId]);
    return timeslots;
  }

  // Lấy timeslots theo CourseID (qua sessiontimeslot)
  async findByCourseId(courseId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        c.Title as courseTitle,
        st.sessiontimeslotID
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE cl.CourseID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, [courseId]);
    return timeslots;
  }

  // Lấy lịch học của học viên (qua sessiontimeslot)
  async getLearnerSchedule(learnerId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        c.Title as courseTitle,
        c.Duration as courseDuration,
        i.FullName as instructorName,
        cl.ZoomURL,
        st.sessiontimeslotID
      FROM enrollment e
      INNER JOIN \`class\` cl ON e.ClassID = cl.ClassID AND e.Status = 'Paid'
      INNER JOIN session s ON s.ClassID = cl.ClassID
      INNER JOIN sessiontimeslot st ON st.SessionID = s.SessionID
      INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      INNER JOIN course c ON cl.CourseID = c.CourseID
      INNER JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE e.LearnerID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [schedule] = await pool.execute(query, [learnerId]);
    return schedule;
  }

  // Lấy session đầu tiên và cuối cùng của một lớp
  async getClassSessionTimeRange(classId) {
    const query = `
      SELECT 
        MIN(CONCAT(t.Date, ' ', t.StartTime)) as firstSessionDateTime,
        MAX(CONCAT(t.Date, ' ', t.EndTime)) as lastSessionDateTime,
        MIN(t.Date) as firstSessionDate,
        MAX(t.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots
      FROM session s
      INNER JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE s.ClassID = ?
    `;

    const [result] = await pool.execute(query, [classId]);
    return result[0];
  }

  // Lấy session đầu tiên và cuối cùng của một khóa học
  async getCourseSessionTimeRange(courseId) {
    const query = `
      SELECT 
        MIN(CONCAT(t.Date, ' ', t.StartTime)) as firstSessionDateTime,
        MAX(CONCAT(t.Date, ' ', t.EndTime)) as lastSessionDateTime,
        MIN(t.Date) as firstSessionDate,
        MAX(t.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots,
        COUNT(DISTINCT cl.ClassID) as totalClasses
      FROM course c
      INNER JOIN \`class\` cl ON c.CourseID = cl.CourseID
      INNER JOIN session s ON cl.ClassID = s.ClassID
      INNER JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE c.CourseID = ?
    `;

    const [result] = await pool.execute(query, [courseId]);
    return result[0];
  }

  // Lấy tất cả timeslots với thông tin session đầu tiên và cuối cùng
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
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        c.Title as courseTitle,
        cl.ClassName,
        cl.ClassID,
        i.FullName as instructorName,
        st.sessiontimeslotID,
        CASE 
          WHEN t.Date = (
            SELECT MIN(t2.Date) 
            FROM session s2 
            INNER JOIN sessiontimeslot st2 ON s2.SessionID = st2.SessionID 
            INNER JOIN timeslot t2 ON st2.TimeslotID = t2.TimeslotID 
            ${classId ? "WHERE s2.ClassID = ?" : ""}
          ) THEN 'first'
          WHEN t.Date = (
            SELECT MAX(t3.Date) 
            FROM session s3 
            INNER JOIN sessiontimeslot st3 ON s3.SessionID = st3.SessionID 
            INNER JOIN timeslot t3 ON st3.TimeslotID = t3.TimeslotID 
            ${classId ? "WHERE s3.ClassID = ?" : ""}
          ) THEN 'last'
          ELSE 'middle'
        END as sessionPosition
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      ${whereClause}
      ORDER BY t.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, params);
    return timeslots;
  }

  // Lấy thống kê chi tiết về timeslots và sessions
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
        MIN(t.Date) as earliestDate,
        MAX(t.Date) as latestDate,
        MIN(t.StartTime) as earliestTime,
        MAX(t.EndTime) as latestTime,
        AVG(TIME_TO_SEC(TIMEDIFF(t.EndTime, t.StartTime))/3600) as avgSessionDurationHours,
        GROUP_CONCAT(DISTINCT DAYNAME(t.Date)) as daysOfWeek,
        COUNT(DISTINCT DATE(t.Date)) as totalDays
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      ${whereClause}
    `;

    const [result] = await pool.execute(query, params);
    return result[0];
  }

  // Lấy danh sách lớp với thông tin thời gian session
  async getClassesWithTimeInfo() {
    const query = `
      SELECT 
        cl.ClassID,
        cl.ClassName,
        cl.Status as classStatus,
        cl.ZoomURL,
        c.Title as courseTitle,
        c.Duration as courseDuration,
        c.TuitionFee as courseFee,
        c.Description as courseDescription,
        i.FullName as instructorName,
        i.InstructorID,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT t.TimeslotID) as totalTimeslots,
        COUNT(DISTINCT e.LearnerID) as totalEnrolled,
        MIN(t.Date) as firstSessionDate,
        MAX(t.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        MIN(CONCAT(t.Date, ' ', t.StartTime)) as firstSessionDateTime,
        MAX(CONCAT(t.Date, ' ', t.EndTime)) as lastSessionDateTime,
        GROUP_CONCAT(DISTINCT DATE_FORMAT(t.Date, '%d/%m/%Y') ORDER BY t.Date SEPARATOR ', ') as sessionDates,
        GROUP_CONCAT(DISTINCT CONCAT(TIME_FORMAT(t.StartTime, '%H:%i'), '-', TIME_FORMAT(t.EndTime, '%H:%i')) ORDER BY t.StartTime SEPARATOR ', ') as sessionTimes
      FROM \`class\` cl
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN session s ON cl.ClassID = s.ClassID
      LEFT JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
      GROUP BY cl.ClassID, cl.ClassName, cl.Status, cl.ZoomURL, c.Title, c.Duration, c.TuitionFee, c.Description, i.FullName, i.InstructorID
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
        ZoomURL: classItem.ZoomURL,
        StartDate: classItem.firstSessionDate,
        EndDate: classItem.lastSessionDate,
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

  // Lấy schedule cho một class 
  async getClassSchedule(classId) {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.ClassID,
        s.InstructorID,
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        st.sessiontimeslotID,
        CONCAT(t.Date, 'T00:00:00.000Z') as DateFormatted,
        'Phòng A101' as Location
      FROM session s
      INNER JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE s.ClassID = ?
      ORDER BY t.Date ASC, t.StartTime ASC
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
        sessiontimeslotID: row.sessiontimeslotID,
        TimeslotID: row.TimeslotID,
        Date: row.DateFormatted,
        StartTime: row.StartTime,
        EndTime: row.EndTime,
        Location: row.Location,
      });
    }

    return Array.from(sessionMap.values());
  }

  // Lấy class sessions theo format frontend cần 
  async getClassSessionsForFrontend(classId) {
    const query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.ClassID,
        s.InstructorID,
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        st.sessiontimeslotID,
        CONCAT(t.Date, 'T00:00:00.000Z') as DateFormatted,
        'Phòng A101' as Location
      FROM session s
      INNER JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE s.ClassID = ?
      ORDER BY t.Date ASC, t.StartTime ASC
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
        sessiontimeslotID: row.sessiontimeslotID,
        TimeslotID: row.TimeslotID,
        Date: row.DateFormatted,
        StartTime: row.StartTime,
        EndTime: row.EndTime,
        Location: row.Location,
      });
    }

    return Array.from(sessionMap.values());
  }

  // Lấy ca học đã có sẵn trong DB của một lớp cụ thể 
  async getExistingTimeslotsForClass(classId) {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        st.sessiontimeslotID,
        CONCAT(t.Date, 'T00:00:00.000Z') as DateFormatted,
        'Phòng A101' as Location,
        TIME_FORMAT(t.StartTime, '%H:%i') as formattedStartTime,
        TIME_FORMAT(t.EndTime, '%H:%i') as formattedEndTime,
        DATE_FORMAT(t.Date, '%d/%m/%Y') as formattedDate,
        DAYNAME(t.Date) as dayOfWeek
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      WHERE s.ClassID = ?
      ORDER BY t.Date ASC, t.StartTime ASC
    `;

    const [rows] = await pool.execute(query, [classId]);

    // Transform để phù hợp với frontend format
    const transformedTimeslots = rows.map((row) => ({
      sessiontimeslotID: row.sessiontimeslotID,
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

  // Lấy tất cả ca học đã có sẵn trong DB với thông tin lớp
  async getAllExistingTimeslotsWithClassInfo() {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        cl.ClassID,
        cl.ClassName,
        cl.Status as classStatus,
        c.Title as courseTitle,
        i.FullName as instructorName,
        st.sessiontimeslotID,
        CONCAT(t.Date, ' ', t.StartTime) as sessionDateTime,
        TIME_FORMAT(t.StartTime, '%H:%i') as formattedStartTime,
        TIME_FORMAT(t.EndTime, '%H:%i') as formattedEndTime,
        DATE_FORMAT(t.Date, '%d/%m/%Y') as formattedDate,
        DAYNAME(t.Date) as dayOfWeek
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
      ORDER BY cl.ClassID DESC, t.Date ASC, t.StartTime ASC
    `;

    const [timeslots] = await pool.execute(query);
    return timeslots;
  }

  // Lấy thống kê ca học cho classlist
  async getClassListWithTimeStats() {
    const query = `
      SELECT 
        cl.ClassID,
        cl.ClassName,
        cl.Status as classStatus,
        cl.ZoomURL,
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
        MIN(t.Date) as firstSessionDate,
        MAX(t.Date) as lastSessionDate,
        MIN(t.StartTime) as firstSessionTime,
        MAX(t.EndTime) as lastSessionTime,
        GROUP_CONCAT(DISTINCT DATE_FORMAT(t.Date, '%d/%m/%Y') ORDER BY t.Date SEPARATOR ', ') as sessionDatesList,
        GROUP_CONCAT(DISTINCT CONCAT(TIME_FORMAT(t.StartTime, '%H:%i'), '-', TIME_FORMAT(t.EndTime, '%H:%i')) ORDER BY t.StartTime SEPARATOR ', ') as sessionTimesList
      FROM \`class\` cl
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN session s ON cl.ClassID = s.ClassID
      LEFT JOIN sessiontimeslot st ON s.SessionID = st.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
      GROUP BY cl.ClassID, cl.ClassName, cl.Status, cl.ZoomURL, c.Title, c.Duration, c.TuitionFee, i.FullName
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
