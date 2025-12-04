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

    const offset = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(pageSize));
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
    if (type && ["fulltime", "parttime", "fulltime_tutor", "parttime_tutor"].includes(type)) {
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
      const validTimeslotIds = timeslots.map(id => parseInt(id)).filter(id => !isNaN(id));
      
      if (validTimeslotIds.length > 0) {
        // Calculate next week's dates
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
        
        const nextWeekDates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(nextMonday);
          date.setDate(nextMonday.getDate() + i);
          nextWeekDates.push(date.toISOString().split('T')[0]);
        }

        const timeslotPlaceholders = validTimeslotIds.map(() => '?').join(',');
        const datePlaceholders = nextWeekDates.map(() => '?').join(',');
        
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
    const processedItems = items.map(item => ({
      ...item,
      Certificates: item.Certificates ? item.Certificates.split('|') : [],
      InstructorFee: Number(item.InstructorFee) || 0 // Giữ nguyên giá trị VND từ database
    }));

    console.log("Filtered instructors count:", items.length);
    console.log("Instructor fees (VND):", processedItems.map(i => i.InstructorFee));

    return { items: processedItems, total, page: Number(page), pageSize: Number(pageSize) };
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
        "SELECT COUNT(*) as count FROM course WHERE InstructorID = ? AND Status = 'Open'",
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
}

module.exports = new InstructorRepository();
