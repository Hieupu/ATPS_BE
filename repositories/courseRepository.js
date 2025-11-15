const connectDB = require("../config/db");

class CourseRepository {
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

      const whereClauses = ["c.Status = 'PUBLISHED'"];
      const params = [];

      // Search in title and description
      if (search && search.trim()) {
        whereClauses.push("(c.Title LIKE ? OR c.Description LIKE ?)");
        const like = `%${search}%`;
        params.push(like, like);
      }

      // Filter by level if provided (using category parameter as level)
      if (
        category &&
        ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(
          category.toUpperCase()
        )
      ) {
        whereClauses.push("c.Level = ?");
        params.push(category.toUpperCase());
      }

      // Determine sort order
      let orderBy = "c.CourseID DESC";
      switch (sort) {
        case "price-low":
          orderBy = "MinFee ASC";
          break;
        case "price-high":
          orderBy = "MinFee DESC";
          break;
        case "popular":
          orderBy = "EnrollmentCount DESC";
          break;
        case "rating":
          orderBy = "ReviewCount DESC"; // Sửa thành ReviewCount thay vì AverageRating
          break;
        case "newest":
        default:
          orderBy = "c.CourseID DESC";
      }

      const whereSql = whereClauses.length
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

      // Main query với các trường đúng theo database mới
      const [items] = await db.query(
        `SELECT 
         c.CourseID,
         c.Title,
         c.Description,
         c.Duration,
         c.Image as CourseImage,
         c.Level,
         c.Status as CourseStatus,
         c.Code,
         i.InstructorID,
         i.FullName as InstructorName,
         i.ProfilePicture as InstructorAvatar,
         i.Major as InstructorMajor,
         -- Get minimum fee from available classes
         COALESCE(
           (SELECT MIN(cl.Fee) 
            FROM class cl 
            WHERE cl.CourseID = c.CourseID AND cl.Status = 'active'
           ), 0
         ) as TuitionFee,
         COALESCE(
           (SELECT MIN(cl.Fee) 
            FROM class cl 
            WHERE cl.CourseID = c.CourseID AND cl.Status = 'active'
           ), 0
         ) as MinFee,
         -- Count enrolled students
         COALESCE(
           (SELECT COUNT(DISTINCT e.LearnerID) 
            FROM class cls
            LEFT JOIN enrollment e ON cls.ClassID = e.ClassID 
              AND e.Status = 'enrolled'
            WHERE cls.CourseID = c.CourseID
           ), 0
         ) as EnrollmentCount,
         -- Count reviews instead of average rating (vì không có cột Rating)
         COALESCE(
           (SELECT COUNT(*)
            FROM instructorreview ir2
            WHERE ir2.InstructorID = i.InstructorID 
              AND ir2.Status = 'approved'
           ), 0
         ) as ReviewCount,
         -- Count available classes
         COALESCE(
           (SELECT COUNT(*) 
            FROM class cl 
            WHERE cl.CourseID = c.CourseID AND cl.Status = 'active'
           ), 0
         ) as AvailableClasses
       FROM course c
       INNER JOIN instructor i ON c.InstructorID = i.InstructorID
       ${whereSql}
       GROUP BY c.CourseID, c.Title, c.Description, c.Duration, c.Image,
                c.Level, c.Status, c.Code, i.InstructorID, i.FullName,
                i.ProfilePicture, i.Major
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      // Count total matching courses
      const [countRows] = await db.query(
        `SELECT COUNT(DISTINCT c.CourseID) as total
       FROM course c
       INNER JOIN instructor i ON c.InstructorID = i.InstructorID
       ${whereSql}`,
        params
      );

      const total = countRows?.[0]?.total || 0;

      return {
        items,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
      };
    } catch (error) {
      console.error("Database error in searchCourses:", error);
      throw error;
    }
  }

  // Cũng cần sửa hàm getAllCoursesWithDetails để tránh lỗi tương tự
  async getAllCoursesWithDetails() {
    try {
      const db = await connectDB();

      const [rows] = await db.query(`
      SELECT 
        c.CourseID,
        c.Title,
        c.Description,
        c.Duration,
        c.Image,
        c.Level,
        c.Status,
        c.Code,
        i.InstructorID,
        i.FullName as InstructorName,
        i.ProfilePicture as InstructorAvatar,
        i.Major as InstructorMajor,
        -- Get minimum fee from available classes
        COALESCE(MIN(cl.Fee), 0) as TuitionFee,
        -- Count enrolled students across all classes
        COALESCE(SUM(
          (SELECT COUNT(*) 
           FROM enrollment e 
           WHERE e.ClassID = cl.ClassID 
           AND e.Status = 'enrolled')
        ), 0) as EnrollmentCount,
        -- Count reviews instead of average rating
        COALESCE(
          (SELECT COUNT(*)
           FROM instructorreview ir 
           WHERE ir.InstructorID = i.InstructorID 
           AND ir.Status = 'approved'
          ), 0
        ) as ReviewCount
      FROM course c
      INNER JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN class cl ON c.CourseID = cl.CourseID
      WHERE c.Status = 'PUBLISHED'
      GROUP BY c.CourseID, c.Title, c.Description, c.Duration, c.Image, 
               c.Level, c.Status, c.Code, i.InstructorID, i.FullName, 
               i.ProfilePicture, i.Major
      ORDER BY c.CourseID DESC
    `);

      return rows;
    } catch (error) {
      console.error("Database error in getAllCoursesWithDetails:", error);
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
        c.Title,
        c.Description,
        c.Duration,
        c.Image,
        c.Level,
        c.Status as CourseStatus,
        cl.Fee as TuitionFee,
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status as EnrollmentStatus,
        i.InstructorID,
        i.FullName as InstructorName,
        i.ProfilePicture as InstructorAvatar,
        i.Major as InstructorMajor,
        cl.ZoomURL,
        cl.Name as ClassName,
        (SELECT COUNT(*) FROM unit u WHERE u.CourseID = c.CourseID AND u.Status = 'VISIBLE') as UnitCount,
        (SELECT COUNT(*) FROM enrollment e2 WHERE e2.ClassID = cl.ClassID AND e2.Status = 'enrolled') as TotalEnrollments
      FROM enrollment e
      INNER JOIN class cl ON e.ClassID = cl.ClassID
      INNER JOIN instructor i ON cl.InstructorID = i.InstructorID
      INNER JOIN course c ON cl.CourseID = c.CourseID
      WHERE e.LearnerID = ? AND e.Status = 'enrolled'
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

async getPopularClasses() {
  try {
    const db = await connectDB();
    const [rows] = await db.query(`
      SELECT 
        cl.ClassID,
        cl.Name as ClassName,
        cl.Status,
        cl.Fee,
        cl.Opendate,
        cl.Numofsession,
        cl.Maxstudent as MaxStudents,
        c.CourseID,
        c.Image as Image,
        c.Title as CourseTitle,
        i.InstructorID,
        i.FullName as InstructorName,
        i.ProfilePicture as InstructorAvatar,
        COUNT(e.EnrollmentID) as CurrentStudents
      FROM class cl
      INNER JOIN course c ON cl.CourseID = c.CourseID
      INNER JOIN instructor i ON cl.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON cl.ClassID = e.ClassID AND e.Status = 'enrolled'
      WHERE cl.Status = 'active'
      GROUP BY 
        cl.ClassID, cl.Name, cl.Status, cl.Fee, cl.Opendate, 
        cl.Numofsession, cl.Maxstudent, c.CourseID, c.Title,
        i.InstructorID, i.FullName, i.ProfilePicture
      ORDER BY cl.Opendate DESC
      LIMIT 6
    `);
    return rows;
  } catch (error) {
    console.error("Database error in getPopularClasses:", error);
    throw error;
  }
}

  async getLearnerByAccountId(accountId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        "SELECT LearnerID, FullName, DateOfBirth, ProfilePicture, Job, Address, AccID FROM learner WHERE AccID = ?",
        [accountId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Database error in getLearnerByAccountId:", error);
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
        c.Image,
        c.Level,
        c.Status,
        c.Code,
        c.Objectives,
        c.Requirements,
        i.InstructorID,
        i.FullName as InstructorName,
        i.ProfilePicture as InstructorAvatar,
        i.Major as InstructorMajor,
        i.Job as InstructorJob,
        i.Address as InstructorAddress,
        i.CV as InstructorCV,
        i.Type as InstructorType
      FROM course c
      INNER JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE c.CourseID = ? AND c.Status = 'PUBLISHED'
    `,
        [courseId]
      );

