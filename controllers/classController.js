const classService = require("../services/classService");
const courseService = require("../services/courseService");
const instructorService = require("../services/instructorService");
const enrollmentService = require("../services/enrollmentService");

// Helper function để validate session data
function validateSessionData(data) {
  const errors = [];

  if (!data.title) errors.push("Title is required");
  if (!data.timeslots || !Array.isArray(data.timeslots)) {
    errors.push("Timeslots must be an array");
  }

  if (data.timeslots && Array.isArray(data.timeslots)) {
    data.timeslots.forEach((timeslot, index) => {
      if (!timeslot.startTime)
        errors.push(`Timeslot ${index + 1}: startTime is required`);
      if (!timeslot.endTime)
        errors.push(`Timeslot ${index + 1}: endTime is required`);
      if (!timeslot.date)
        errors.push(`Timeslot ${index + 1}: date is required`);

      // Validate time format
      if (
        timeslot.startTime &&
        !/^\d{2}:\d{2}:\d{2}$/.test(timeslot.startTime)
      ) {
        errors.push(`Timeslot ${index + 1}: startTime format must be HH:MM:SS`);
      }
      if (timeslot.endTime && !/^\d{2}:\d{2}:\d{2}$/.test(timeslot.endTime)) {
        errors.push(`Timeslot ${index + 1}: endTime format must be HH:MM:SS`);
      }

      // Validate date format
      if (timeslot.date && !/^\d{4}-\d{2}-\d{2}$/.test(timeslot.date)) {
        errors.push(`Timeslot ${index + 1}: date format must be YYYY-MM-DD`);
      }

      // Validate time logic
      if (
        timeslot.startTime &&
        timeslot.endTime &&
        timeslot.startTime >= timeslot.endTime
      ) {
        errors.push(`Timeslot ${index + 1}: startTime must be before endTime`);
      }
    });
  }

  return errors.length === 0 ? null : errors;
}

