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
      error: error.message 
    });
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
    const enrolledCourses = await courseRepository.getEnrolledCoursesByLearnerId(learnerId);

    res.json({
      success: true,
      data: enrolledCourses
    });
  } catch (error) {
    console.error("Get my courses error:", error);
    res.status(500).json({ 
      message: "Failed to fetch enrolled courses",
      error: error.message 
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
      error: error.message 
    });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const learnerId = req.user.id;

    const enrollment = await courseRepository.createEnrollment(learnerId, courseId);
    
    res.json({ 
      message: "Enrollment successful", 
      enrollment 
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ 
      message: error.message || "Enrollment failed",
      error: error.message 
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
      error: error.message 
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
      error: error.message 
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  enrollInCourse,
  getPopularCourses,
  getAllCoursesAdmin,
  getMyCourses
};