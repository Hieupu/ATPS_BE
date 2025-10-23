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

  // Hủy đăng ký lớp học (Admin API)
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

      res.status(200).json({
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

  // Lấy danh sách đăng ký của lớp học
  getClassEnrollments: async (req, res) => {
    try {
      const { classId } = req.params;

      const enrollments = await Enrollment.findByClassId(classId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách đăng ký lớp học thành công",
        data: enrollments,
      });
    } catch (error) {
      console.error("Error getting class enrollments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách đăng ký lớp học",
        error: error.message,
      });
    }
  },

  // Lấy danh sách đăng ký của học viên
  getLearnerEnrollments: async (req, res) => {
    try {
      const { learnerId } = req.params;

      const enrollments = await Enrollment.findByLearnerId(learnerId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách đăng ký của học viên thành công",
        data: enrollments,
      });
    } catch (error) {
      console.error("Error getting learner enrollments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách đăng ký của học viên",
        error: error.message,
      });
    }
  },

  // Cập nhật trạng thái đăng ký
  updateEnrollmentStatus: async (req, res) => {
    try {
      const { enrollmentId } = req.params;
      const { Status } = req.body;

      if (!Status) {
        return res.status(400).json({
          success: false,
          message: "Status là bắt buộc",
        });
      }

      const updatedEnrollment = await Enrollment.update(enrollmentId, {
        Status,
      });

      if (!updatedEnrollment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đăng ký",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái đăng ký thành công",
        data: updatedEnrollment,
      });
    } catch (error) {
      console.error("Error updating enrollment status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy thống kê đăng ký
  getEnrollmentStatistics: async (req, res) => {
    try {
      const { classId, learnerId } = req.query;

      let statistics;
      if (classId) {
        statistics = await Enrollment.getStatisticsByClass(classId);
      } else if (learnerId) {
        statistics = await Enrollment.getStatisticsByLearner(learnerId);
      } else {
        statistics = await Enrollment.getOverallStatistics();
      }

      res.status(200).json({
        success: true,
        message: "Lấy thống kê đăng ký thành công",
        data: statistics,
      });
    } catch (error) {
      console.error("Error getting enrollment statistics:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê đăng ký",
        error: error.message,
      });
    }
  },

  // Học viên tự đăng ký lớp học
  selfEnroll: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.body;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      // Kiểm tra xem học viên đã đăng ký lớp này chưa
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
        Status: "Paid",
      });

      res.status(201).json({
        success: true,
        message: "Đăng ký lớp học thành công",
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

  // Học viên hủy đăng ký lớp học
  selfCancelEnrollment: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.body;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const canceled = await Enrollment.cancelEnrollment(learnerId, classId);

      if (!canceled) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đăng ký hoặc đã hủy rồi",
        });
      }

      res.status(200).json({
        success: true,
        message: "Hủy đăng ký lớp học thành công",
      });
    } catch (error) {
      console.error("Error self canceling enrollment:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi hủy đăng ký lớp học",
        error: error.message,
      });
    }
  },
};

module.exports = enrollmentController;