      if (!courseRows.length) {
        return null;
      }

      const course = courseRows[0];

      // Lấy số lượng unit
      const [unitRows] = await db.query(
        "SELECT COUNT(*) as UnitCount FROM unit WHERE CourseID = ? AND Status = 'VISIBLE'",
        [courseId]
      );

      // Lấy danh sách unit
      const [units] = await db.query(
        `
      SELECT UnitID, Title, Description, Duration, OrderIndex
      FROM unit 
      WHERE CourseID = ? AND Status = 'VISIBLE'
      ORDER BY OrderIndex
    `,
        [courseId]
      );

      // Lấy đánh giá instructor
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
        WHERE ir.InstructorID = ? AND ir.Status = 'approved'
        ORDER BY ir.ReviewDate DESC
        LIMIT 10
      `,
          [course.InstructorID]
        );
        reviews = reviewRows;
      } catch (reviewError) {
        console.log("No reviews found:", reviewError.message);
      }

      const instructorStats = await this.getInstructorStats(
        course.InstructorID
      );

      return {
        ...course,
        UnitCount: unitRows[0]?.UnitCount || 0,
        ...instructorStats,
        Units: units,
        Reviews: reviews,
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

    const [classes] = await db.query(
      `SELECT 
        cl.ClassID,
        cl.CourseID,
        cl.Name as ClassName,
        cl.ZoomURL,
        cl.Status,
        cl.Fee,
        cl.Maxstudent,
        cl.Opendate,
        cl.Enddate,
        cl.Numofsession,
        i.InstructorID,
        i.FullName as InstructorName,
        (SELECT COUNT(*) FROM enrollment e WHERE e.ClassID = cl.ClassID AND e.Status = 'enrolled') as StudentCount,
        COUNT(DISTINCT se.SessionID) as TotalSessions
       FROM class cl
       INNER JOIN instructor i ON cl.InstructorID = i.InstructorID
       LEFT JOIN session se ON cl.ClassID = se.ClassID
       WHERE cl.CourseID = ? AND cl.Status = 'active'
       GROUP BY cl.ClassID, cl.Name, cl.ZoomURL, cl.Status, cl.Fee, cl.Maxstudent, 
                cl.Opendate, cl.Enddate, cl.Numofsession, i.InstructorID, i.FullName
       ORDER BY cl.ClassID`,
      [courseId]
    );

    // Lấy lịch học cố định hàng tuần từ timeslot
    for (let classItem of classes) {
      const [weeklySchedule] = await db.query(
        `SELECT DISTINCT
          t.StartTime,
          t.EndTime,
          t.Day
         FROM session s
         INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
         WHERE s.ClassID = ?
         GROUP BY t.StartTime, t.EndTime, t.Day
         ORDER BY 
           FIELD(t.Day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
           t.StartTime`,
        [classItem.ClassID]
      );

      classItem.weeklySchedule = weeklySchedule;
    }

    return classes;
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
      SELECT UnitID, Title, Description, Duration, OrderIndex
      FROM unit
      WHERE CourseID = ? AND Status = 'VISIBLE'
      ORDER BY OrderIndex
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
      SELECT LessonID, Title, Duration, Type, FileURL, UnitID, OrderIndex, Status
      FROM lesson
      WHERE UnitID IN (${unitIds.map(() => "?").join(",")})
        AND Status = 'VISIBLE'
      ORDER BY OrderIndex
    `,
        unitIds
      );

