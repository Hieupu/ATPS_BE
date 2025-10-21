const Timeslot = require("../models/timeslot");

const timeslotController = {
  // Tạo timeslot (Admin API)
  createTimeslot: async (req, res) => {
    try {
      const timeslotData = req.body;

      if (
        !timeslotData.StartTime ||
        !timeslotData.EndTime ||
        !timeslotData.Date
      ) {
        
        return res.status(400).json({
          success: false,
          message: "StartTime, EndTime và Date là bắt buộc",
        });
      }

      const newTimeslot = await Timeslot.create(timeslotData);

      res.status(201).json({
        success: true,
        message: "Tạo timeslot thành công",
        data: newTimeslot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo lịch học",
        error: error.message,
      });
    }
  },

  // Lấy danh sách timeslots với pagination (Admin API)
  getAllTimeslots: async (req, res) => {
    try {
      const { page = 1, limit = 10, date = "" } = req.query;

      const result = await Timeslot.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        date: date,
      });

      res.json({
        success: true,
        message: "Lấy danh sách timeslots thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách timeslots",
        error: error.message,
      });
    }
  },

  // Lấy lịch học của lớp
  getClassTimeslots: async (req, res) => {
    try {
      const { classId } = req.params;

      const timeslots = await Timeslot.findByClassId(classId);

      res.json({
        success: true,
        message: "Lấy lịch học thành công",
        data: timeslots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch học",
        error: error.message,
      });
    }
  },

  // Lấy lịch học của khóa học
  getCourseTimeslots: async (req, res) => {
    try {
      const { courseId } = req.params;

      const timeslots = await Timeslot.findByCourseId(courseId);

      res.json({
        success: true,
        message: "Lấy lịch học khóa học thành công",
        data: timeslots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch học khóa học",
        error: error.message,
      });
    }
  },

  // Lấy timeslot theo ID
  getTimeslotById: async (req, res) => {
    try {
      const { timeslotId } = req.params;

      const timeslot = await Timeslot.findById(timeslotId);

      if (!timeslot) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch học",
        });
      }

      res.json({
        success: true,
        message: "Lấy lịch học thành công",
        data: timeslot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch học",
        error: error.message,
      });
    }
  },

  // Cập nhật lịch học
  updateTimeslot: async (req, res) => {
    try {
      const { timeslotId } = req.params;
      const timeslotData = req.body;

      // Kiểm tra xung đột thời gian (nếu có Room)
      if (timeslotData.Room) {
        const hasConflict = await Timeslot.checkRoomConflict(
          timeslotData.Date,
          timeslotData.StartTime,
          timeslotData.EndTime,
          timeslotData.Room,
          timeslotId
        );

        if (hasConflict) {
          return res.status(409).json({
            success: false,
            message: "Phòng học đã được sử dụng trong khoảng thời gian này",
          });
        }
      }

      const updatedTimeslot = await Timeslot.update(timeslotId, timeslotData);

      if (!updatedTimeslot) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch học",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật lịch học thành công",
        data: updatedTimeslot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật lịch học",
        error: error.message,
      });
    }
  },

  // Xóa lịch học
  deleteTimeslot: async (req, res) => {
    try {
      const { timeslotId } = req.params;

      const deleted = await Timeslot.delete(timeslotId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch học",
        });
      }

      res.json({
        success: true,
        message: "Xóa lịch học thành công",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa lịch học",
        error: error.message,
      });
    }
  },

  // Lấy lịch học cá nhân của học viên
  getLearnerSchedule: async (req, res) => {
    try {
      const { learnerId } = req.query;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const schedule = await Timeslot.getLearnerSchedule(learnerId);

      res.json({
        success: true,
        message: "Lấy lịch học cá nhân thành công",
        data: schedule,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch học cá nhân",
        error: error.message,
      });
    }
  },
};

module.exports = timeslotController;
