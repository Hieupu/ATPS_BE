const connectDB = require("../config/db");

class CourseRepository {
  async getAllCoursesWithDetails() {
    try {
      const db = await connectDB();

      const [rows] = await db.query(`
        SELECT 
          c.CourseID,
          c.Title,
          c.Description,
          c.Duration,
          COALESCE(c.Fee, 0) as TuitionFee,
          c.Status,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          i.Major as InstructorMajor,
          0 as EnrollmentCount,
          0 as AverageRating
        FROM course c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        WHERE c.Status = 'Open'
        ORDER BY c.CourseID DESC
      `);

      return rows;
    } catch (error) {
      console.error("Database error in getAllCoursesWithDetails:", error);
      throw error;
    }
  }

  async searchCourses({
    search = "",
    category = null,
    sort = "newest",
    page = 1,
    pageSize = 10,
  }) {
    try {
      const db = await connectDB();

      const offset =
        (Math.max(1, Number(page)) - 1) * Math.max(1, Number(pageSize));
      const limit = Math.max(1, Number(pageSize));

      const whereClauses = ["c.Status IS NOT NULL"]; // placeholder to simplify AND concatenation
      const params = [];

      if (search) {
        whereClauses.push("(c.Title LIKE ? OR c.Description LIKE ?)");
        const like = `%${search}%`;
        params.push(like, like);
      }
      // Category column may not exist in schema; skip category filter if not supported

      let orderBy = "c.CourseID DESC";
      switch (sort) {
        case "price-low":
          orderBy = "COALESCE(c.Fee, 0) ASC";
          break;
        case "price-high":
          orderBy = "COALESCE(c.Fee, 0) DESC";
          break;
        case "popular":
          orderBy = "EnrollmentCount DESC";
          break;
        case "rating":
          orderBy = "AverageRating DESC";
          break;
        default:
          orderBy = "c.CourseID DESC";
      }

      const whereSql = whereClauses.length
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

      const [items] = await db.query(
        `SELECT 
           c.CourseID,
           c.Title,
           c.Description,
           c.Duration,
           COALESCE(c.Fee, 0) as TuitionFee,
           c.Status as CourseStatus,
           (SELECT COUNT(*) FROM class cl LEFT JOIN enrollment e ON cl.ClassID = e.ClassID AND e.Status='Enrolled' WHERE cl.CourseID = c.CourseID) as EnrollmentCount,
           0 as AverageRating
         FROM course c
         ${whereSql}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countRows] = await db.query(
        `SELECT COUNT(*) as total
         FROM course c
         ${whereSql}`,
        params
      );

      const total = countRows?.[0]?.total || 0;

      return { items, total, page: Number(page), pageSize: Number(pageSize) };
    } catch (error) {
      console.error("Database error in searchCourses:", error);
      throw error;
    }
  }

  async getEnrolledCoursesByLearnerId(learnerId) {
    try {
      const db = await connectDB();

      const [rows] = await db.query(
        `
        SELECT 
          c.CourseID,
          cl.ClassID,
          COALESCE(c.Title, CONCAT('Lớp 1-1: ', i.FullName)) as Title,
          COALESCE(c.Description, 'Lớp học 1-1 với giảng viên') as Description,
          COALESCE(c.Duration, 0) as Duration,
          CASE WHEN cl.Fee IS NOT NULL THEN cl.Fee ELSE COALESCE(c.Fee, 0) END as TuitionFee,
          COALESCE(c.Status, 'Open') as CourseStatus,
          e.EnrollmentID,
          e.EnrollmentDate,
          e.Status as EnrollmentStatus,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          i.Major as InstructorMajor,
          cl.ZoomURL,
          CASE WHEN c.CourseID IS NOT NULL THEN (SELECT COUNT(*) FROM unit u WHERE u.CourseID = c.CourseID) ELSE 0 END as UnitCount,
          (SELECT COUNT(*) FROM enrollment e2 WHERE e2.ClassID = cl.ClassID AND e2.Status = 'Enrolled') as TotalEnrollments
        FROM enrollment e
        INNER JOIN class cl ON e.ClassID = cl.ClassID
        INNER JOIN instructor i ON cl.InstructorID = i.InstructorID
        LEFT JOIN course c ON cl.CourseID = c.CourseID
        WHERE e.LearnerID = ? AND e.Status = 'Enrolled'
        ORDER BY e.EnrollmentDate DESC
      `,
        [learnerId]
      );

      return rows;
    } catch (error) {
      console.error("Database error in getEnrolledCoursesByLearnerId:", error);
      throw error;
    }
  }

  async getLearnerIdByAccountId(accountId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        "SELECT LearnerID FROM learner WHERE AccID = ?",
        [accountId]
      );
      return rows[0]?.LearnerID || null;
    } catch (error) {
      console.error("Database error in getLearnerIdByAccountId:", error);
      throw error;
    }
  }
  async getCourseWithDetails(courseId) {
    try {
      const db = await connectDB();

      const [courseRows] = await db.query(
        `
        SELECT 
          c.CourseID,
          c.Title,
          c.Description,
          c.Duration,
          COALESCE(c.Fee, 0) as TuitionFee,
          c.Status,
          c.InstructorID,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          i.Major as InstructorMajor,
          i.Job as InstructorJob,
          i.Address as InstructorAddress,
          i.CV as InstructorCV
        FROM course c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        WHERE c.CourseID = ?
      `,
        [courseId]
      );

      if (!courseRows.length) {
        console.log(`No course found with ID: ${courseId}`);
        return null;
      }

      const course = courseRows[0];

      const [unitRows] = await db.query(
        "SELECT COUNT(*) as UnitCount FROM unit WHERE CourseID = ?",
        [courseId]
      );

      const [units] = await db.query(
        `
        SELECT UnitID, Title, Description, Duration
        FROM unit 
        WHERE CourseID = ?
        ORDER BY UnitID
      `,
        [courseId]
      );

      let reviews = [];
      try {
        const [reviewRows] = await db.query(
          `
          SELECT 
            ir.Comment,
            ir.ReviewDate,
            l.FullName as LearnerName,
            l.ProfilePicture as LearnerAvatar
          FROM instructorreview ir
          LEFT JOIN learner l ON ir.LearnerID = l.LearnerID
          WHERE ir.InstructorID = ?
          ORDER BY ir.ReviewDate DESC
          LIMIT 10
        `,
          [course.InstructorID]
        );
        reviews = reviewRows;
        console.log(`Found ${reviews.length} reviews`);
      } catch (reviewError) {
        console.log("No reviews found:", reviewError.message);
      }

      const instructorStats = await this.getInstructorStats(
        course.InstructorID
      );

      return {
        ...course,
        EnrollmentCount: 0,
        UnitCount: unitRows[0]?.UnitCount || 0,
        ...instructorStats,
        Units: units,
        Reviews: reviews,
        AverageRating: 0,
        ReviewCount: reviews.length,
      };
    } catch (error) {
      console.error("Database error in getCourseWithDetails:", error);
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

      return {
        TotalCourses: courseCount[0]?.count || 0,
        TotalStudents: studentCount[0]?.count || 0,
      };
    } catch (error) {
      console.error("Database error in getInstructorStats:", error);
      return {
        TotalCourses: 0,
        TotalStudents: 0,
      };
    }
  }
  async getClassesByCourse(courseId) {
    try {
      const db = await connectDB();

      const [rows] = await db.query(
        `SELECT 
          cl.ClassID,
          cl.Name as ClassName,
          cl.ZoomURL,
          cl.Status,
          cl.InstructorID,
          i.FullName as InstructorName,
          (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = cl.ClassID AND e.Status = 'Enrolled') as StudentCount,
          COUNT(DISTINCT se.SessionID) as TotalSessions
         FROM class cl
         INNER JOIN instructor i ON cl.InstructorID = i.InstructorID
         LEFT JOIN session se ON cl.ClassID = se.ClassID
         WHERE cl.CourseID = ? AND cl.Status = 'active'
         GROUP BY cl.ClassID, cl.Name, cl.ZoomURL, cl.Status, cl.InstructorID, i.FullName
         ORDER BY cl.ClassID`,
        [courseId]
      );

      return rows;
    } catch (error) {
      console.error("Database error in getClassesByCourse:", error);
      throw error;
    }
  }

  async getCourseCurriculum(courseId) {
    try {
      const db = await connectDB();

      // Lấy danh sách Units của course
      const [units] = await db.query(
        `
        SELECT UnitID, Title, Description, Duration
        FROM unit
        WHERE CourseID = ?
        ORDER BY UnitID
      `,
        [courseId]
      );

      if (!units.length) {
        return [];
      }

      const unitIds = units.map((u) => u.UnitID);

      // Lấy tất cả lessons thuộc các unit trên
      const [lessons] = await db.query(
        `
        SELECT LessonID, Title, Time, Type, FileURL, UnitID
        FROM lesson
        WHERE UnitID IN (${unitIds.map(() => "?").join(",")})
        ORDER BY LessonID
      `,
        unitIds
      );

      // Gom bài học theo UnitID
      const unitIdToLessons = lessons.reduce((acc, lesson) => {
        if (!acc[lesson.UnitID]) acc[lesson.UnitID] = [];
        acc[lesson.UnitID].push({
          LessonID: lesson.LessonID,
          Title: lesson.Title,
          Time: lesson.Time,
          Type: lesson.Type,
          FileURL: lesson.FileURL,
        });
        return acc;
      }, {});

      // Trả về mảng units kèm lessons
      return units.map((u) => ({
        UnitID: u.UnitID,
        Title: u.Title,
        Description: u.Description,
        Duration: u.Duration,
        Lessons: unitIdToLessons[u.UnitID] || [],
      }));
    } catch (error) {
      console.error("Database error in getCourseCurriculum:", error);
      throw error;
    }
  }

  async createEnrollment(learnerId, classId) {
    try {
      const db = await connectDB();

      const [learner] = await db.query(
        "SELECT * FROM learner WHERE LearnerID = ?",
        [learnerId]
      );

      if (!learner.length) {
        throw new Error("Learner not found");
      }

      const [classData] = await db.query(
        "SELECT cl.*, c.Title as CourseTitle FROM class cl LEFT JOIN course c ON cl.CourseID = c.CourseID WHERE cl.ClassID = ? AND cl.Status = 'active'",
        [classId]
      );

      if (!classData.length) {
        throw new Error("Class not found or not available for enrollment");
      }

      const [existing] = await db.query(
        "SELECT * FROM enrollment WHERE LearnerID = ? AND ClassID = ? AND Status IN ('Enrolled','Pending')",
        [learnerId, classId]
      );

      if (existing.length) {
        const status = existing[0].Status;
        if (status === "Enrolled") {
          throw new Error("Already enrolled in this class");
        }
        throw new Error("You already have a pending enrollment for this class");
      }

      // Generate unique numeric OrderCode 15 digits (<= 9007199254740991)
      const genOrderCode = () => {
        const base = Date.now(); // 13 digits
        const rand = Math.floor(Math.random() * 90) + 10; // 2 digits (10-99)
        const code = Number(`${base}${rand}`);
        return Math.min(code, 9007199254740991);
      };

      let orderCode = genOrderCode();
      // Try a few times to avoid rare collision in dev
      for (let i = 0; i < 3; i++) {
        // Optional: ensure uniqueness by checking existing
        const [exists] = await db.query(
          "SELECT 1 FROM enrollment WHERE OrderCode = ? LIMIT 1",
          [orderCode]
        );
        if (!exists.length) break;
        orderCode = genOrderCode();
      }

      const [result] = await db.query(
        "INSERT INTO enrollment (LearnerID, ClassID, EnrollmentDate, Status, OrderCode) VALUES (?, ?, NOW(), 'Pending', ?)",
        [learnerId, classId, orderCode]
      );

      return {
        EnrollmentID: result.insertId,
        LearnerID: learnerId,
        ClassID: classId,
        EnrollmentDate: new Date(),
        Status: "Pending",
        OrderCode: orderCode,
      };
    } catch (error) {
      console.error("Database error in createEnrollment:", error);
      throw error;
    }
  }

  async getPopularCourses() {
    try {
      const db = await connectDB();

      const [rows] = await db.query(`
        SELECT 
          c.CourseID,
          c.Title,
          c.Description,
          c.Duration,
          COALESCE(c.Fee, 0) as TuitionFee,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          0 as EnrollmentCount
        FROM course c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        WHERE c.Status = 'Open'
        ORDER BY c.CourseID DESC
        LIMIT 6
      `);

      return rows;
    } catch (error) {
      console.error("Database error in getPopularCourses:", error);
      throw error;
    }
  }

  async getAllCoursesAdmin() {
    try {
      const db = await connectDB();

      const [rows] = await db.query(`
        SELECT 
          c.CourseID,
          c.Title,
          c.Description,
          c.Duration,
          COALESCE(c.Fee, 0) as TuitionFee,
          c.Status,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          i.Major as InstructorMajor
        FROM course c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        ORDER BY c.CourseID DESC
      `);

      return rows;
    } catch (error) {
      console.error("Database error in getAllCoursesAdmin:", error);
      throw error;
    }
  }
}

module.exports = new CourseRepository();
