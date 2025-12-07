const courseRepository = require("../repositories/courseRepository");
const profileService = require("../services/profileService");
const connectDB = require("../config/db");
const getAllCourses = async (req, res) => {
  try {
    const courses = await courseRepository.getAllCoursesWithDetails();
    res.json(courses);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};

const searchCourses = async (req, res) => {
  try {
    const {
      search = "",
      category = null,
      sort = "newest",
      page = 1,
      pageSize = 10,
    } = req.query;
    const result = await courseRepository.searchCourses({
      search,
      category,
      sort,
      page,
      pageSize,
    });
    res.json(result);
  } catch (error) {
    console.error("Search courses error:", error);
    res
      .status(500)
      .json({ message: "Failed to search courses", error: error.message });
  }
};

// controllers/courseController.js
const getMyCourses = async (req, res) => {
  try {
    const accountId = req.user.id;

    // Lấy LearnerID từ AccountID - sửa theo database mới
    const learner = await courseRepository.getLearnerByAccountId(accountId);

    if (!learner) {
      return res.status(404).json({ message: "Learner profile not found" });
    }

    const learnerId = learner.LearnerID;

    // Lấy danh sách khóa học đã đăng ký
    const enrolledCourses = await courseRepository.getEnrolledCoursesByLearnerId(learnerId);

    res.json({
      success: true,
      data: enrolledCourses,
    });
  } catch (error) {
    console.error("Get my courses error:", error);
    res.status(500).json({
      message: "Failed to fetch enrolled courses",
      error: error.message,
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await courseRepository.getCourseWithDetails(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      message: "Failed to fetch course",
      error: error.message,
    });
  }
};

const getClassesByCourse = async (req, res) => {
  try {
    const { id } = req.params; // Fix: route uses :id, not :courseId

    console.log("Getting classes for course ID:", id);

    const classes = await courseRepository.getClassesByCourse(id);

    console.log("Classes found:", classes.length);

    res.json({ classes });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({
      message: "Failed to fetch classes",
      error: error.message,
    });
  }
};
const transferClass = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { fromClassId, toClassId } = req.body;
    const accountId = req.user.id;
     const db = await connectDB();
    // Validate
    if (!fromClassId || !toClassId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing class IDs" 
      });
    }

    // Kiểm tra learner
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      return res.status(404).json({ 
        success: false, 
        message: "Learner profile not found" 
      });
    }

    // Kiểm tra người học có trong lớp cũ không
    const [existingEnrollment] = await db.query(
      `SELECT * FROM enrollment 
       WHERE ClassID = ? AND LearnerID = ? AND Status = 'enrolled'`,
      [fromClassId, learner.LearnerID]
    );

    if (existingEnrollment.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "You are not enrolled in the source class" 
      });
    }

    // Kiểm tra lớp đích có tồn tại và còn chỗ không
    const [targetClass] = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM enrollment e2 WHERE e2.ClassID = c.ClassID AND e2.Status = 'enrolled') as StudentCount
       FROM class c
       WHERE c.ClassID = ? AND c.CourseID = ? AND c.Status = 'ACTIVE'`,
      [toClassId, courseId]
    );

    if (targetClass.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Target class not found or not active" 
      });
    }

    const targetClassInfo = targetClass[0];
    if (targetClassInfo.StudentCount >= targetClassInfo.Maxstudent) {
      return res.status(400).json({ 
        success: false, 
        message: "Target class is full" 
      });
    }

    // Kiểm tra đã đăng ký lớp đích chưa
    const [existingTargetEnrollment] = await db.query(
      `SELECT * FROM enrollment 
       WHERE ClassID = ? AND LearnerID = ?`,
      [toClassId, learner.LearnerID]
    );

    if (existingTargetEnrollment.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already enrolled in the target class" 
      });
    }

    // Bắt đầu transaction
    await db.query('START TRANSACTION');

    try {
      // Cập nhật enrollment cũ thành transferred
      await db.query(
        `UPDATE enrollment 
         SET Status = 'transferred', EnrollmentDate = NOW()
         WHERE EnrollmentID = ?`,
        [existingEnrollment[0].EnrollmentID]
      );

      // Tạo enrollment mới
      await db.query(
        `INSERT INTO enrollment (EnrollmentDate, Status, LearnerID, ClassID, OrderCode)
         VALUES (NOW(), 'enrolled', ?, ?, ?)`,
        [learner.LearnerID, toClassId, existingEnrollment[0].OrderCode]
      );

      // Commit transaction
      await db.query('COMMIT');

      res.json({
        success: true,
        message: "Class transfer successful. Please wait for admin confirmation.",
        enrollmentId: existingEnrollment[0].EnrollmentID
      });

    } catch (error) {
      // Rollback nếu có lỗi
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error("Transfer class error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to transfer class" 
    });
  }
};

const getScheduleClasses = async (req, res) => {
  try {
    const { 
      status = 'active', 
      dateFrom, 
      dateTo, 
      instructorId,
      courseId,
      month,      // Thêm tham số mới
      levels,     // Thêm tham số mới
      days,       // Thêm tham số mới
      timeSlot    // Thêm tham số mới
    } = req.query;

    const classes = await courseRepository.getScheduleClasses({
      status,
      dateFrom,
      dateTo,
      instructorId,
      courseId,
      month,      // Truyền thêm vào repository
      levels,     // Truyền thêm vào repository
      days,       // Truyền thêm vào repository
      timeSlot    // Truyền thêm vào repository
    });

    res.json({
      success: true,
      data: classes,
      total: classes.length
    });
  } catch (error) {
    console.error("Get schedule classes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule classes",
      error: error.message,
    });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const { classId } = req.body;
    const accountId = req.user.id;

    // Lấy LearnerID từ AccountID - sửa theo database mới
    const learner = await courseRepository.getLearnerByAccountId(accountId);

    if (!learner) {
      return res.status(404).json({ message: "Learner profile not found" });
    }

    const learnerId = learner.LearnerID;

    const enrollment = await courseRepository.createEnrollment(
      learnerId,
      classId
    );

    // Tạo thông báo - sửa accId thành AccID theo database mới
    try {
      const notificationService = require("../services/notificationService");
      await notificationService.create({
        AccID: accountId, // Sửa từ accId thành AccID
        type: "enroll",
        content: `Bạn đã đăng ký lớp học (ClassID: ${classId}). Lịch học sẽ được cập nhật trong phần Lộ trình/Materials.`,
      });
    } catch (e) {
      console.warn("Create notification failed (non-blocking):", e.message);
    }

    res.json({
      message: "Enrollment successful",
      enrollment,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({
      message: error.message || "Enrollment failed",
      error: error.message,
    });
  }
};

const getMyClassesInCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const accountId = req.user.id;

    console.log(`Getting classes for course ${courseId}, account ${accountId}`);

    // Lấy LearnerID từ AccountID - sửa theo database mới
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      return res.status(404).json({ message: "Learner profile not found" });
    }

    const learnerId = learner.LearnerID;
    const classes = await courseRepository.getMyClassesInCourse(learnerId, courseId);

    res.json({ 
      success: true, 
      classes,
      count: classes.length 
    });
  } catch (error) {
    console.error("Get my classes error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to fetch your classes" 
    });
  }
};

const getCourseAssignments = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const accountId = req.user.id;

    console.log(`Getting assignments for course ${courseId}, account ${accountId}`);

    // Lấy LearnerID từ AccountID - sửa theo database mới
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      return res.status(404).json({ message: "Learner profile not found" });
    }

    const learnerId = learner.LearnerID;
    const assignments = await courseRepository.getCourseAssignments(courseId, learnerId);

    res.json({ 
      success: true, 
      assignments,
      count: assignments.length 
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to fetch assignments" 
    });
  }
};
// Thêm vào controller
const checkEnrollmentStatus = async (req, res) => {
  try {
    const { classId } = req.params;
    const accountId = req.user.id;

    // Lấy LearnerID từ AccountID
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      return res.status(404).json({ 
        success: false,
        message: "Learner profile not found",
        isEnrolled: false 
      });
    }

    const learnerId = learner.LearnerID;
    
    // Kiểm tra xem đã đăng ký lớp này chưa
    const db = await connectDB();
    const [enrollments] = await db.query(
      `SELECT EnrollmentID, Status 
       FROM enrollment 
       WHERE LearnerID = ? AND ClassID = ? AND Status = 'enrolled'`,
      [learnerId, classId]
    );

    const isEnrolled = enrollments.length > 0;

    res.json({
      success: true,
      isEnrolled,
      enrollment: isEnrolled ? enrollments[0] : null
    });
  } catch (error) {
    console.error("Check enrollment error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Failed to check enrollment status",
      isEnrolled: false
    });
  }
};


const getPopularCourses = async (req, res) => {
  try {
    const courses = await courseRepository.getPopularCourses();
    res.json(courses);
  } catch (error) {
    console.error("Get popular courses error:", error);
    res.status(500).json({
      message: "Failed to fetch popular courses",
      error: error.message,
    });
  }
};

const getPopularClasses = async (req, res) => {
  try {
    const classes = await courseRepository.getPopularClasses();
    res.json(classes);
  } catch (error) {
    console.error("Get popular classes error:", error);
    res.status(500).json({
      message: "Failed to fetch popular classes",
      error: error.message,
    });
  }
};

const getCourseCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await courseRepository.getCourseCurriculum(id);
    return res.json({ curriculum });
  } catch (error) {
    console.error("Get course curriculum error:", error);
    res.status(500).json({
      message: "Failed to fetch course curriculum",
      error: error.message,
    });
  }
};

// Add admin endpoint to see all courses regardless of status
const getAllCoursesAdmin = async (req, res) => {
  try {
    const courses = await courseRepository.getAllCoursesAdmin();
    res.json(courses);
  } catch (error) {
    console.error("Get all courses admin error:", error);
    res.status(500).json({
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};

const getLearnerIdByAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    // Sửa theo database mới - trả về object learner thay vì chỉ learnerId
    const learner = await courseRepository.getLearnerByAccountId(accountId);

    if (!learner) {
      return res
        .status(404)
        .json({ message: "Learner not found for this account" });
    }

    res.json({ learnerId: learner.LearnerID });
  } catch (error) {
    console.error("Get learner ID error:", error);
    res.status(500).json({
      message: "Failed to get learner ID",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCourses,
  searchCourses,
  getCourseById,
  enrollInCourse,
  getPopularCourses,
  getAllCoursesAdmin,
  getMyCourses,
  getLearnerIdByAccount,
  getClassesByCourse,
  getCourseCurriculum,
  getMyClassesInCourse,
  getCourseAssignments,
  getPopularClasses,
  checkEnrollmentStatus,
  getScheduleClasses,
  transferClass
};
