const connectDB = require("../config/db");

class TimeslotRepository {
  async create(timeslotData) {
    const pool = await connectDB();
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
    const pool = await connectDB();
    if (!id) {
      throw new Error("ID is required");
    }
    const query = `SELECT * FROM timeslot WHERE TimeslotID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findAll(options = {}) {
  const pool = await connectDB();

  const rawPage = options.page;
  const rawLimit = options.limit;

  const limitNum = Number.isFinite(parseInt(rawLimit, 10))
    ? parseInt(rawLimit, 10)
    : null;

  const pageNum = limitNum ? parseInt(rawPage, 10) || 1 : 1;
  const offset = limitNum ? (pageNum - 1) * limitNum : 0;

  // Base query
  let query = `
    SELECT 
      t.TimeslotID,
      t.StartTime,
      t.EndTime,
      t.Day
    FROM timeslot t
    WHERE 1=1
  `;

  const params = [];

  // Count query
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/i,
    "SELECT COUNT(*) as total FROM"
  );

  const [countResult] = await pool.execute(countQuery, params);
  const total = countResult[0].total;

  // Order + pagination
  query += `
    ORDER BY t.Day ASC, t.StartTime ASC
  `;

  if (limitNum) {
    query += ` LIMIT ${limitNum} OFFSET ${offset}`;
  }

  const [timeslots] = await pool.execute(query, params);

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
    const pool = await connectDB();
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE timeslot SET ${setClause} WHERE TimeslotID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const pool = await connectDB();
    const query = `DELETE FROM timeslot WHERE TimeslotID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const pool = await connectDB();
    const query = `SELECT 1 FROM timeslot WHERE TimeslotID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async getTotalCount() {
    const pool = await connectDB();
    const query = `SELECT COUNT(*) as total FROM timeslot`;
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }

  async findByDateRange(startDate, endDate) {
    const pool = await connectDB();
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

  async findByClassId(classId) {
    const pool = await connectDB();
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

  async findByCourseId(courseId) {
    const pool = await connectDB();
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

  async getLearnerSchedule(learnerId) {
    const pool = await connectDB();
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

  async getClassSessionTimeRange(classId) {
    const pool = await connectDB();
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

  async getCourseSessionTimeRange(courseId) {
    const pool = await connectDB();
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

  async getTimeslotsWithSessionRange(classId = null, courseId = null) {
    const pool = await connectDB();
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

  async getSessionStatistics(classId = null, courseId = null) {
    const pool = await connectDB();
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

  async getClassesWithTimeInfo() {
    const pool = await connectDB();
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

  async getClassSchedule(classId) {
    const pool = await connectDB();
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

  async getClassSessionsForFrontend(classId) {
    const pool = await connectDB();
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
    const pool = await connectDB();
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
    const pool = await connectDB();
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

  async getClassListWithTimeStats() {
    const pool = await connectDB();
    const query = `
      SELECT 
        cl.ClassID,
        cl.Name as ClassName,
        cl.Status as classStatus,
        cl.ZoomID,
        cl.Zoompass,
        c.Title as courseTitle,
        c.Duration as courseDuration,
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
      FROM class cl
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN session s ON cl.ClassID = s.ClassID
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN enrollment e ON cl.ClassID = e.ClassID
      GROUP BY cl.ClassID, cl.Name, cl.Status, cl.ZoomID, cl.Zoompass, c.Title, c.Duration, i.FullName
      ORDER BY cl.ClassID DESC
    `;

    const [classes] = await pool.execute(query);
    return classes;
  }

  // Lấy danh sách học sinh đã enroll vào lớp
  async getEnrolledLearners(classId) {
    const pool = await connectDB();
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
    const pool = await connectDB();
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

  async getClassEnrollmentStats() {
    const pool = await connectDB();
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

  // Lấy danh sách distinct StartTime và EndTime từ bảng timeslot
  async getDistinctTimeRanges() {
    try {
      const pool = await connectDB();
      if (!pool) {
        throw new Error("Database connection failed");
      }

      const query = `
        SELECT DISTINCT StartTime, EndTime 
        FROM timeslot 
        WHERE StartTime IS NOT NULL AND EndTime IS NOT NULL
        ORDER BY StartTime ASC, EndTime ASC
      `;

      const [rows] = await pool.execute(query);

      if (!Array.isArray(rows)) {
        console.error("Unexpected result format from database:", typeof rows);
        return [];
      }

      return rows;
    } catch (error) {
      console.error("Database error in getDistinctTimeRanges:", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }
}

module.exports = new TimeslotRepository();
