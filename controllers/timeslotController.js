const timeslotService = require("../services/timeslotService");

const COLORS = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

const logError = (context, error) => {
  const message = error?.message || "Unknown error";
  console.error(`${COLORS.red}[${context}] ${message}${COLORS.reset}`);
  if (error?.stack) {
    console.error(`${COLORS.yellow}${error.stack}${COLORS.reset}`);
  }
};

const timeslotController = {
  // Tạo timeslot (Admin API)
  createTimeslot: async (req, res) => {
    try {
      const timeslotData = req.body;

      if (!timeslotData.StartTime || !timeslotData.EndTime) {
        return res.status(400).json({
          success: false,
          message: "StartTime và EndTime là bắt buộc",
        });
      }

      const newTimeslot = await timeslotService.createTimeslot(timeslotData);

      res.status(201).json({
        success: true,
        message: "Tạo timeslot thành công",
        data: newTimeslot,
      });
    } catch (error) {
      console.error("Error creating timeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo timeslot",
        error: error.message,
      });
    }
  },

  // Lấy tất cả timeslots
  getAllTimeslots: async (req, res) => {
    try {
      const { page, limit, date = "" } = req.query;
      const options = {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        date: date || "",
      };

      const result = await timeslotService.getAllTimeslots(options);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách timeslots thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error getting timeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách timeslots",
        error: error.message,
      });
    }
  },

  // Lấy timeslot theo ID
  getTimeslotById: async (req, res) => {
    try {
      const timeslotId = req.params.timeslotId || req.params.id;
      const timeslot = await timeslotService.getTimeslotById(timeslotId);

      if (!timeslot) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy timeslot",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin timeslot thành công",
        data: timeslot,
      });
    } catch (error) {
      console.error("Error getting timeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin timeslot",
        error: error.message,
      });
    }
  },

  // Lấy timeslots theo khoảng ngày
  getTimeslotsByDateRange: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate và endDate là bắt buộc",
        });
      }

      const timeslots = await timeslotService.getTimeslotsByDateRange(
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        message: "Lấy timeslots theo khoảng ngày thành công",
        data: timeslots,
      });
    } catch (error) {
      console.error("Error getting timeslots by date range:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy timeslots theo khoảng ngày",
        error: error.message,
      });
    }
  },

  // Lấy timeslots theo địa điểm
  getTimeslotsByLocation: async (req, res) => {
    try {
      const { location } = req.query;

      if (!location) {
        return res.status(400).json({
          success: false,
          message: "location là bắt buộc",
        });
      }

      const timeslots = await timeslotService.getTimeslotsByLocation(location);

      res.status(200).json({
        success: true,
        message: "Lấy timeslots theo địa điểm thành công",
        data: timeslots,
      });
    } catch (error) {
      console.error("Error getting timeslots by location:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy timeslots theo địa điểm",
        error: error.message,
      });
    }
  },

  // Cập nhật timeslot
  updateTimeslot: async (req, res) => {
    try {
      const timeslotId = req.params.timeslotId || req.params.id;
      const updateData = req.body;

      const updatedTimeslot = await timeslotService.updateTimeslot(
        timeslotId,
        updateData
      );

      if (!updatedTimeslot) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy timeslot",
        });
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật timeslot thành công",
        data: updatedTimeslot,
      });
    } catch (error) {
      console.error("Error updating timeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật timeslot",
        error: error.message,
      });
    }
  },

  // Xóa timeslot
  deleteTimeslot: async (req, res) => {
    try {
      const timeslotId = req.params.timeslotId || req.params.id;

      const deleted = await timeslotService.deleteTimeslot(timeslotId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy timeslot",
        });
      }

      res.status(200).json({
        success: true,
        message: "Xóa timeslot thành công",
      });
    } catch (error) {
      logError("TimeslotController.deleteTimeslot", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa timeslot",
      });
    }
  },

  // Lấy tổng số timeslots
  getTotalTimeslots: async (req, res) => {
    try {
      const total = await timeslotService.getTotalCount();

      res.status(200).json({
        success: true,
        message: "Lấy tổng số timeslots thành công",
        data: { total },
      });
    } catch (error) {
      console.error("Error getting total timeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tổng số timeslots",
        error: error.message,
      });
    }
  },

  // Lấy timeslots theo ClassID
  getClassTimeslots: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassID là bắt buộc",
        });
      }

      const timeslots = await timeslotService.getTimeslotsByClassId(classId);

      res.status(200).json({
        success: true,
        message: "Lấy timeslots của lớp thành công",
        data: timeslots,
      });
    } catch (error) {
      console.error("Error getting class timeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy timeslots của lớp",
        error: error.message,
      });
    }
  },

  // Lấy timeslots theo CourseID
  getCourseTimeslots: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "CourseID là bắt buộc",
        });
      }

      const timeslots = await timeslotService.getTimeslotsByCourseId(courseId);

      res.status(200).json({
        success: true,
        message: "Lấy timeslots của khóa học thành công",
        data: timeslots,
      });
    } catch (error) {
      console.error("Error getting course timeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy timeslots của khóa học",
        error: error.message,
      });
    }
  },

  // Lấy lịch học của học viên
  getLearnerSchedule: async (req, res) => {
    try {
      const { learnerId } = req.query;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const schedule = await timeslotService.getLearnerSchedule(learnerId);

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

  // Lấy session đầu tiên và cuối cùng của một lớp
  getClassSessionTimeRange: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassID là bắt buộc",
        });
      }

      const timeRange = await timeslotService.getClassSessionTimeRange(classId);

      res.status(200).json({
        success: true,
        message:
          "Lấy thời gian session đầu tiên và cuối cùng của lớp thành công",
        data: timeRange,
      });
    } catch (error) {
      console.error("Error getting class session time range:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thời gian session của lớp",
        error: error.message,
      });
    }
  },

  // Lấy session đầu tiên và cuối cùng của một khóa học
  getCourseSessionTimeRange: async (req, res) => {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "CourseID là bắt buộc",
        });
      }

      const timeRange = await timeslotService.getCourseSessionTimeRange(
        courseId
      );

      res.status(200).json({
        success: true,
        message:
          "Lấy thời gian session đầu tiên và cuối cùng của khóa học thành công",
        data: timeRange,
      });
    } catch (error) {
      console.error("Error getting course session time range:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thời gian session của khóa học",
        error: error.message,
      });
    }
  },

  // Lấy tất cả timeslots với thông tin session đầu tiên và cuối cùng
  getTimeslotsWithSessionRange: async (req, res) => {
    try {
      const { classId, courseId } = req.query;

      const timeslots = await timeslotService.getTimeslotsWithSessionRange(
        classId,
        courseId
      );

      res.status(200).json({
        success: true,
        message:
          "Lấy timeslots với thông tin session đầu tiên và cuối cùng thành công",
        data: timeslots,
      });
    } catch (error) {
      console.error("Error getting timeslots with session range:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy timeslots với thông tin session",
        error: error.message,
      });
    }
  },

  // Lấy thống kê chi tiết về timeslots và sessions
  getSessionStatistics: async (req, res) => {
    try {
      const { classId, courseId } = req.query;

      const statistics = await timeslotService.getSessionStatistics(
        classId,
        courseId
      );

      res.status(200).json({
        success: true,
        message: "Lấy thống kê session thành công",
        data: statistics,
      });
    } catch (error) {
      console.error("Error getting session statistics:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê session",
        error: error.message,
      });
    }
  },

  // Lấy danh sách lớp với thông tin thời gian session
  getClassesWithTimeInfo: async (req, res) => {
    try {
      const classes = await timeslotService.getClassesWithTimeInfo();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách lớp với thông tin thời gian thành công",
        data: classes,
      });
    } catch (error) {
      console.error("Error getting classes with time info:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp với thông tin thời gian",
        error: error.message,
      });
    }
  },

  // Lấy ca học đã có sẵn trong DB của một lớp cụ thể
  getExistingTimeslotsForClass: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassID là bắt buộc",
        });
      }

      const timeslots = await timeslotService.getExistingTimeslotsForClass(
        classId
      );

      res.status(200).json({
        success: true,
        message: "Lấy ca học đã có sẵn của lớp thành công",
        data: timeslots,
      });
    } catch (error) {
      console.error("Error getting existing timeslots for class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy ca học đã có sẵn của lớp",
        error: error.message,
      });
    }
  },

  // Lấy tất cả ca học đã có sẵn trong DB với thông tin lớp
  getAllExistingTimeslotsWithClassInfo: async (req, res) => {
    try {
      const timeslots =
        await timeslotService.getAllExistingTimeslotsWithClassInfo();

      res.status(200).json({
        success: true,
        message: "Lấy tất cả ca học đã có sẵn với thông tin lớp thành công",
        data: timeslots,
      });
    } catch (error) {
      console.error(
        "Error getting all existing timeslots with class info:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tất cả ca học đã có sẵn với thông tin lớp",
        error: error.message,
      });
    }
  },

  // Lấy thống kê ca học cho classlist
  getClassListWithTimeStats: async (req, res) => {
    try {
      const classes = await timeslotService.getClassListWithTimeStats();

      res.status(200).json({
        success: true,
        message: "Lấy thống kê ca học cho classlist thành công",
        data: classes,
      });
    } catch (error) {
      console.error("Error getting class list with time stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê ca học cho classlist",
        error: error.message,
      });
    }
  },

  // Lấy danh sách học sinh đã enroll vào lớp
  getEnrolledLearners: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassID là bắt buộc",
        });
      }

      const learners = await timeslotService.getEnrolledLearners(classId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách học sinh đã enroll thành công",
        data: learners,
      });
    } catch (error) {
      console.error("Error getting enrolled learners:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách học sinh đã enroll",
        error: error.message,
      });
    }
  },

  // Lấy danh sách học sinh đã enroll với thông tin lớp
  getAllEnrolledLearnersWithClassInfo: async (req, res) => {
    try {
      const learners =
        await timeslotService.getAllEnrolledLearnersWithClassInfo();

      res.status(200).json({
        success: true,
        message:
          "Lấy danh sách học sinh đã enroll với thông tin lớp thành công",
        data: learners,
      });
    } catch (error) {
      console.error(
        "Error getting all enrolled learners with class info:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách học sinh đã enroll với thông tin lớp",
        error: error.message,
      });
    }
  },

  // Lấy thống kê enrollment cho classlist
  getClassEnrollmentStats: async (req, res) => {
    try {
      const stats = await timeslotService.getClassEnrollmentStats();

      res.status(200).json({
        success: true,
        message: "Lấy thống kê enrollment cho classlist thành công",
        data: stats,
      });
    } catch (error) {
      console.error("Error getting class enrollment stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê enrollment cho classlist",
        error: error.message,
      });
    }
  },

  // Lấy class sessions theo format frontend cần (cho ClassService.getClassSessions)
  getClassSessionsForFrontend: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassID là bắt buộc",
        });
      }

      const sessions = await timeslotService.getClassSessionsForFrontend(
        classId
      );

      res.status(200).json({
        success: true,
        message: "Lấy class sessions cho frontend thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting class sessions for frontend:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy class sessions cho frontend",
        error: error.message,
      });
    }
  },
};

module.exports = timeslotController;