      // Gom bài học theo UnitID
      const unitIdToLessons = lessons.reduce((acc, lesson) => {
        if (!acc[lesson.UnitID]) acc[lesson.UnitID] = [];
        acc[lesson.UnitID].push({
          LessonID: lesson.LessonID,
          Title: lesson.Title,
          Duration: lesson.Duration,
          Type: lesson.Type,
          FileURL: lesson.FileURL,
          OrderIndex: lesson.OrderIndex,
        });
        return acc;
      }, {});

      // Trả về mảng units kèm lessons
      return units.map((u) => ({
        UnitID: u.UnitID,
        Title: u.Title,
        Description: u.Description,
        Duration: u.Duration,
        OrderIndex: u.OrderIndex,
        Lessons: unitIdToLessons[u.UnitID] || [],
      }));
    } catch (error) {
      console.error("Database error in getCourseCurriculum:", error);
      throw error;
    }
  }

  // Tính tổng thời gian (phút) của course từ Duration
  async getCourseTotalDuration(courseId) {
    try {
      const db = await connectDB();

      // Luôn tính tổng từ các unit (không dùng Course.Duration)
      // Vì Duration của course có thể không chính xác, cần tính từ units
      const [units] = await db.query(
        `
        SELECT UnitID, Duration
        FROM unit
        WHERE CourseID = ?
        ORDER BY UnitID
      `,
        [courseId]
      );

      if (!units.length) {
        return 0;
      }

      // Tính tổng Duration từ các units (Duration là số phút)
      const totalMinutes = units.reduce((sum, unit) => {
        const duration = parseInt(unit.Duration) || 0;
        return sum + duration;
      }, 0);
      return totalMinutes;
    } catch (error) {
      console.error("Database error in getCourseTotalDuration:", error);
      throw error;
    }
  }

  async createEnrollment(learnerId, classId) {
    try {
      const db = await connectDB();

      // Kiểm tra learner tồn tại
      const [learner] = await db.query(
        "SELECT * FROM learner WHERE LearnerID = ?",
        [learnerId]
      );

      if (!learner.length) {
        throw new Error("Learner not found");
      }

      // Kiểm tra class tồn tại và active
      const [classData] = await db.query(
        "SELECT cl.*, c.Title as CourseTitle FROM class cl LEFT JOIN course c ON cl.CourseID = c.CourseID WHERE cl.ClassID = ? AND cl.Status = 'active'",
        [classId]
      );

      if (!classData.length) {
        throw new Error("Class not found or not available for enrollment");
      }

      // Kiểm tra enrollment đã tồn tại
      const [existing] = await db.query(
        "SELECT * FROM enrollment WHERE LearnerID = ? AND ClassID = ? AND Status IN ('enrolled','pending')",
        [learnerId, classId]
      );

      if (existing.length) {
        const status = existing[0].Status;
        if (status === "enrolled") {
          throw new Error("Already enrolled in this class");
        }
        throw new Error("You already have a pending enrollment for this class");
      }

      // Tạo enrollment
      const [result] = await db.query(
        "INSERT INTO enrollment (LearnerID, ClassID, EnrollmentDate, Status) VALUES (?, ?, NOW(), 'pending')",
        [learnerId, classId]
      );

      return {
        EnrollmentID: result.insertId,
        LearnerID: learnerId,
        ClassID: classId,
        EnrollmentDate: new Date(),
        Status: "pending",
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
        c.Image,
        c.Level,
        i.FullName as InstructorName,
        i.ProfilePicture as InstructorAvatar,
        COALESCE(MAX(cl.Maxstudent), 0) as MaxEnrollment,
        COUNT(DISTINCT cl.ClassID) as TotalClasses,
        COALESCE(SUM(e.EnrollmentCount), 0) as TotalEnrollments,
        COALESCE(MIN(cl.Fee), 0) as MinFee
      FROM course c
      INNER JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN class cl ON c.CourseID = cl.CourseID AND cl.Status = 'active'
      LEFT JOIN (
        SELECT ClassID, COUNT(*) as EnrollmentCount 
        FROM enrollment 
        WHERE Status = 'enrolled'
        GROUP BY ClassID
      ) e ON cl.ClassID = e.ClassID
      WHERE c.Status IN ('PUBLISHED', 'APPROVED', 'Open')
      GROUP BY c.CourseID, c.Title, c.Description, c.Duration, c.Image, c.Level, i.FullName, i.ProfilePicture
      ORDER BY TotalEnrollments DESC, MaxEnrollment DESC
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

  async getMyClassesInCourse(learnerId, courseId) {
    try {
      const db = await connectDB();

      const [classes] = await db.query(
        `SELECT 
        cl.ClassID,
        cl.Name as ClassName,
        cl.ZoomURL,
        cl.Status,
        cl.Fee,
        cl.InstructorID,
        i.FullName as InstructorName,
        i.ProfilePicture as InstructorAvatar,
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status as EnrollmentStatus,
        (SELECT COUNT(*) FROM enrollment e2 WHERE e2.ClassID = cl.ClassID AND e2.Status = 'enrolled') as StudentCount,
        COUNT(DISTINCT se.SessionID) as TotalSessions
       FROM class cl
       INNER JOIN instructor i ON cl.InstructorID = i.InstructorID
       INNER JOIN enrollment e ON cl.ClassID = e.ClassID
       LEFT JOIN session se ON cl.ClassID = se.ClassID
       WHERE cl.CourseID = ? 
         AND e.LearnerID = ? 
         AND e.Status = 'enrolled'
          AND cl.Status IN ('active', 'ongoing')
       GROUP BY 
         cl.ClassID, cl.Name, cl.ZoomURL, cl.Status, cl.Fee, 
         cl.InstructorID, i.FullName, i.ProfilePicture,
         e.EnrollmentID, e.EnrollmentDate, e.Status
       ORDER BY e.EnrollmentDate DESC`,
        [courseId, learnerId]
      );

      // Lấy lịch học từ timeslot
      for (let classItem of classes) {
        const [weeklySchedule] = await db.query(
          `SELECT DISTINCT
          t.StartTime,
          t.EndTime,
          t.Day,
          s.Date
         FROM session s
         INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
         WHERE s.ClassID = ?
         ORDER BY s.Date, t.StartTime`,
          [classItem.ClassID]
        );

        classItem.weeklySchedule = weeklySchedule;
      }

      return classes;
    } catch (error) {
      console.error("Database error in getMyClassesInCourse:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách assignments của khóa học kèm trạng thái nộp bài của learner
   */
  async getAssignmentsWithSubmissions(courseId, learnerId) {
    try {
      const db = await connectDB();

      const [assignments] = await db.query(
        `SELECT 
        a.AssignmentID,
        a.Title,
        a.Description,
        a.Deadline,
        a.FileURL,
        a.MediaURL,
        a.MaxDuration,
        a.Type,
        a.Status as AssignmentStatus,
        a.ShowAnswersAfter,
        a.UnitID,
        u.Title as UnitTitle,
        s.SubmissionID,
        s.SubmissionDate,
        s.Score,
        s.Feedback,
        s.Status as SubmissionStatus,
        s.Content as SubmissionContent,
        s.AudioURL as SubmissionAudioURL,
        s.DurationSec as SubmissionDuration
       FROM assignment a
       INNER JOIN unit u ON a.UnitID = u.UnitID
       LEFT JOIN submission s ON a.AssignmentID = s.AssignmentID AND s.LearnerID = ?
       WHERE u.CourseID = ? 
         AND a.Status IN ('published', 'scheduled')
         AND u.Status = 'VISIBLE'
       ORDER BY a.Deadline ASC, a.AssignmentID ASC`,
        [learnerId, courseId]
      );

      return assignments.map((assignment) => ({
        AssignmentID: assignment.AssignmentID,
        Title: assignment.Title,
        Description: assignment.Description,
        Deadline: assignment.Deadline,
        FileURL: assignment.FileURL,
        MediaURL: assignment.MediaURL,
        MaxDuration: assignment.MaxDuration,
        Type: assignment.Type,
        ShowAnswersAfter: assignment.ShowAnswersAfter,
        UnitTitle: assignment.UnitTitle,
        Submission: assignment.SubmissionID
          ? {
              SubmissionID: assignment.SubmissionID,
              SubmissionDate: assignment.SubmissionDate,
              Score: assignment.Score,
              Feedback: assignment.Feedback,
              Status: assignment.SubmissionStatus,
              Content: assignment.SubmissionContent,
              AudioURL: assignment.SubmissionAudioURL,
              DurationSec: assignment.SubmissionDuration,
            }
          : null,
      }));
    } catch (error) {
      console.error("Database error in getAssignmentsWithSubmissions:", error);
      throw error;
    }
  }

  /**
   * Lấy LearnerID từ AccountID (có thể đã có, nhưng thêm cho chắc)
   */
  async getLearnerIdByAccountId(accountId) {
    try {
      const db = await connectDB();

      const [rows] = await db.query(
        `SELECT LearnerID FROM learner WHERE AccID = ?`,
        [accountId]
      );

      if (!rows.length) {
        throw new Error("Learner profile not found");
      }

      return rows[0].LearnerID;
    } catch (error) {
      console.error("Database error in getLearnerIdByAccountId:", error);
      throw error;
    }
  }
}

module.exports = new CourseRepository();
