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

  // Tạo học viên mới
  createLearner: async (req, res) => {
    try {
      const learnerData = {
        AccID: req.body.AccID,
        FullName: req.body.FullName,
        DateOfBirth: req.body.DateOfBirth,
        ProfilePicture: req.body.ProfilePicture,
        Job: req.body.Job,
        Address: req.body.Address,
      };

      // Validation
      if (!learnerData.AccID || !learnerData.FullName) {
        return res.status(400).json({
          success: false,
          message: "AccID và FullName là bắt buộc",
        });
      }

      const newLearner = await Learner.create(learnerData);

      res.status(201).json({
        success: true,
        message: "Tạo học viên thành công",
        data: newLearner,
      });
    } catch (error) {
      console.error("Error creating learner:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo học viên",
        error: error.message,
      });
    }
  },

  // Cập nhật thông tin học viên
  updateLearner: async (req, res) => {
    try {
      const learnerId = req.params.id;
      const updateData = req.body;

      const updatedLearner = await Learner.update(learnerId, updateData);

      if (!updatedLearner) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin học viên thành công",
        data: updatedLearner,
      });
    } catch (error) {
      console.error("Error updating learner:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin học viên",
        error: error.message,
      });
    }
  },

  // Xóa học viên
  deleteLearner: async (req, res) => {
    try {
      const learnerId = req.params.id;

      const deleted = await Learner.delete(learnerId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa học viên thành công",
      });
    } catch (error) {
      console.error("Error deleting learner:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa học viên",
        error: error.message,
      });
    }
  },

  // Lấy thông tin chi tiết học viên với lớp học
  getLearnerWithClasses: async (req, res) => {
    try {
      const learnerId = req.params.id;

      const learnerWithClasses = await Learner.findByIdWithClasses(learnerId);

      if (!learnerWithClasses) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin học viên với lớp học thành công",
        data: learnerWithClasses,
      });
    } catch (error) {
      console.error("Error getting learner with classes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin học viên với lớp học",
        error: error.message,
      });
    }
  },

  // Lấy lịch học của học viên
  getLearnerSchedule: async (req, res) => {
    try {
      const learnerId = req.params.id;
      const { startDate, endDate } = req.query;

      const schedule = await Learner.getSchedule(learnerId, startDate, endDate);

      res.status(200).json({
        success: true,
        message: "Lấy lịch học của học viên thành công",
        data: schedule,
      });
    } catch (error) {
      console.error("Error getting learner schedule:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch học của học viên",
        error: error.message,
      });
    }
  },

  // Lấy thống kê học viên
  getLearnerStatistics: async (req, res) => {
    try {
      const learnerId = req.params.id;

      const statistics = await Learner.getStatistics(learnerId);

      res.status(200).json({
        success: true,
        message: "Lấy thống kê học viên thành công",
        data: statistics,
      });
    } catch (error) {
      console.error("Error getting learner statistics:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê học viên",
        error: error.message,
      });
    }
  },

  // Lấy điểm danh của học viên
  getLearnerAttendance: async (req, res) => {
    try {
      const learnerId = req.params.id;
      const { classId } = req.query;

      const attendance = await Learner.getAttendance(learnerId, classId);

      res.status(200).json({
        success: true,
        message: "Lấy điểm danh của học viên thành công",
        data: attendance,
      });
    } catch (error) {
      console.error("Error getting learner attendance:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy điểm danh của học viên",
        error: error.message,
      });
    }
  },
};

module.exports = learnerController;
