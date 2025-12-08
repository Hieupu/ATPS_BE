const classService = require("../services/classService");
const courseService = require("../services/CourseService");
const instructorService = require("../services/instructorService");
const enrollmentService = require("../services/enrollmentService");
const logService = require("../services/logService");
const notificationRepository = require("../repositories/notificationRepository");
const instructorRepository = require("../repositories/instructorRepository");
const accountRepository = require("../repositories/accountRepository");

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
      console.log(`[getClassesByInstructorId] Request URL: ${req.originalUrl}`);
      console.log(`[getClassesByInstructorId] Params:`, req.params);
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

  // =====================================================
  // WORKFLOW 4 BƯỚC - CLASS MANAGEMENT
  // =====================================================

  // Bước 1: Admin tạo lớp mới
  createClass: async (req, res) => {
    try {
      console.log("[classController] ========== createClass START ==========");
      console.log("[classController] Request method:", req.method);
      console.log("[classController] Request URL:", req.originalUrl);
      console.log("[classController] Request headers:", req.headers);
      // Log request body để debug (có thể xóa sau)
      console.log(
        "[classController] Create Class Request Body:",
        JSON.stringify(req.body, null, 2)
      );

      const {
        Name,
        CourseID,
        InstructorID,
        Fee,
        OpendatePlan,
        EnddatePlan,
        Numofsession,
        Maxstudent,
        ZoomID,
        Zoompass,
        // Support old field names for backward compatibility
        StartDate,
        ExpectedSessions,
        MaxLearners,
      } = req.body;

      // Support both Name and ClassName (backward compatibility)
      const className = Name || req.body.ClassName;

      // Support old field names: StartDate -> OpendatePlan, ExpectedSessions -> Numofsession, MaxLearners -> Maxstudent
      const opendatePlan = OpendatePlan || StartDate;
      const numofsession = Numofsession || ExpectedSessions;
      const maxstudent = Maxstudent || MaxLearners;

      // Validation bắt buộc theo dbver5
      // Kiểm tra kỹ: null, undefined, empty string, hoặc 0 (cho số)
      const requiredFields = {
        Name: className,
        InstructorID: InstructorID,
        OpendatePlan: opendatePlan,
        Numofsession: numofsession,
        Maxstudent: maxstudent,
      };

      const missingFields = Object.keys(requiredFields).filter((field) => {
        const value = requiredFields[field];
        // Kiểm tra null, undefined, empty string
        if (value === null || value === undefined || value === "") {
          return true;
        }
        // Kiểm tra số: không được là 0 hoặc NaN
        if (
          field === "Numofsession" ||
          field === "Maxstudent" ||
          field === "InstructorID"
        ) {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue <= 0) {
            return true;
          }
        }
        return false;
      });

      if (missingFields.length > 0) {
        console.error(
          "[classController] ERROR: Missing required fields:",
          missingFields
        );
        console.error("[classController] Field values:", {
          Name: className,
          InstructorID,
          OpendatePlan: opendatePlan,
          Numofsession: numofsession,
          Maxstudent: maxstudent,
          "Raw OpendatePlan": OpendatePlan,
          "Raw StartDate": StartDate,
          "Raw Numofsession": Numofsession,
          "Raw ExpectedSessions": ExpectedSessions,
          "Raw Maxstudent": Maxstudent,
          "Raw MaxLearners": MaxLearners,
        });

        // Tạo errors object cho từng field thiếu
        const errors = {};
        missingFields.forEach((field) => {
          errors[field] = `${field} là trường bắt buộc`;
        });

        return res.status(400).json({
          success: false,
          message: `Các trường bắt buộc: ${missingFields.join(", ")}`,
          errors: errors,
        });
      }

      // Validation Date format cho OpendatePlan
      if (opendatePlan && !/^\d{4}-\d{2}-\d{2}$/.test(opendatePlan)) {
        return res.status(400).json({
          success: false,
          message: "OpendatePlan phải có format YYYY-MM-DD",
          errors: {
            OpendatePlan: "OpendatePlan phải có format YYYY-MM-DD",
          },
        });
      }

      // Validation Date format cho EnddatePlan (nếu có)
      if (EnddatePlan && !/^\d{4}-\d{2}-\d{2}$/.test(EnddatePlan)) {
        return res.status(400).json({
          success: false,
          message: "EnddatePlan phải có format YYYY-MM-DD",
          errors: {
            EnddatePlan: "EnddatePlan phải có format YYYY-MM-DD",
          },
        });
      }

      // Validation Numofsession
      const numofsessionValue = Number(numofsession);
      if (isNaN(numofsessionValue) || numofsessionValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số buổi dự kiến phải lớn hơn 0",
          errors: {
            Numofsession: "Số buổi dự kiến phải lớn hơn 0",
          },
        });
      }

      // Validation sĩ số
      const maxstudentValue = Number(maxstudent);
      if (isNaN(maxstudentValue) || maxstudentValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Sĩ số tối đa phải lớn hơn 0",
          errors: {
            Maxstudent: "Sĩ số tối đa phải lớn hơn 0",
          },
        });
      }

      // Tạo lớp với status DRAFT (dbver5: không có ZoomURL)
      console.log(
        "[classController] Calling classService.createClass with data:",
        {
          Name: className,
          CourseID: CourseID || null,
          InstructorID,
          Fee: Fee || null,
          OpendatePlan: opendatePlan,
          EnddatePlan: EnddatePlan || null,
          Numofsession: numofsessionValue,
          Maxstudent: maxstudentValue,
          ZoomID: ZoomID || null,
          Zoompass: Zoompass || null,
          Status: "DRAFT",
        }
      );

      const classData = await classService.createClass({
        Name: className,
        CourseID: CourseID || null,
        InstructorID,
        Fee: Fee || null,
        OpendatePlan: opendatePlan,
        EnddatePlan: EnddatePlan || null,
        Numofsession: numofsessionValue,
        Maxstudent: maxstudentValue,
        ZoomID: ZoomID || null,
        Zoompass: Zoompass || null,
        Status: "DRAFT",
      });

      console.log(
        "[classController] classService.createClass result:",
        JSON.stringify(classData, null, 2)
      );

      const classId = classData?.ClassID;
      const classDisplayName = className || `Class ${classId}`;

      console.log("[classController] Created class with ID:", classId);

      // Tạo sessions nếu có trong request body
      console.log("[classController] Checking for sessions in request body...");
      console.log("[classController] req.body.sessions:", req.body.sessions);
      console.log(
        "[classController] Is array?",
        Array.isArray(req.body.sessions)
      );
      console.log("[classController] Length:", req.body.sessions?.length || 0);

      let createdSessions = [];
      if (
        req.body.sessions &&
        Array.isArray(req.body.sessions) &&
        req.body.sessions.length > 0
      ) {
        console.log("[classController] Processing sessions...");
        const sessionRepository = require("../repositories/sessionRepository");
        const {
          validateDateDayConsistency,
        } = require("../utils/sessionValidation");
        const timeslotRepository = require("../repositories/timeslotRepository");

        // Validate và chuẩn bị sessions data
        const sessionsData = [];
        const sessionErrors = {};

        for (let index = 0; index < req.body.sessions.length; index++) {
          const session = req.body.sessions[index];

          // Validate required fields
          if (!session.Date || !session.TimeslotID) {
            sessionErrors[`session_${index}`] = `Session ${
              index + 1
            } thiếu Date hoặc TimeslotID`;
            continue;
          }

          // Validate Date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(session.Date)) {
            sessionErrors[`session_${index}_Date`] = `Session ${
              index + 1
            }: Date phải có format YYYY-MM-DD`;
            continue;
          }

          // Validate Date vs Timeslot Day
          // NOTE: Bỏ qua validation này vì một timeslot có thể được dùng cho nhiều ngày khác nhau
          // Trường Day trong bảng timeslot chỉ là gợi ý/mặc định, không phải ràng buộc cứng
          // Nếu cần strict validation, có thể bật lại bằng cách uncomment đoạn code dưới
          /*
          try {
            const timeslot = await timeslotRepository.findById(
              session.TimeslotID
            );
            if (timeslot && timeslot.Day) {
              const { getDayOfWeek } = require("../utils/sessionValidation");
              const dateDay = getDayOfWeek(session.Date);

              if (dateDay !== timeslot.Day) {
                sessionErrors[`session_${index}_Date`] = `Session ${
                  index + 1
                }: Date ${
                  session.Date
                } (${dateDay}) không khớp với Timeslot Day (${timeslot.Day})`;
                continue;
              }
            }
          } catch (error) {
            console.error(`Error validating session ${index + 1}:`, error);
            sessionErrors[`session_${index}`] = `Session ${
              index + 1
            }: Lỗi khi validate - ${error.message}`;
            continue;
          }
          */

          sessionsData.push({
            ClassID: classId,
            Title: session.Title || `Session for class ${classDisplayName}`,
            Description: session.Description || "",
            Date: session.Date,
            TimeslotID: session.TimeslotID,
            InstructorID: session.InstructorID || InstructorID,
            ZoomUUID: session.ZoomUUID || null, // Sẽ được tự động tạo nếu null
          });
        }

        // Nếu có lỗi validation, trả về lỗi
        if (Object.keys(sessionErrors).length > 0) {
          return res.status(400).json({
            success: false,
            message: "Có lỗi validation trong sessions",
            errors: sessionErrors,
          });
        }

        // Tạo sessions bằng bulk insert
        if (sessionsData.length > 0) {
          await sessionRepository.createBulk(sessionsData);
          createdSessions = sessionsData;
          console.log(
            `Đã tạo ${sessionsData.length} sessions cho lớp ${classId}`
          );
        }
      }

      // Đảm bảo ClassID ở vị trí cố định: response.data.ClassID
      const responseData = {
        success: true,
        message: "Tạo lớp học thành công",
        data: {
          ...classData,
          ClassID: classId, // Đảm bảo ClassID có trong data
        },
        ClassID: classId, // Giữ lại ở root level để backward compatibility
        sessionsCreated: createdSessions.length,
        sessions: createdSessions.length > 0 ? createdSessions : undefined,
      };

      console.log(
        "[classController] ========== createClass SUCCESS =========="
      );
      console.log(
        "[classController] Response data:",
        JSON.stringify(responseData, null, 2)
      );
      console.log("[classController] ClassID:", classId);
      console.log(
        "[classController] Sessions created:",
        createdSessions.length
      );

      res.status(201).json(responseData);
    } catch (error) {
      console.error(
        "[classController] ========== createClass ERROR =========="
      );
      console.error("[classController] Error creating class:", error);
      console.error("[classController] Error name:", error?.name);
      console.error("[classController] Error message:", error?.message);
      console.error("[classController] Error stack:", error?.stack);

      // Nếu là validation error từ session validation, trả về 400
      if (
        error.message &&
        (error.message.includes("thiếu") ||
          error.message.includes("format") ||
          error.message.includes("không khớp"))
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: {
            sessions: error.message,
          },
        });
      }

      // Server error
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo lớp học",
        error: error.message,
      });
    }
  },

  // Bước 2: Gửi lớp cho giảng viên
  sendToInstructor: async (req, res) => {
    try {
      const { classId } = req.params;
      const adminAccID = req.user ? req.user.AccID : null;

      // Kiểm tra lớp tồn tại
      const classData = await classService.getClassById(classId);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: "Lớp học không tồn tại",
        });
      }

      // Kiểm tra status hiện tại
      if (classData.Status !== "DRAFT") {
        return res.status(400).json({
          success: false,
          message: "Lớp học không ở trạng thái DRAFT",
        });
      }

      // Kiểm tra lớp đã có sessions chưa
      const sessionRepository = require("../repositories/sessionRepository");
      const sessions = await sessionRepository.findByClassId(classId);

      if (!sessions || sessions.length === 0) {
        return res.status(400).json({
          error: true,
          success: false,
          message:
            "Lớp học chưa có lịch học chi tiết. Vui lòng thêm lịch học trước khi gửi cho giảng viên.",
          code: "MISSING_SCHEDULE",
          details: {
            classId: classId,
            requiredFields: ["sessions with TimeslotID and Date"],
          },
        });
      }

      // Kiểm tra số buổi dự kiến (Numofsession) phải bằng số sessions đã tạo
      const numofsession = classData.Numofsession || 0;
      const actualSessionsCount = sessions.length;

      if (actualSessionsCount !== numofsession) {
        return res.status(400).json({
          error: true,
          success: false,
          message: `Lớp học chưa đủ số buổi dự kiến. Số buổi dự kiến: ${numofsession}, số buổi đã tạo: ${actualSessionsCount}. Vui lòng thêm đủ ${numofsession} buổi học trước khi gửi cho giảng viên.`,
          code: "INSUFFICIENT_SESSIONS",
          details: {
            classId: classId,
            expectedSessions: numofsession,
            actualSessions: actualSessionsCount,
            missingSessions: numofsession - actualSessionsCount,
          },
        });
      }

      // Cập nhật status: DRAFT -> APPROVED (admin duyệt lớp)
      // Lưu ý: Đã loại bỏ WAITING/PENDING vì admin đã chọn course từ bước 1
      const updatedClass = await classService.updateClass(classId, {
        Status: "APPROVED",
      });

      // Lấy thông tin giảng viên để gửi notification
      const instructor = await instructorRepository.findById(
        classData.InstructorID
      );

      // Tạo notification cho giảng viên
      if (instructor) {
        const notificationContent = `Lớp học "${classData.Name}" đã được duyệt và sẵn sàng để kích hoạt.`;

        await notificationRepository.create({
          Content: notificationContent,
          Type: "class_approved",
          Status: "unread",
          AccID: instructor.AccID,
        });
      }

      // Ghi log
      if (adminAccID) {
        await logService.logAction({
          action: "APPROVE_CLASS",
          accId: adminAccID,
          detail: `ClassID: ${classId}, ClassName: ${classData.Name}`,
        });
      }

      res.json({
        success: true,
        data: {
          ClassID: classId,
          Status: "APPROVED",
          message:
            "Đã duyệt lớp học thành công. Lớp sẽ tự động chuyển sang ACTIVE khi đủ điều kiện.",
        },
      });
    } catch (error) {
      console.error("Error sending class to instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi gửi lớp cho giảng viên",
        error: error.message,
      });
    }
  },

  // Bước 3: Admin kiểm duyệt lớp
  reviewClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { action, adminFeedback } = req.body; // action: 'APPROVE' hoặc 'REJECT'
      const adminAccID = req.user ? req.user.AccID : null; // From auth middleware (có thể null khi testing)

      if (!action || !["APPROVE", "REJECT"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action phải là 'APPROVE' hoặc 'REJECT'",
        });
      }

      // Kiểm tra lớp tồn tại
      const classData = await classService.getClassById(classId);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: "Lớp học không tồn tại",
        });
      }

      // Kiểm tra status hiện tại: chỉ chấp nhận DRAFT
      // Lưu ý: Đã loại bỏ WAITING/PENDING vì admin đã chọn course từ bước 1
      if (classData.Status !== "DRAFT") {
        return res.status(400).json({
          success: false,
          message: "Lớp học không ở trạng thái DRAFT",
        });
      }

      // Cập nhật status
      const updateData = {
        Status: action === "APPROVE" ? "APPROVED" : "DRAFT",
        AdminFeedback: adminFeedback || null,
      };

      const updatedClass = await classService.updateClass(classId, updateData);

      // Lấy thông tin giảng viên để gửi notification
      const instructor = await instructorRepository.findById(
        classData.InstructorID
      );

      // Tạo notification cho giảng viên (chỉ khi REJECT)
      if (action === "REJECT" && instructor && instructor.AccID) {
        const notificationContent = adminFeedback
          ? `Lớp học "${classData.Name}" bị từ chối với lý do: ${adminFeedback}`
          : `Lớp học "${classData.Name}" bị từ chối. Vui lòng chỉnh sửa và gửi lại.`;

        await notificationRepository.create({
          Content: notificationContent,
          Type: "class_rejected",
          Status: "unread",
          AccID: instructor.AccID,
        });
      }

      // Ghi log (chỉ khi có adminAccID)
      if (adminAccID) {
        await logService.logAction({
          action: action === "APPROVE" ? "APPROVE_CLASS" : "REJECT_CLASS",
          accId: adminAccID,
          detail: `ClassID: ${classId}, ClassName: ${classData.Name}`,
        });
      }

      res.json({
        success: true,
        message:
          action === "APPROVE" ? "Duyệt lớp thành công" : "Trả về chỉnh sửa",
        data: updatedClass,
      });
    } catch (error) {
      console.error("Error reviewing class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm duyệt lớp",
        error: error.message,
      });
    }
  },

  // Bước 4: Admin xuất bản lớp
  publishClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const adminAccID = req.user ? req.user.AccID : null; // From auth middleware (có thể null khi testing)

      // Kiểm tra lớp tồn tại
      const classData = await classService.getClassById(classId);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: "Lớp học không tồn tại",
        });
      }

      // Kiểm tra status hiện tại
      if (classData.Status !== "APPROVED") {
        return res.status(400).json({
          success: false,
          message: "Lớp học chưa được duyệt",
        });
      }

      // Cập nhật status: APPROVED -> ACTIVE (thay thế PUBLISHED/OPEN)
      const updatedClass = await classService.updateClass(classId, {
        Status: "ACTIVE",
      });

      // Lấy thông tin giảng viên để gửi notification
      const instructor = await instructorRepository.findById(
        classData.InstructorID
      );

      // Tạo notification cho giảng viên
      if (instructor && instructor.AccID) {
        const notificationContent = `Lớp học "${classData.Name}" đã được xuất bản thành công.`;

        await notificationRepository.create({
          Content: notificationContent,
          Type: "class_published",
          Status: "unread",
          AccID: instructor.AccID,
        });
      }

      // Ghi log (chỉ khi có adminAccID)
      if (adminAccID) {
        await logService.logAction({
          action: "PUBLISH_CLASS",
          accId: adminAccID,
          detail: `ClassID: ${classId}, ClassName: ${classData.Name}`,
        });
      }

      res.json({
        success: true,
        message: "Xuất bản lớp thành công",
        data: updatedClass,
      });
    } catch (error) {
      console.error("Error publishing class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xuất bản lớp",
        error: error.message,
      });
    }
  },

  // Lấy danh sách lớp theo status
  getClassesByStatus: async (req, res) => {
    try {
      const { status } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const classes = await classService.getClassesByStatus(status, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        message: "Lấy danh sách lớp theo status thành công",
        data: classes,
      });
    } catch (error) {
      console.error("Error getting classes by status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp",
        error: error.message,
      });
    }
  },

  // Cập nhật status của class (cho frontend compatibility với PUT /:classId/status)
  // Hỗ trợ các trường hợp: PENDING_APPROVAL, APPROVED, PUBLISHED, DRAFT, REJECTED
  updateClassStatus: async (req, res) => {
    try {
      const { classId } = req.params;
      const { Status } = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      if (!Status) {
        return res.status(400).json({
          success: false,
          message: "Status là bắt buộc",
        });
      }

      // Kiểm tra lớp tồn tại
      const classData = await classService.getClassById(classId);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: "Lớp học không tồn tại",
        });
      }

      // Xử lý các trường hợp status khác nhau
      if (Status === "APPROVED") {
        // Chuyển từ DRAFT sang APPROVED
        if (classData.Status !== "DRAFT") {
          return res.status(400).json({
            success: false,
            message: "Lớp học không ở trạng thái DRAFT",
          });
        }

        // Kiểm tra lớp đã có sessions chưa
        const sessionRepository = require("../repositories/sessionRepository");
        const sessions = await sessionRepository.findByClassId(classId);

        if (!sessions || sessions.length === 0) {
          return res.status(400).json({
            error: true,
            success: false,
            message:
              "Lớp học chưa có lịch học chi tiết. Vui lòng thêm lịch học trước khi duyệt.",
            code: "MISSING_SCHEDULE",
            details: {
              classId: classId,
              requiredFields: ["sessions with TimeslotID and Date"],
            },
          });
        }

        // Cập nhật status: DRAFT -> APPROVED
        const updatedClass = await classService.updateClass(classId, {
          Status: "APPROVED",
        });

        // Lấy thông tin giảng viên để gửi notification
        const instructor = await instructorRepository.findById(
          classData.InstructorID
        );

        // Tạo notification cho giảng viên
        if (instructor) {
          const notificationContent = `Lớp học "${classData.Name}" đã được duyệt và sẵn sàng để kích hoạt.`;

          await notificationRepository.create({
            Content: notificationContent,
            Type: "class_approved",
            Status: "unread",
            AccID: instructor.AccID,
          });
        }

        // Ghi log
        if (adminAccID) {
          await logService.logAction({
            action: "APPROVE_CLASS",
            accId: adminAccID,
            detail: `ClassID: ${classId}, ClassName: ${classData.Name}`,
          });
        }

        return res.json({
          success: true,
          data: {
            ClassID: classId,
            Status: "APPROVED",
            message:
              "Đã duyệt lớp học thành công. Lớp sẽ tự động chuyển sang ACTIVE khi đủ điều kiện.",
          },
        });
      } else if (
        Status === "ACTIVE" ||
        Status === "OPEN" ||
        Status === "PUBLISHED"
      ) {
        // Hỗ trợ alias: OPEN, PUBLISHED -> ACTIVE
        const updatedClass = await classService.updateClass(classId, {
          Status: "ACTIVE",
        });

        return res.json({
          success: true,
          message: "Cập nhật status thành công",
          data: updatedClass,
        });
      } else if (
        Status === "CLOSE" ||
        Status === "CLOSED" ||
        Status === "DONE" ||
        Status === "COMPLETED"
      ) {
        // Hỗ trợ alias: CLOSED, DONE, COMPLETED -> CLOSE
        const updatedClass = await classService.updateClass(classId, {
          Status: "CLOSE",
        });

        return res.json({
          success: true,
          message: "Cập nhật status thành công",
          data: updatedClass,
        });
      } else if (Status === "CANCEL" || Status === "CANCELLED") {
        // Hỗ trợ alias: CANCELLED -> CANCEL
        // Gọi method cancelClass để xử lý logic hủy lớp
        const result = await classService.cancelClass(classId);

        return res.json({
          success: true,
          message: `Hủy lớp thành công. Đã xóa ${result.deletedSessions} buổi học và tạo ${result.refundRequests} yêu cầu hoàn tiền.`,
          data: result,
        });
      } else {
        // Các trường hợp status khác: APPROVED, PUBLISHED, DRAFT, REJECTED
        // Chỉ cập nhật status, không có logic đặc biệt
        const updatedClass = await classService.updateClass(classId, {
          Status: Status,
        });

        return res.json({
          success: true,
          message: "Cập nhật status thành công",
          data: updatedClass,
        });
      }
    } catch (error) {
      console.error("Error updating class status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật status",
        error: error.message,
      });
    }
  },
};

module.exports = classController;
