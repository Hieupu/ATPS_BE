const pool = require("../config/db");

class InstructorRepository {
  async create(instructorData) {
    const {
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Job,
      Address,
      Major,
      InstructorFee,
    } = instructorData;

    const query = `
      INSERT INTO instructor (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address, Major, InstructorFee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Job,
      Address,
      Major,
      InstructorFee,
    ]);

    return { InstructorID: result.insertId, ...instructorData };
  }

  async findById(id) {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE i.InstructorID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findByAccountId(accountId) {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE i.AccID = ?
    `;

    const [rows] = await pool.execute(query, [accountId]);
    return rows[0] || null;
  }

  async findAll() {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      ORDER BY i.InstructorID DESC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async findByMajor(major) {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE i.Major = ?
      ORDER BY i.InstructorID DESC
    `;

    const [rows] = await pool.execute(query, [major]);
    return rows;
  }

  async update(id, updateData) {
    // Whitelist các trường được phép update trong bảng instructor (dbver3)
    const allowedFields = [
      "FullName",
      "DateOfBirth",
      "ProfilePicture",
      "Job",
      "Address",
      "CV",
      "Major",
      "InstructorFee",
      // AccID không được update qua đây (phải thông qua account)
      // Email, Phone không có trong bảng instructor (nằm trong account)
    ];

    // Lọc chỉ các trường hợp lệ
    const filteredData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Nếu không có trường nào hợp lệ, return current data
    if (Object.keys(filteredData).length === 0) {
      return await this.findById(id);
    }

    const fields = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE instructor SET ${setClause} WHERE InstructorID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM instructor WHERE InstructorID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM instructor WHERE InstructorID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  // Lấy giảng viên kèm danh sách khóa học (courses) - dbver5
  async findByIdWithCourses(instructorId) {
    const query = `
      SELECT 
        i.*,
        a.Username,
        a.Email,
        a.Phone,
        c.CourseID,
        c.Title as CourseTitle,
        c.Description as CourseDescription,
        c.Duration as CourseDuration,
        c.Status as CourseStatus,
        c.Level as CourseLevel,
        c.Code as CourseCode
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      LEFT JOIN course c ON c.InstructorID = i.InstructorID
      WHERE i.InstructorID = ?
      ORDER BY c.CourseID DESC
    `;

    const [rows] = await pool.execute(query, [instructorId]);
    if (rows.length === 0) return null;

    // Group courses
    const instructor = {
      InstructorID: rows[0].InstructorID,
      AccID: rows[0].AccID,
      FullName: rows[0].FullName,
      DateOfBirth: rows[0].DateOfBirth,
      ProfilePicture: rows[0].ProfilePicture,
      Job: rows[0].Job,
      Address: rows[0].Address,
      CV: rows[0].CV,
      Major: rows[0].Major,
      InstructorFee: rows[0].InstructorFee,
      Username: rows[0].Username,
      Email: rows[0].Email,
      Phone: rows[0].Phone,
      courses: [],
    };

    rows.forEach((row) => {
      if (row.CourseID) {
        instructor.courses.push({
          CourseID: row.CourseID,
          Title: row.CourseTitle,
          Description: row.CourseDescription,
          Duration: row.CourseDuration,
          Status: row.CourseStatus,
          Level: row.CourseLevel,
          Code: row.CourseCode,
        });
      }
    });

    return instructor;
  }

  // Lấy lịch dạy của giảng viên (sessions)
  async getSchedule(instructorId, startDate = null, endDate = null) {
    let query = `
      SELECT 
        s.SessionID,
        s.Title,
        s.Description,
        s.Date,
        s.ClassID,
        s.InstructorID,
        t.StartTime,
        t.EndTime,
        t.TimeslotID,
        c.Name as ClassName,
        c.Status as ClassStatus
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      WHERE s.InstructorID = ?
    `;

    const params = [instructorId];

    if (startDate) {
      query += ` AND s.Date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND s.Date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY s.Date ASC, t.StartTime ASC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Lấy thống kê giảng viên
  async getStatistics(instructorId) {
    const query = `
      SELECT 
        COUNT(DISTINCT c.ClassID) as totalClasses,
        COUNT(DISTINCT s.SessionID) as totalSessions,
        COUNT(DISTINCT e.LearnerID) as totalLearners,
        COUNT(DISTINCT co.CourseID) as totalCourses
      FROM instructor i
      LEFT JOIN \`class\` c ON c.InstructorID = i.InstructorID
      LEFT JOIN session s ON s.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON e.ClassID = c.ClassID
      LEFT JOIN course co ON co.InstructorID = i.InstructorID
      WHERE i.InstructorID = ?
    `;

    const [rows] = await pool.execute(query, [instructorId]);
    return (
      rows[0] || {
        totalClasses: 0,
        totalSessions: 0,
        totalLearners: 0,
        totalCourses: 0,
      }
    );
  }
}

module.exports = new InstructorRepository();
