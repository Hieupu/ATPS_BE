const Instructor = require("../models/instructor");

const instructorController = {
  // Lấy tất cả giảng viên
  getAllInstructors: async (req, res) => {
    try {
      const instructors = await Instructor.findAll();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách giảng viên thành công",
        data: instructors,
      });
    } catch (error) {
      console.error("Error getting instructors:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy một giảng viên theo ID
  getInstructorById: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const instructor = await Instructor.findById(instructorId);

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin giảng viên thành công",
        data: instructor,
      });
    } catch (error) {
      console.error("Error getting instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin giảng viên",
        error: error.message,
      });
    }
  },

  // Tạo giảng viên mới
  createInstructor: async (req, res) => {
    try {
      const instructorData = {
        AccID: req.body.AccID,
        FullName: req.body.FullName,
        DateOfBirth: req.body.DateOfBirth,
        ProfilePicture: req.body.ProfilePicture,
        Job: req.body.Job,
        Address: req.body.Address,
        Major: req.body.Major,
      };

      // Validation
      if (!instructorData.AccID || !instructorData.FullName) {
        return res.status(400).json({
          success: false,
          message: "AccID và FullName là bắt buộc",
        });
      }

      const newInstructor = await Instructor.create(instructorData);

      res.status(201).json({
        success: true,
        message: "Tạo giảng viên thành công",
        data: newInstructor,
      });
    } catch (error) {
      console.error("Error creating instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo giảng viên",
        error: error.message,
      });
    }
  },

  // Cập nhật thông tin giảng viên
  updateInstructor: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const updateData = req.body;

      const updatedInstructor = await Instructor.update(
        instructorId,
        updateData
      );

      if (!updatedInstructor) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin giảng viên thành công",
        data: updatedInstructor,
      });
    } catch (error) {
      console.error("Error updating instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin giảng viên",
        error: error.message,
      });
    }
  },

  // Xóa giảng viên
  deleteInstructor: async (req, res) => {
    try {
      const instructorId = req.params.id;

      const deleted = await Instructor.delete(instructorId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa giảng viên thành công",
      });
    } catch (error) {
      console.error("Error deleting instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy thông tin chi tiết giảng viên với khóa học
  getInstructorWithCourses: async (req, res) => {
    try {
      const instructorId = req.params.id;

      const instructorWithCourses = await Instructor.findByIdWithCourses(
        instructorId
      );

      if (!instructorWithCourses) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin giảng viên với khóa học thành công",
        data: instructorWithCourses,
      });
    } catch (error) {
      console.error("Error getting instructor with courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin giảng viên với khóa học",
        error: error.message,
      });
    }
  },

  // Lấy lịch dạy của giảng viên
  getInstructorSchedule: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const { startDate, endDate } = req.query;

      const schedule = await Instructor.getSchedule(
        instructorId,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        message: "Lấy lịch dạy của giảng viên thành công",
        data: schedule,
      });
    } catch (error) {
      console.error("Error getting instructor schedule:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch dạy của giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy thống kê giảng viên
  getInstructorStatistics: async (req, res) => {
    try {
      const instructorId = req.params.id;

      const statistics = await Instructor.getStatistics(instructorId);

      res.status(200).json({
        success: true,
        message: "Lấy thống kê giảng viên thành công",
        data: statistics,
      });
    } catch (error) {
      console.error("Error getting instructor statistics:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê giảng viên",
        error: error.message,
      });
    }
  },
};

module.exports = instructorController;
