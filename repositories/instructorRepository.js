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
    sort = "newest",
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

      let orderBy = "i.InstructorID DESC";
      switch (sort) {
        case "popular":
          orderBy = "TotalStudents DESC";
          break;
        default:
          orderBy = "i.InstructorID DESC";
      }

      const whereSql = whereClauses.length
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

      const [items] = await db.query(
        `SELECT 
           i.InstructorID,
           i.FullName,
           i.ProfilePicture,
           i.Major,
           i.Job,
           (SELECT COUNT(DISTINCT e.LearnerID) FROM enrollment e JOIN class cl ON e.ClassID = cl.ClassID JOIN course c ON cl.CourseID = c.CourseID WHERE c.InstructorID = i.InstructorID AND e.Status='Enrolled') as TotalStudents
         FROM instructor i
         ${whereSql}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [countRows] = await db.query(
        `SELECT COUNT(*) as total FROM instructor i ${whereSql}`,
        params
      );

      const total = countRows?.[0]?.total || 0;
      return { items, total, page: Number(page), pageSize: Number(pageSize) };
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
}

module.exports = new InstructorRepository();
