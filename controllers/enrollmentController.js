const Enrollment = require("../models/enrollment");
const Course = require("../models/course");

const enrollmentController = {
  // Enroll lớp học (Admin API)
  enrollClass: async (req, res) => {
    try {
      const { classId, learnerId } = req.body;

      // Validation
      if (!classId || !learnerId) {
        return res.status(400).json({
          success: false,
          message: "ClassID và LearnerID là bắt buộc",
        });
      }

      const enrollment = await Enrollment.create({
        LearnerID: learnerId,
        ClassID: classId,
        Status: "Paid",
      });

      res.status(201).json({
        success: true,
        message: "Đăng ký lớp học thành công",
        data: enrollment,
      });
    } catch (error) {
      console.error("Error enrolling class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đăng ký lớp học",
        error: error.message,
      });
    }
  },

  // Học viên tự enroll vào lớp (Learner API)
  selfEnroll: async (req, res) => {
    try {
      const { classId } = req.body;
      const { learnerId } = req.params; // Lấy từ URL params

      // Validation
      if (!classId || !learnerId) {
        return res.status(400).json({
          success: false,
          message: "ClassID và LearnerID là bắt buộc",
        });
      }

      // Kiểm tra xem học viên đã enroll chưa
      const existingEnrollment = await Enrollment.findByLearnerAndClass(
        learnerId,
        classId
      );
      if (existingEnrollment) {
        return res.status(400).json({
          success: false,
          message: "Bạn đã đăng ký lớp học này rồi",
        });
      }

      const enrollment = await Enrollment.create({
        LearnerID: learnerId,
        ClassID: classId,
        Status: "Pending", // Trạng thái chờ thanh toán
      });

      res.status(201).json({
        success: true,
        message: "Đăng ký lớp học thành công. Vui lòng thanh toán để hoàn tất.",
        data: enrollment,
      });
    } catch (error) {
      console.error("Error self enrolling:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đăng ký lớp học",
        error: error.message,
      });
    }
  },

  // Lấy enrollment theo ID
  getEnrollmentById: async (req, res) => {
    try {
      const { enrollmentId } = req.params;

      const enrollment = await Enrollment.findById(enrollmentId);

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đăng ký",
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin đăng ký thành công",
        data: enrollment,
      });
    } catch (error) {
      console.error("Error getting enrollment:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin đăng ký",
        error: error.message,
      });
    }
  },

  // Hủy đăng ký khóa học
  cancelEnrollment: async (req, res) => {
    try {
      const { enrollmentId } = req.params;

      const deleted = await Enrollment.delete(enrollmentId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đăng ký",
        });
      }

      res.json({
        success: true,
        message: "Hủy đăng ký thành công",
      });
    } catch (error) {
      console.error("Error canceling enrollment:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi hủy đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy danh sách khóa học có thể enroll
  getAvailableCourses: async (req, res) => {
    try {
      const courses = await Course.getAvailableCourses();

      res.json({
        success: true,
        message: "Lấy danh sách khóa học có thể đăng ký thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting available courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học có thể đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy danh sách lớp học đã enroll
  getEnrolledClasses: async (req, res) => {
    try {
      const { learnerId } = req.query;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const enrollments = await Enrollment.findByLearnerId(learnerId);

      res.json({
        success: true,
        message: "Lấy danh sách lớp học đã đăng ký thành công",
        data: enrollments,
      });
    } catch (error) {
      console.error("Error getting enrolled classes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp học đã đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy danh sách đăng ký của học viên
  getLearnerEnrollments: async (req, res) => {
    try {
      const { learnerId } = req.params;

      const enrollments = await Enrollment.findByLearnerId(learnerId);

      res.json({
        success: true,
        message: "Lấy danh sách đăng ký học viên thành công",
        data: enrollments,
      });
    } catch (error) {
      console.error("Error getting learner enrollments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách đăng ký học viên",
        error: error.message,
      });
    }
  },

  // Tham gia lớp học cụ thể
  joinClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.body;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      // Tạo enrollment cho lớp học
      const enrollment = await Enrollment.create({
        LearnerID: learnerId,
        ClassID: classId,
        Status: "Paid",
      });

      res.status(201).json({
        success: true,
        message: "Tham gia lớp học thành công",
        data: enrollment,
      });
    } catch (error) {
      console.error("Error joining class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tham gia lớp học",
        error: error.message,
      });
    }
  },

  // Rời khỏi lớp học
  leaveClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.body;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      // Hủy enrollment
      const result = await Enrollment.cancelEnrollment(learnerId, classId);

      res.json({
        success: true,
        message: "Rời khỏi lớp học thành công",
        data: { result },
      });
    } catch (error) {
      console.error("Error leaving class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi rời khỏi lớp học",
        error: error.message,
      });
    }
  },
};

module.exports = enrollmentController;
