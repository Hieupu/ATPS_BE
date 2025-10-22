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
          c.TuitionFee,
          c.Status,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          i.Major as InstructorMajor,
          0 as EnrollmentCount,
          0 as AverageRating
        FROM course c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        WHERE c.Status = 'Open'  -- Changed from 'active' to 'Open'
        ORDER BY c.CourseID DESC
      `);
      
      return rows;
    } catch (error) {
      console.error("Database error in getAllCoursesWithDetails:", error);
      throw error;
    }
  }

  async getCourseWithDetails(courseId) {
    try {
      const db = await connectDB();
      
      
      const [courseRows] = await db.query(`
        SELECT 
          c.*,
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
      `, [courseId]);


      if (!courseRows.length) {
        console.log(`No course found with ID: ${courseId}`);
        return null;
      }

      const course = courseRows[0];
      
      // Get unit count
      const [unitRows] = await db.query(
        "SELECT COUNT(*) as UnitCount FROM unit WHERE CourseID = ?",
        [courseId]
      );

      // Get units
      const [units] = await db.query(`
        SELECT UnitID, Title, Description, Duration
        FROM unit 
        WHERE CourseID = ?
        ORDER BY UnitID
      `, [courseId]);

      // Get reviews
      let reviews = [];
      try {
        const [reviewRows] = await db.query(`
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
        `, [course.InstructorID]);
        reviews = reviewRows;
        console.log(`Found ${reviews.length} reviews`);
      } catch (reviewError) {
        console.log("No reviews found:", reviewError.message);
      }

      const instructorStats = await this.getInstructorStats(course.InstructorID);

      return {
        ...course,
        EnrollmentCount: 0,
        UnitCount: unitRows[0]?.UnitCount || 0,
        ...instructorStats,
        Units: units,
        Reviews: reviews,
        AverageRating: 0,
        ReviewCount: reviews.length
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
        "SELECT COUNT(*) as count FROM course WHERE InstructorID = ? AND Status = 'Open'",  // Added status filter
        [instructorId]
      );
      
      return {
        TotalCourses: courseCount[0]?.count || 0,
        TotalStudents: 0
      };
    } catch (error) {
      console.error("Database error in getInstructorStats:", error);
      return {
        TotalCourses: 0,
        TotalStudents: 0
      };
    }
  }
async createEnrollment(learnerId, courseId) {
  try {
    const db = await connectDB();
    
    // Check if learner exists
    const [learner] = await db.query(
      "SELECT * FROM learner WHERE LearnerID = ?",
      [learnerId]
    );

    if (!learner.length) {
      throw new Error("Learner not found");
    }

    // Check if course exists and is Open
    const [course] = await db.query(
      "SELECT * FROM course WHERE CourseID = ? AND Status = 'Open'",
      [courseId]
    );

    if (!course.length) {
      throw new Error("Course not found or not available for enrollment");
    }

    // NOW INCLUDE CourseID in the INSERT
    const [result] = await db.query(
      "INSERT INTO enrollment (LearnerID, CourseID, EnrollmentDate, Status) VALUES (?, ?, NOW(), 'active')",
      [learnerId, courseId]
    );

    return {
      EnrollmentID: result.insertId,
      LearnerID: learnerId,
      CourseID: courseId,
      EnrollmentDate: new Date(),
      Status: 'active'
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
          c.TuitionFee,
          c.Duration,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          0 as EnrollmentCount
        FROM course c
        INNER JOIN instructor i ON c.InstructorID = i.InstructorID
        WHERE c.Status = 'Open'  -- Changed from 'active' to 'Open'
        ORDER BY c.CourseID DESC
        LIMIT 6
      `);
      
      return rows;
    } catch (error) {
      console.error("Database error in getPopularCourses:", error);
      throw error;
    }
  }

  // Method to get all courses regardless of status (for admin purposes)
  async getAllCoursesAdmin() {
    try {
      const db = await connectDB();
      
      const [rows] = await db.query(`
        SELECT 
          c.CourseID,
          c.Title,
          c.Description,
          c.Duration,
          c.TuitionFee,
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