const classController = {
  // Lấy danh sách lớp học
  getClassesDetails: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status = "",
        instructorId = "",
      } = req.query;

      const classes = await classService.getAllClasses();

      res.json({
        success: true,
        message: "Lấy danh sách lớp học thành công",
        data: classes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: classes.length,
        },
      });
    } catch (error) {
      console.error("Error getting classes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp học",
        error: error.message,
      });
    }
  },

  // Tạo lớp học mới
  createClass: async (req, res) => {
    try {
      const classData = req.body;

      if (!classData.ClassName || !classData.InstructorID) {
        return res.status(400).json({
          success: false,
          message: "ClassName và InstructorID là bắt buộc",
        });
      }

      const newClass = await classService.createClass(classData);

      res.status(201).json({
        success: true,
        message: "Tạo lớp học thành công",
        data: newClass,
      });
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo lớp học",
        error: error.message,
      });
    }
  },

  // Lấy thông tin lớp học theo ID
  getClassById: async (req, res) => {
    try {
      const classId = req.params.classId || req.params.id;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "Class ID là bắt buộc",
        });
      }

      const classData = await classService.getClassById(classId);

      if (!classData) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lớp học",
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin lớp học thành công",
        data: classData,
      });
    } catch (error) {
      console.error("Error getting class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin lớp học",
        error: error.message,
      });
    }
  },

  // Cập nhật lớp học
  updateClass: async (req, res) => {
    try {
      const classId = req.params.classId || req.params.id;
      const updateData = req.body;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassID là bắt buộc",
        });
      }

      const updatedClass = await classService.updateClass(classId, updateData);

      if (!updatedClass) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lớp học",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật lớp học thành công",
        data: updatedClass,
      });
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật lớp học",
        error: error.message,
      });
    }
  },

  // Xóa lớp học
  deleteClass: async (req, res) => {
    try {
      const classId = req.params.classId || req.params.id;

      const deleted = await classService.deleteClass(classId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lớp học",
        });
      }

      res.json({
        success: true,
        message: "Xóa lớp học thành công",
      });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa lớp học",
        error: error.message,
      });
    }
  },

  // Lấy lớp học theo khóa học
  getClassesByCourseId: async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const classes = await classService.getClassesByCourseId(courseId);

      res.json({
        success: true,
        message: "Lấy danh sách lớp học theo khóa học thành công",
        data: classes,
      });
    } catch (error) {
      console.error("Error getting classes by course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp học theo khóa học",
        error: error.message,
      });
    }
  },

  // Lấy lớp học theo giảng viên
  getClassesByInstructorId: async (req, res) => {
    try {
      const instructorId = req.params.instructorId;
      const classes = await classService.getClassesByInstructorId(instructorId);

      res.json({
        success: true,
        message: "Lấy danh sách lớp học theo giảng viên thành công",
        data: classes,
      });
    } catch (error) {
      console.error("Error getting classes by instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp học theo giảng viên",
        error: error.message,
      });
    }
  },

  // Auto update class status
  autoUpdateClassStatus: async (req, res) => {
    try {
      // Logic để auto update status của classes dựa trên schedule
      const classes = await classService.getAllClasses();

      // Update status logic (có thể implement sau)
      const updatedClasses = await classService.autoUpdateClassStatus();

      res.json({
        success: true,
        message: "Auto update class status thành công",
        data: updatedClasses,
      });
    } catch (error) {
      console.error("Error auto updating class status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi auto update class status",
        error: error.message,
      });
    }
  },

  // Lấy tất cả instructors (cho dropdown)
  getAllInstructors: async (req, res) => {
    try {
      const instructors = await instructorService.getAllInstructors();

      res.json({
        success: true,
        message: "Lấy danh sách instructors thành công",
        data: instructors,
      });
    } catch (error) {
      console.error("Error getting instructors:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách instructors",
        error: error.message,
      });
    }
  },

  // Lấy tất cả courses (cho dropdown)
  getAllCourses: async (req, res) => {
    try {
      const courses = await courseService.getAllCourses();

      res.json({
        success: true,
        message: "Lấy danh sách courses thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách courses",
        error: error.message,
      });
    }
  },

  // ========== ClassService APIs theo API_TIME_MANAGEMENT_GUIDE.md ==========

  // Tạo session mới cho class
  createClassSession: async (req, res) => {
    try {
      const { classId } = req.params;
      const { title, description, timeslots, allowOverlap, maxOverlapMinutes } =
        req.body;

      // Validate required fields
      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassId is required",
          type: "validation_error",
        });
      }

      // Validate session data
      const validationErrors = validateSessionData({ title, timeslots });
      if (validationErrors) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
          type: "validation_error",
        });
      }

      console.log(
        `Creating session for class ${classId}, title: ${title}, timeslots: ${timeslots.length}`
      );

      const sessionData = await classService.createClassSession(classId, {
        title,
        description,
        timeslots,
        options: {
          allowOverlap: allowOverlap || false,
          maxOverlapMinutes: maxOverlapMinutes || 0,
        },
      });

      res.status(201).json({
        success: true,
        message: "Tạo session thành công",
        data: sessionData,
      });
    } catch (error) {
      console.error("Error creating class session:", error);

      // Handle specific error types
      if (error.message.includes("trùng thời gian")) {
        return res.status(409).json({
          success: false,
          message: error.message, // Sử dụng error message chi tiết thay vì "Conflict detected"
          error: error.message,
          type: "timeslot_conflict",
        });
      } else if (error.message.includes("Class not found")) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
          error: error.message,
          type: "class_not_found",
        });
      } else if (error.message.includes("Instructor not found")) {
        return res.status(404).json({
          success: false,
          message: "Instructor not found",
          error: error.message,
          type: "instructor_not_found",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Lỗi khi tạo session",
          error: error.message,
          type: "server_error",
        });
      }
    }
  },

  // Lấy sessions của class
  getClassSessions: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassId là bắt buộc",
        });
      }

      const sessions = await classService.getClassSessions(classId);

      res.json({
        success: true,
        message: "Lấy danh sách sessions thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting class sessions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions",
        error: error.message,
      });
    }
  },

  // Cập nhật session
  updateClassSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { title, description, timeslots } = req.body;

      if (!sessionId || !title || !timeslots || !Array.isArray(timeslots)) {
        return res.status(400).json({
          success: false,
          message: "SessionId, title và timeslots là bắt buộc",
        });
      }

      const sessionData = await classService.updateClassSession(sessionId, {
        title,
        description,
        timeslots,
      });

      res.json({
        success: true,
        message: "Cập nhật session thành công",
        data: sessionData,
      });
    } catch (error) {
      console.error("Error updating class session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật session",
        error: error.message,
      });
    }
  },

  // Xóa session
  deleteClassSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "SessionId là bắt buộc",
        });
      }

      const deleted = await classService.deleteClassSession(sessionId);

      res.json({
        success: true,
        message: "Xóa session thành công",
        data: deleted,
      });
    } catch (error) {
      console.error("Error deleting class session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa session",
        error: error.message,
      });
    }
  },

  // Lấy enrolled students của class
  getClassEnrollments: async (req, res) => {
    try {
      const { classId } = req.params;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: "ClassId là bắt buộc",
        });
      }

      const enrollments = await enrollmentService.getClassEnrollments(classId);

      res.json({
        success: true,
        message: "Lấy danh sách enrollments thành công",
        data: enrollments,
      });
    } catch (error) {
      console.error("Error getting class enrollments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách enrollments",
        error: error.message,
      });
    }
  },
};

module.exports = classController;
