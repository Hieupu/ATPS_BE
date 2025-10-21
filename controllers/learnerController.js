const Learner = require("../models/learner");

const learnerController = {
  // Lấy tất cả học viên
  getAllLearners: async (req, res) => {
    try {
      const learners = await Learner.findAll();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách học viên thành công",
        data: learners,
      });
    } catch (error) {
      console.error("Error getting learners:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách học viên",
        error: error.message,
      });
    }
  },

  // Lấy một học viên theo ID
  getLearnerById: async (req, res) => {
    try {
      const learnerId = req.params.id;
      const learner = await Learner.findById(learnerId);

      if (!learner) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên",
        });
      }

      // Lấy các khóa học mà học viên đã đăng ký
      const courses = await Learner.getEnrolledCourses(learnerId);
      learner.enrolledCourses = courses;

      res.status(200).json({
        success: true,
        message: "Lấy thông tin học viên thành công",
        data: learner,
      });
    } catch (error) {
      console.error("Error getting learner:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin học viên",
        error: error.message,
      });
    }
  },

  // Lấy các khóa học của học viên
  getLearnerCourses: async (req, res) => {
    try {
      const learnerId = req.params.id;

      // Kiểm tra học viên có tồn tại không
      const exists = await Learner.exists(learnerId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên",
        });
      }

      const courses = await Learner.getEnrolledCourses(learnerId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách khóa học thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting learner courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học",
        error: error.message,
      });
    }
  },
};

module.exports = learnerController;
