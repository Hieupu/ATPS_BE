const connectDB = require("../config/db");

class InstructorRepository {
  async getAllInstructors() {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.DateOfBirth,
          i.ProfilePicture,
          i.Job,
          i.Address,
          i.CV,
          i.Major,
          i.AccID,
          a.Email,
          a.Username,
          a.Phone,
          COUNT(DISTINCT c.CourseID) as TotalCourses,
          COUNT(DISTINCT e.LearnerID) as TotalStudents
        FROM instructor i
        INNER JOIN account a ON i.AccID = a.AccID
        LEFT JOIN course c ON i.InstructorID = c.InstructorID
        LEFT JOIN enrollment e ON c.CourseID = (
          SELECT cl.CourseID FROM class cl WHERE cl.ClassID = e.ClassID
        )
        GROUP BY i.InstructorID, i.FullName, i.DateOfBirth, i.ProfilePicture, 
                 i.Job, i.Address, i.CV, i.Major, i.AccID, a.Email, a.Username, a.Phone
        ORDER BY i.InstructorID DESC`
      );
      return rows;
    } catch (error) {
      console.error("Database error in getAllInstructors:", error);
      throw error;
    }
  }

  // Hàm riêng cho admin - có Status và Gender từ account table
  async getAllInstructorsAdmin() {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.DateOfBirth,
          i.ProfilePicture,
          i.Job,
          i.Address,
          i.CV,
          i.Major,
          i.AccID,
          i.Type,
          i.InstructorFee,
          a.Email,
          a.Username,
          a.Phone,
          a.Status AS AccountStatus,
          a.Gender AS AccountGender,
          (SELECT COUNT(DISTINCT c.CourseID) 
             FROM course c 
             WHERE c.InstructorID = i.InstructorID AND c.Status = 'PUBLISHED') AS TotalCourses,
          (SELECT COUNT(DISTINCT e.LearnerID) 
             FROM enrollment e 
             JOIN class cl ON e.ClassID = cl.ClassID 
             JOIN course c ON cl.CourseID = c.CourseID 
             WHERE c.InstructorID = i.InstructorID AND e.Status = 'enrolled') AS TotalStudents,
          (SELECT GROUP_CONCAT(cert.Title SEPARATOR '|') 
             FROM certificate cert 
             WHERE cert.InstructorID = i.InstructorID AND cert.Status = 'active') AS Certificates,
          (SELECT GROUP_CONCAT(cert.Status SEPARATOR '|') 
             FROM certificate cert 
             WHERE cert.InstructorID = i.InstructorID) AS CertificateStatuses
        FROM instructor i
        INNER JOIN account a ON i.AccID = a.AccID
        GROUP BY i.InstructorID, i.FullName, i.DateOfBirth, i.ProfilePicture, 
                 i.Job, i.Address, i.CV, i.Major, i.AccID, i.Type, i.InstructorFee,
                 a.Email, a.Username, a.Phone, a.Status, a.Gender
        ORDER BY i.InstructorID DESC`
      );
      // Chuẩn hóa Certificates thành mảng và fee về số
      // Map AccountStatus và AccountGender thành Status và Gender để frontend dễ sử dụng
      return rows.map((row) => {
        // Parse certificate statuses
        // "Đã có" khi có ít nhất một chứng chỉ APPROVED
        // "Chưa có" khi không có chứng chỉ nào, hoặc chỉ có PENDING/REJECTED
        let hasApprovedCertificate = false;
        if (row.CertificateStatuses) {
          const statuses = row.CertificateStatuses.split("|");
          hasApprovedCertificate = statuses.includes("APPROVED");
        }
        
        return {
          ...row,
          Status: row.AccountStatus, // Map từ AccountStatus
          Gender: row.AccountGender, // Map từ AccountGender
          Certificates: row.Certificates ? row.Certificates.split("|") : [],
          HasApprovedCertificate: hasApprovedCertificate, // Có chứng chỉ đã duyệt hay không
          InstructorFee: Number(row.InstructorFee) || 0,
        };
      });
    } catch (error) {
      console.error("Database error in getAllInstructorsAdmin:", error);
      throw error;
    }
  }

  async searchInstructors({
    search = "",
    major = null,
    type = null,
    timeslots = [],
    minFee = 0,
    maxFee = 1000000,
    page = 1,
    pageSize = 10,
  }) {
    try {
      const db = await connectDB();

      const offset =
        (Math.max(1, Number(page)) - 1) * Math.max(1, Number(pageSize));
      const limit = Math.max(1, Number(pageSize));

      const whereClauses = ["1=1"];
      const params = [];

      if (search) {
        const like = `%${search}%`;
        whereClauses.push(
          "(i.FullName LIKE ? OR i.Job LIKE ? OR i.Major LIKE ?)"
        );
        params.push(like, like, like);
      }
      if (major) {
        whereClauses.push("i.Major = ?");
        params.push(major);
      }
      if (
        type &&
        ["fulltime", "parttime", "fulltime_tutor", "parttime_tutor"].includes(
          type
        )
      ) {
        whereClauses.push("i.Type = ?");
        params.push(type);
      }

      // SỬA LẠI: KHÔNG cần chia cho 1000 vì database đã lưu giá trị VND thực tế
      const shouldFilterByFee = !(minFee === 0 && maxFee === 1000000);

      if (shouldFilterByFee) {
        // SỬA: Dùng trực tiếp minFee, maxFee vì database đã lưu VND
        whereClauses.push("i.InstructorFee >= ? AND i.InstructorFee <= ?");
        params.push(Number(minFee), Number(maxFee));

        console.log(`Filtering fee: ${minFee} - ${maxFee} VND`);
      }

      // Multiple timeslots filtering (giữ nguyên)
      if (timeslots && timeslots.length > 0) {
        const validTimeslotIds = timeslots
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));

        if (validTimeslotIds.length > 0) {
          // Calculate next week's dates
          const today = new Date();
          const nextMonday = new Date(today);
          nextMonday.setDate(
            today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7)
          );

          const nextWeekDates = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(nextMonday);
            date.setDate(nextMonday.getDate() + i);
            nextWeekDates.push(date.toISOString().split("T")[0]);
          }

          const timeslotPlaceholders = validTimeslotIds
            .map(() => "?")
            .join(",");
          const datePlaceholders = nextWeekDates.map(() => "?").join(",");

          whereClauses.push(`i.InstructorID IN (
          SELECT DISTINCT its.InstructorID 
          FROM instructortimeslot its 
          WHERE its.TimeslotID IN (${timeslotPlaceholders})
          AND its.Date IN (${datePlaceholders})
          AND its.Status = 'available'
        )`);

          params.push(...validTimeslotIds, ...nextWeekDates);
        }
      }

      const whereSql = whereClauses.length
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

      console.log("SQL Query:", `SELECT ... FROM instructor i ${whereSql}`);
      console.log("SQL Params:", params);
      console.log("Fee range (VND):", { minFee, maxFee });
      console.log("Should filter by fee:", shouldFilterByFee);

      const [items] = await db.query(
        `SELECT 
         i.InstructorID,
         i.FullName,
         i.ProfilePicture,
         i.Major,
         i.Job,
         i.Type,
         i.InstructorFee,
         (SELECT COUNT(DISTINCT c.CourseID) FROM course c WHERE c.InstructorID = i.InstructorID AND c.Status='PUBLISHED') as TotalCourses,
         (SELECT COUNT(DISTINCT e.LearnerID) FROM enrollment e JOIN class cl ON e.ClassID = cl.ClassID JOIN course c ON cl.CourseID = c.CourseID WHERE c.InstructorID = i.InstructorID AND e.Status='enrolled') as TotalStudents,
         (SELECT GROUP_CONCAT(cert.Title SEPARATOR '|') FROM certificate cert WHERE cert.InstructorID = i.InstructorID AND cert.Status = 'active') as Certificates
       FROM instructor i
       ${whereSql}
       ORDER BY i.InstructorID DESC
       LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countRows] = await db.query(
        `SELECT COUNT(*) as total FROM instructor i ${whereSql}`,
        params
      );

      const total = countRows?.[0]?.total || 0;

      // SỬA LẠI: KHÔNG nhân 1000 nữa, dùng trực tiếp giá trị từ database
      const processedItems = items.map((item) => ({
        ...item,
        Certificates: item.Certificates ? item.Certificates.split("|") : [],
        InstructorFee: Number(item.InstructorFee) || 0, // Giữ nguyên giá trị VND từ database
      }));

      console.log("Filtered instructors count:", items.length);
      console.log(
        "Instructor fees (VND):",
        processedItems.map((i) => i.InstructorFee)
      );

      return {
        items: processedItems,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      };
    } catch (error) {
      console.error("Database error in searchInstructors:", error);
      throw error;
    }
  }
  async getInstructorReviews(instructorId, limit = 20) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
           ir.Comment,
           ir.ReviewDate,
           l.FullName as LearnerName,
           l.ProfilePicture as LearnerAvatar
         FROM instructorreview ir
         LEFT JOIN learner l ON ir.LearnerID = l.LearnerID
         WHERE ir.InstructorID = ?
         ORDER BY ir.ReviewDate DESC
         LIMIT ?`,
        [instructorId, Number(limit) || 20]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getInstructorReviews:", error);
      return [];
    }
  }

  async getInstructorById(instructorId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.DateOfBirth,
          i.ProfilePicture,
          i.Job,
          i.Address,
          i.CV,
          i.Major,
          i.AccID,
          i.InstructorFee,
          a.Email,
          a.Username,
          a.Phone
        FROM instructor i
        INNER JOIN account a ON i.AccID = a.AccID
        WHERE i.InstructorID = ?`,
        [instructorId]
      );

      if (!rows.length) {
        return null;
      }

      const instructor = rows[0];

      const [courseRows] = await db.query(
        `SELECT 
          c.CourseID,
          c.Title,
          c.Description,
          c.Duration,
          c.Status,
          c.Image
        FROM course c
        WHERE c.InstructorID = ?
        ORDER BY c.CourseID DESC`,
        [instructorId]
      );

      const [certRows] = await db.query(
        `SELECT CertificateID, Title, FileURL
        FROM certificate
        WHERE InstructorID = ?
        ORDER BY CertificateID DESC`,
        [instructorId]
      );

      return {
        ...instructor,
        Courses: courseRows,
        Certificates: certRows,
      };
    } catch (error) {
      console.error("Database error in getInstructorById:", error);
      throw error;
    }
  }

  // Hàm riêng cho admin - có Status và Gender từ account table
  async getInstructorByIdAdmin(instructorId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.DateOfBirth,
          i.ProfilePicture,
          i.Job,
          i.Address,
          i.CV,
          i.Major,
          i.AccID,
          i.Type,
          i.InstructorFee,
          a.Email,
          a.Username,
          a.Phone,
          a.Status AS AccountStatus,
          a.Gender AS AccountGender
        FROM instructor i
        INNER JOIN account a ON i.AccID = a.AccID
        WHERE i.InstructorID = ?`,
        [instructorId]
      );

      if (!rows.length) {
        return null;
      }

      const instructor = rows[0];

      const [courseRows] = await db.query(
        `SELECT 
          c.CourseID,
          c.Title,
          c.Description,
          c.Duration,
          c.Status
        FROM course c
        WHERE c.InstructorID = ?
        ORDER BY c.CourseID DESC`,
        [instructorId]
      );

      const [certRows] = await db.query(
        `SELECT CertificateID, Title, FileURL
        FROM certificate
        WHERE InstructorID = ?
        ORDER BY CertificateID DESC`,
        [instructorId]
      );

      return {
        ...instructor,
        Status: instructor.AccountStatus, // Map từ AccountStatus
        Gender: instructor.AccountGender, // Map từ AccountGender
        Courses: courseRows,
        Certificates: certRows,
      };
    } catch (error) {
      console.error("Database error in getInstructorByIdAdmin:", error);
      throw error;
    }
  }

  async getInstructorIdByAccountId(accountId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        "SELECT InstructorID FROM instructor WHERE AccID = ?",
        [accountId]
      );
      return rows[0]?.InstructorID || null;
    } catch (error) {
      console.error("Database error in getInstructorIdByAccountId:", error);
      throw error;
    }
  }

  async getInstructorStats(instructorId) {
    try {
      const db = await connectDB();

      const [courseCount] = await db.query(
        "SELECT COUNT(*) as count FROM course WHERE InstructorID = ? AND Status = 'PUBLISHED'",
        [instructorId]
      );

      const [studentCount] = await db.query(
        `SELECT COUNT(DISTINCT e.LearnerID) as count 
         FROM enrollment e
         INNER JOIN class cl ON e.ClassID = cl.ClassID
         WHERE cl.InstructorID = ? AND e.Status = 'Enrolled'`,
        [instructorId]
      );

      const [certCount] = await db.query(
        "SELECT COUNT(*) as count FROM certificate WHERE InstructorID = ?",
        [instructorId]
      );

      return {
        TotalCourses: courseCount[0]?.count || 0,
        TotalStudents: studentCount[0]?.count || 0,
        TotalCertificates: certCount[0]?.count || 0,
      };
    } catch (error) {
      console.error("Database error in getInstructorStats:", error);
      return {
        TotalCourses: 0,
        TotalStudents: 0,
        TotalCertificates: 0,
      };
    }
  }

  async getPopularInstructors(limit = 6) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.ProfilePicture,
          i.Major,
          i.Job,
          COUNT(DISTINCT e.LearnerID) as TotalStudents,
          COUNT(DISTINCT c.CourseID) as TotalCourses
        FROM instructor i
        LEFT JOIN course c ON i.InstructorID = c.InstructorID
        LEFT JOIN enrollment e ON c.CourseID = (
          SELECT cl.CourseID FROM class cl WHERE cl.ClassID = e.ClassID
        )
        GROUP BY i.InstructorID, i.FullName, i.ProfilePicture, i.Major, i.Job
        ORDER BY TotalStudents DESC, TotalCourses DESC
        LIMIT ?`,
        [limit]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getPopularInstructors:", error);
      throw error;
    }
  }

  async getFeaturedInstructors(limit = 4) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.ProfilePicture,
          i.Major,
          i.Job,
          COUNT(DISTINCT c.CourseID) as TotalCourses,
          COUNT(DISTINCT e.LearnerID) as TotalStudents
        FROM instructor i
        LEFT JOIN course c ON i.InstructorID = c.InstructorID AND c.Status = 'PUBLISHED'
        LEFT JOIN class cl ON c.CourseID = cl.CourseID
        LEFT JOIN enrollment e ON cl.ClassID = e.ClassID AND e.Status = 'enrolled'
        GROUP BY i.InstructorID, i.FullName, i.ProfilePicture, i.Major, i.Job
        ORDER BY RAND()
        LIMIT ?`,
        [limit]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getFeaturedInstructors:", error);
      throw error;
    }
  }
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
      Type,
      CV,
    } = instructorData;

    const query = `
      INSERT INTO instructor (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address, Major, InstructorFee, Type, CV)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const db = await connectDB();
    const [result] = await db.execute(query, [
      AccID,
      FullName,
      DateOfBirth,
      ProfilePicture,
      Job,
      Address,
      Major,
      InstructorFee,
      Type || "parttime",
      CV || null,
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

    const db = await connectDB();
    const [rows] = await db.execute(query, [id]);
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

    const db = await connectDB();
    const [rows] = await db.execute(query, [accountId]);
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
    const db = await connectDB();
    const [rows] = await db.execute(query);
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

    const db = await connectDB();
    const [rows] = await db.execute(query, [major]);
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
    const db = await connectDB();
    const [result] = await db.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM instructor WHERE InstructorID = ?`;
    const db = await connectDB();
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM instructor WHERE InstructorID = ?`;
    const db = await connectDB();
    const [rows] = await db.execute(query, [id]);
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
      LEFT JOIN course c ON c.InstructorID = i.InstructorID AND c.Status = 'PUBLISHED'
      WHERE i.InstructorID = ?
      ORDER BY c.CourseID DESC
    `;

    console.log(
      `[instructorRepository] findByIdWithCourses - InstructorID: ${instructorId}, Type: ${typeof instructorId}`
    );
    const db = await connectDB();
    const [rows] = await db.execute(query, [instructorId]);
    console.log(
      `[instructorRepository] Query result rows count: ${rows.length}`
    );

    // Debug: Kiểm tra xem có courses nào (kể cả không PUBLISHED) cho instructor này không
    const [allCourses] = await db.execute(
      `SELECT CourseID, Title, Status, InstructorID FROM course WHERE InstructorID = ?`,
      [instructorId]
    );
    console.log(
      `[instructorRepository] All courses for instructor ${instructorId}:`,
      allCourses
    );
    console.log(
      `[instructorRepository] Courses with PUBLISHED status:`,
      allCourses.filter((c) => c.Status === "PUBLISHED")
    );

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

    console.log(
      `[instructorRepository] Final instructor object with ${instructor.courses.length} PUBLISHED courses`
    );
    console.log(`[instructorRepository] Courses:`, instructor.courses);

    return instructor;
  }

  // Lấy lịch dạy của giảng viên (sessions)
  // Logic mới: Phân biệt fulltime và parttime
  // - Fulltime: Mặc định full ca T2-T7, chỉ check session và HOLIDAY
  // - Parttime: Chỉ dạy các ca có Status='AVAILABLE' trong instructortimeslot
  async getSchedule(
    instructorId,
    startDate = null,
    endDate = null,
    instructorType = null
  ) {
    // Lấy Type nếu chưa có
    if (!instructorType) {
      const instructor = await this.findById(instructorId);
      instructorType = instructor?.Type || "parttime";
    }

    // UNION cả sessions và instructortimeslot để có đầy đủ lịch bận
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
        t.Day,
        c.Name as ClassName,
        c.Status as ClassStatus,
        'SESSION' as SourceType,
        NULL as Status
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

    // UNION với instructortimeslot - Logic khác nhau theo Type
    if (instructorType === "fulltime") {
      // Fulltime: Chỉ lấy HOLIDAY (mặc định full ca T2-T7, không cần check AVAILABLE)
      query += `
        UNION ALL
        SELECT 
          NULL as SessionID,
          NULL as Title,
          NULL as Description,
          it.Date,
          NULL as ClassID,
          it.InstructorID,
          t.StartTime,
          t.EndTime,
          it.TimeslotID,
          t.Day,
          NULL as ClassName,
          NULL as ClassStatus,
          'INSTRUCTORTIMESLOT' as SourceType,
          it.Status
        FROM instructortimeslot it
        LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
        WHERE it.InstructorID = ?
          AND UPPER(it.Status) = 'HOLIDAY'
      `;
    } else {
      // Parttime: Lấy AVAILABLE (các ca đã chọn), HOLIDAY, và CLOSE (đã book)
      query += `
        UNION ALL
        SELECT 
          NULL as SessionID,
          NULL as Title,
          NULL as Description,
          it.Date,
          NULL as ClassID,
          it.InstructorID,
          t.StartTime,
          t.EndTime,
          it.TimeslotID,
          t.Day,
          NULL as ClassName,
          NULL as ClassStatus,
          'INSTRUCTORTIMESLOT' as SourceType,
          it.Status
        FROM instructortimeslot it
        LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
        WHERE it.InstructorID = ?
          AND UPPER(it.Status) IN ('AVAILABLE', 'HOLIDAY', 'CLOSE')
      `;
    }

    params.push(instructorId);
    if (startDate) {
      query += ` AND it.Date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND it.Date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY Date ASC, StartTime ASC`;

    const db = await connectDB();
    const [rows] = await db.execute(query, params);
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

    const db = await connectDB();
    const [rows] = await db.execute(query, [instructorId]);
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
