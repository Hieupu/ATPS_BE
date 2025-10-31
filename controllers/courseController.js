const courseRepository = require("../repositories/courseRepository");
const profileService = require("../services/profileService");
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
    const accountId = req.user.id; // Lấy từ JWT token

    // Lấy LearnerID từ AccountID
    const learnerId = await courseRepository.getLearnerIdByAccountId(accountId);

    if (!learnerId) {
      return res.status(404).json({ message: "Learner profile not found" });
    }

    // Lấy danh sách khóa học đã đăng ký
    const enrolledCourses =
      await courseRepository.getEnrolledCoursesByLearnerId(learnerId);

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

const enrollInCourse = async (req, res) => {
  try {
    const { classId } = req.body;
    const accountId = req.user.id;

    // Lấy LearnerID từ AccountID
    const learnerId = await courseRepository.getLearnerIdByAccountId(accountId);

    if (!learnerId) {
      return res.status(404).json({ message: "Learner profile not found" });
    }

    const enrollment = await courseRepository.createEnrollment(
      learnerId,
      classId
    );

    // Tạo thông báo cho tài khoản về lịch học/lớp mới đăng ký
    try {
      const notificationService = require("../services/notificationService");
      await notificationService.create({
        accId: accountId,
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

    const learnerId = await courseRepository.getLearnerIdByAccountId(accountId);

    if (!learnerId) {
      return res
        .status(404)
        .json({ message: "Learner not found for this account" });
    }

    res.json({ learnerId });
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
};
