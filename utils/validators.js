const { body, validationResult } = require("express-validator");

// Middleware để xử lý validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("[Validation Error]", {
      path: req.path,
      method: req.method,
      body: req.body,
      errors: errors.array(),
    });
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

// Validation cho Class
const validateClass = [
  body("ClassName")
    .notEmpty()
    .withMessage("ClassName là bắt buộc")
    .isLength({ min: 1, max: 45 })
    .withMessage("ClassName phải có độ dài từ 1 đến 45 ký tự"),

  body("CourseID")
    .notEmpty()
    .withMessage("CourseID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("CourseID phải là số nguyên dương"),

  body("InstructorID")
    .notEmpty()
    .withMessage("InstructorID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  body("Status")
    .optional()
    .isIn([
      "Chưa phân giảng viên",
      "Sắp khai giảng",
      "Đang hoạt động",
      "Đã kết thúc",
      "Tạm dừng",
    ])
    .withMessage(
      "Status phải là một trong: Chưa phân giảng viên, Sắp khai giảng, Đang hoạt động, Đã kết thúc, Tạm dừng"
    ),

  // dbver5: Không có ZoomURL, chỉ có ZoomID và Zoompass
  body("ZoomID")
    .optional({ nullable: true })
    .isLength({ max: 11 })
    .withMessage("ZoomID tối đa 11 ký tự"),

  body("Zoompass")
    .optional({ nullable: true })
    .isLength({ max: 6 })
    .withMessage("Zoompass tối đa 6 ký tự"),

  body("OpendatePlan")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("OpendatePlan phải là ngày hợp lệ (YYYY-MM-DD)"),

  body("EnddatePlan")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("EnddatePlan phải là ngày hợp lệ (YYYY-MM-DD)"),

  body("Numofsession")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Numofsession phải là số nguyên dương"),

  body("Maxstudent")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Maxstudent phải là số nguyên dương"),

  handleValidationErrors,
];

// Validation cho Class Update
const validateClassUpdate = [
  body("ClassName")
    .optional()
    .isLength({ min: 1, max: 45 })
    .withMessage("ClassName phải có độ dài từ 1 đến 45 ký tự"),

  body("Status")
    .optional()
    .isIn([
      "Chưa phân giảng viên",
      "Sắp khai giảng",
      "Đang hoạt động",
      "Đã kết thúc",
      "Tạm dừng",
    ])
    .withMessage(
      "Status phải là một trong: Chưa phân giảng viên, Sắp khai giảng, Đang hoạt động, Đã kết thúc, Tạm dừng"
    ),

  // dbver5: Không có ZoomURL, chỉ có ZoomID và Zoompass
  body("ZoomID")
    .optional({ nullable: true })
    .isLength({ max: 11 })
    .withMessage("ZoomID tối đa 11 ký tự"),

  body("Zoompass")
    .optional({ nullable: true })
    .isLength({ max: 6 })
    .withMessage("Zoompass tối đa 6 ký tự"),

  body("OpendatePlan")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("OpendatePlan phải là ngày hợp lệ (YYYY-MM-DD)"),

  body("EnddatePlan")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("EnddatePlan phải là ngày hợp lệ (YYYY-MM-DD)"),

  body("Numofsession")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Numofsession phải là số nguyên dương"),

  body("Maxstudent")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Maxstudent phải là số nguyên dương"),

  body("CourseID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("CourseID phải là số nguyên dương"),

  body("InstructorID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  handleValidationErrors,
];

// Validation cho Course
const validateCourse = [
  body("Title")
    .notEmpty()
    .withMessage("Title là bắt buộc")
    .isLength({ min: 3, max: 255 })
    .withMessage("Title phải từ 3-255 ký tự"),

  body("Description")
    .notEmpty()
    .withMessage("Description là bắt buộc")
    .isLength({ min: 10 })
    .withMessage("Description phải tối thiểu 10 ký tự"),

  body("Duration")
    .notEmpty()
    .withMessage("Duration là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("Duration phải là số nguyên dương (giờ)"),

  body("TuitionFee")
    .notEmpty()
    .withMessage("TuitionFee là bắt buộc")
    .isFloat({ min: 0 })
    .withMessage("TuitionFee phải là số dương (VND)"),

  body("Status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status phải là Active hoặc Inactive"),

  body("InstructorID")
    .notEmpty()
    .withMessage("InstructorID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  handleValidationErrors,
];

// Validation cho Course Update
const validateCourseUpdate = [
  body("Title")
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage("Title phải từ 3-255 ký tự"),

  body("Description")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Description phải tối thiểu 10 ký tự"),

  body("Duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration phải là số nguyên dương (giờ)"),

  body("TuitionFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("TuitionFee phải là số dương (VND)"),

  body("Status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status phải là Active hoặc Inactive"),

  handleValidationErrors,
];

// Validation cho Timeslot
const validateTimeslot = [
  body("StartTime")
    .notEmpty()
    .withMessage("StartTime là bắt buộc")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage("StartTime phải có format HH:mm:ss"),

  body("EndTime")
    .notEmpty()
    .withMessage("EndTime là bắt buộc")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage("EndTime phải có format HH:mm:ss")
    .custom((value, { req }) => {
      if (req.body.StartTime && value <= req.body.StartTime) {
        throw new Error("EndTime phải sau StartTime");
      }
      return true;
    }),

  body("Date")
    .notEmpty()
    .withMessage("Date là bắt buộc")
    .isISO8601()
    .withMessage("Date phải là ngày hợp lệ (YYYY-MM-DD)")
    .custom((value) => {
      const today = new Date().toISOString().split("T")[0];
      if (value < today) {
        throw new Error("Date không được là ngày đã qua");
      }
      return true;
    }),

  handleValidationErrors,
];

// Validation cho Timeslot Update
const validateTimeslotUpdate = [
  body("StartTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage("StartTime phải có format HH:mm:ss"),

  body("EndTime")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
    .withMessage("EndTime phải có format HH:mm:ss")
    .custom((value, { req }) => {
      if (req.body.StartTime && value && value <= req.body.StartTime) {
        throw new Error("EndTime phải sau StartTime");
      }
      return true;
    }),

  body("Date")
    .optional()
    .isISO8601()
    .withMessage("Date phải là ngày hợp lệ (YYYY-MM-DD)"),

  handleValidationErrors,
];

// Validation cho Material
const validateMaterial = [
  body("Title")
    .notEmpty()
    .withMessage("Title là bắt buộc")
    .isLength({ min: 3, max: 255 })
    .withMessage("Title phải từ 3-255 ký tự"),

  body("Description")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Description phải tối thiểu 10 ký tự"),

  body("FileURL")
    .notEmpty()
    .withMessage("FileURL là bắt buộc")
    .isLength({ min: 1 })
    .withMessage("FileURL không được để trống"),

  body("CourseID")
    .notEmpty()
    .withMessage("CourseID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("CourseID phải là số nguyên dương"),

  body("SessionID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("SessionID phải là số nguyên dương"),

  body("MaterialType")
    .optional()
    .isIn(["PDF", "Video", "Document", "Image"])
    .withMessage("MaterialType phải là một trong: PDF, Video, Document, Image"),

  body("Status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status phải là Active hoặc Inactive"),

  handleValidationErrors,
];

// Validation cho Material Update
const validateMaterialUpdate = [
  body("Title")
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage("Title phải từ 3-255 ký tự"),

  body("Description")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Description phải tối thiểu 10 ký tự"),

  body("FileURL")
    .optional()
    .isLength({ min: 1 })
    .withMessage("FileURL không được để trống"),

  body("MaterialType")
    .optional()
    .isIn(["PDF", "Video", "Document", "Image"])
    .withMessage("MaterialType phải là một trong: PDF, Video, Document, Image"),

  body("Status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status phải là Active hoặc Inactive"),

  handleValidationErrors,
];

// Validation cho Session (dbver3 schema)
const validateSession = [
  body("Title")
    .notEmpty()
    .withMessage("Title là bắt buộc")
    .isLength({ min: 1, max: 255 })
    .withMessage("Title phải từ 1-255 ký tự"),

  body("Description")
    .optional({ nullable: true })
    .isLength({ max: 10000 })
    .withMessage("Description tối đa 10000 ký tự"),

  body("InstructorID")
    .notEmpty()
    .withMessage("InstructorID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  body("ClassID")
    .notEmpty()
    .withMessage("ClassID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("ClassID phải là số nguyên dương"),

  body("TimeslotID")
    .notEmpty()
    .withMessage("TimeslotID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("TimeslotID phải là số nguyên dương"),

  body("Date")
    .notEmpty()
    .withMessage("Date là bắt buộc")
    .isISO8601()
    .withMessage("Date phải là ngày hợp lệ (YYYY-MM-DD)")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionDate = new Date(value);
      sessionDate.setHours(0, 0, 0, 0);
      if (sessionDate < today) {
        throw new Error("Date không được là ngày đã qua");
      }
      return true;
    }),

  handleValidationErrors,
];

// Validation cho Session Update (dbver3 schema)
const validateSessionUpdate = [
  body("Title")
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage("Title phải từ 1-255 ký tự"),

  body("Description")
    .optional({ nullable: true })
    .isLength({ max: 10000 })
    .withMessage("Description tối đa 10000 ký tự"),

  body("InstructorID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  body("ClassID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ClassID phải là số nguyên dương"),

  body("TimeslotID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("TimeslotID phải là số nguyên dương"),

  body("Date")
    .optional()
    .isISO8601()
    .withMessage("Date phải là ngày hợp lệ (YYYY-MM-DD)")
    .custom((value) => {
      if (value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionDate = new Date(value);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate < today) {
          throw new Error("Date không được là ngày đã qua");
        }
      }
      return true;
    }),

  handleValidationErrors,
];

// Validation cho Enrollment
const validateEnrollment = [
  body("classId")
    .notEmpty()
    .withMessage("ClassID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("ClassID phải là số nguyên dương"),

  body("learnerId")
    .notEmpty()
    .withMessage("LearnerID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("LearnerID phải là số nguyên dương"),

  handleValidationErrors,
];

// SessionTimeslot validators
const validateSessionTimeslot = [
  body("SessionID")
    .notEmpty()
    .withMessage("SessionID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("SessionID phải là số nguyên dương"),

  body("TimeslotID")
    .notEmpty()
    .withMessage("TimeslotID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("TimeslotID phải là số nguyên dương"),

  handleValidationErrors,
];

const validateSessionTimeslotUpdate = [
  body("SessionID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("SessionID phải là số nguyên dương"),

  body("TimeslotID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("TimeslotID phải là số nguyên dương"),

  handleValidationErrors,
];

// Attendance validators
const validateAttendance = [
  body("LearnerID")
    .notEmpty()
    .withMessage("LearnerID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("LearnerID phải là số nguyên dương"),

  body("sessiontimeslotID")
    .notEmpty()
    .withMessage("sessiontimeslotID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("sessiontimeslotID phải là số nguyên dương"),

  body("Status")
    .optional()
    .isIn(["Present", "Absent", "Late", "Excused"])
    .withMessage("Status phải là một trong: Present, Absent, Late, Excused"),

  body("Date")
    .optional()
    .isISO8601()
    .withMessage("Date phải là ngày hợp lệ (YYYY-MM-DD)"),

  handleValidationErrors,
];

const validateAttendanceUpdate = [
  body("Status")
    .notEmpty()
    .withMessage("Status là bắt buộc")
    .isIn(["Present", "Absent", "Late", "Excused"])
    .withMessage("Status phải là một trong: Present, Absent, Late, Excused"),

  handleValidationErrors,
];

// Validation cho Bulk Create Sessions
const validateBulkSessions = [
  body("sessions")
    .notEmpty()
    .withMessage("sessions là bắt buộc")
    .isArray({ min: 1 })
    .withMessage("sessions phải là một array không rỗng")
    .custom((sessions) => {
      if (!Array.isArray(sessions) || sessions.length === 0) {
        throw new Error("sessions phải là một array không rỗng");
      }
      return true;
    }),

  body("sessions.*.Title")
    .notEmpty()
    .withMessage("Mỗi session phải có Title")
    .isLength({ min: 1, max: 255 })
    .withMessage("Title phải từ 1-255 ký tự"),

  body("sessions.*.Description")
    .optional({ nullable: true })
    .isLength({ max: 10000 })
    .withMessage("Description tối đa 10000 ký tự"),

  body("sessions.*.InstructorID")
    .notEmpty()
    .withMessage("Mỗi session phải có InstructorID")
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  body("sessions.*.ClassID")
    .notEmpty()
    .withMessage("Mỗi session phải có ClassID")
    .isInt({ min: 1 })
    .withMessage("ClassID phải là số nguyên dương"),

  body("sessions.*.TimeslotID")
    .notEmpty()
    .withMessage("Mỗi session phải có TimeslotID")
    .isInt({ min: 1 })
    .withMessage("TimeslotID phải là số nguyên dương"),

  body("sessions.*.Date")
    .notEmpty()
    .withMessage("Mỗi session phải có Date")
    .isISO8601()
    .withMessage("Date phải là ngày hợp lệ (YYYY-MM-DD)")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessionDate = new Date(value);
      sessionDate.setHours(0, 0, 0, 0);
      if (sessionDate < today) {
        throw new Error("Date không được là ngày đã qua");
      }
      return true;
    }),

  handleValidationErrors,
];

// =====================
// Class Wizard validators
// =====================

// Validate body cho analyzeBlockedDays (Class Wizard Step 3)
const validateAnalyzeBlockedDays = [
  body("InstructorID")
    .notEmpty()
    .withMessage("InstructorID là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  body("OpendatePlan")
    .notEmpty()
    .withMessage("OpendatePlan là bắt buộc")
    .isISO8601()
    .withMessage("OpendatePlan phải là ngày hợp lệ (YYYY-MM-DD)"),

  body("Numofsession")
    .notEmpty()
    .withMessage("Numofsession là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("Numofsession phải là số nguyên dương"),

  body("DaysOfWeek")
    .optional({ nullable: true })
    .isArray()
    .withMessage("DaysOfWeek phải là một mảng")
    .bail()
    .custom((value) => {
      if (!Array.isArray(value)) return true;
      const allInts = value.every((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 0 && n <= 6;
      });
      if (!allInts) {
        throw new Error("DaysOfWeek chỉ được chứa số nguyên từ 0-6");
      }
      return true;
    }),

  body("TimeslotsByDay")
    .optional({ nullable: true })
    .custom((value) => {
      if (value == null) return true;
      if (typeof value !== "object" || Array.isArray(value)) {
        throw new Error(
          "TimeslotsByDay phải là object {dayOfWeek: [timeslotIds]}"
        );
      }
      for (const key of Object.keys(value)) {
        const arr = value[key];
        if (!Array.isArray(arr)) {
          throw new Error(
            `TimeslotsByDay[${key}] phải là một mảng timeslotIds`
          );
        }
        const allInts = arr.every((v) => {
          const n = Number(v);
          return Number.isInteger(n) && n > 0;
        });
        if (!allInts) {
          throw new Error(
            `TimeslotsByDay[${key}] chỉ được chứa số nguyên dương (TimeslotID)`
          );
        }
      }
      return true;
    }),

  handleValidationErrors,
];

// Validate body cho searchTimeslots (Class Wizard Step 3 - gợi ý ngày bắt đầu)
const validateSearchTimeslots = [
  body("InstructorID")
    .notEmpty()
    .withMessage("InstructorID là bắt buộc")
    .custom((value) => {
      const num = typeof value === "string" ? parseInt(value, 10) : value;
      if (!Number.isInteger(num) || num < 1) {
        throw new Error("InstructorID phải là số nguyên dương");
      }
      return true;
    }),

  body("DaysOfWeek")
    .notEmpty()
    .withMessage("DaysOfWeek là bắt buộc")
    .isArray({ min: 1 })
    .withMessage("DaysOfWeek phải là một mảng không rỗng")
    .bail()
    .custom((value) => {
      // Chấp nhận cả string và number
      const allValid = value.every((v) => {
        const num = typeof v === "string" ? parseInt(v, 10) : v;
        return Number.isInteger(num) && num >= 0 && num <= 6;
      });
      if (!allValid) {
        throw new Error("DaysOfWeek chỉ được chứa số nguyên từ 0-6");
      }
      return true;
    }),

  body("TimeslotsByDay")
    .notEmpty()
    .withMessage("TimeslotsByDay là bắt buộc")
    .custom((value) => {
      if (typeof value !== "object" || Array.isArray(value)) {
        throw new Error(
          "TimeslotsByDay phải là object {dayOfWeek: [timeslotIds]}"
        );
      }
      const keys = Object.keys(value);
      if (keys.length === 0) {
        throw new Error("TimeslotsByDay không được rỗng");
      }
      for (const key of keys) {
        const arr = value[key];
        if (!Array.isArray(arr)) {
          throw new Error(
            `TimeslotsByDay[${key}] phải là một mảng timeslotIds`
          );
        }
        // Chấp nhận cả string và number cho TimeslotID
        const allValid = arr.every((v) => {
          const num = typeof v === "string" ? parseInt(v, 10) : v;
          return Number.isInteger(num) && num > 0;
        });
        if (!allValid) {
          throw new Error(
            `TimeslotsByDay[${key}] chỉ được chứa số nguyên dương (TimeslotID)`
          );
        }
      }
      return true;
    }),

  body("Numofsession")
    .notEmpty()
    .withMessage("Numofsession là bắt buộc")
    .custom((value) => {
      const num = typeof value === "string" ? parseInt(value, 10) : value;
      if (!Number.isInteger(num) || num < 1) {
        throw new Error("Numofsession phải là số nguyên dương");
      }
      return true;
    }),

  body("sessionsPerWeek")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      const num = typeof value === "string" ? parseInt(value, 10) : value;
      if (!Number.isInteger(num) || num < 0) {
        throw new Error("sessionsPerWeek phải là số nguyên không âm");
      }
      return true;
    }),

  body("requiredSlotsPerWeek")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      const num = typeof value === "string" ? parseInt(value, 10) : value;
      if (!Number.isInteger(num) || num < 0) {
        throw new Error("requiredSlotsPerWeek phải là số nguyên không âm");
      }
      return true;
    }),

  body("currentStartDate")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === "") return true;
      // Chấp nhận cả string và Date object, kiểm tra format YYYY-MM-DD
      const dateStr = typeof value === "string" ? value : value.toString();
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoDateRegex.test(dateStr)) {
        throw new Error("currentStartDate phải là ngày hợp lệ (YYYY-MM-DD)");
      }
      // Kiểm tra xem có phải ngày hợp lệ không
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error("currentStartDate phải là ngày hợp lệ (YYYY-MM-DD)");
      }
      return true;
    }),

  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateClass,
  validateClassUpdate,
  validateCourse,
  validateCourseUpdate,
  validateTimeslot,
  validateTimeslotUpdate,
  validateMaterial,
  validateMaterialUpdate,
  validateSession,
  validateSessionUpdate,
  validateBulkSessions,
  // Class Wizard
  validateAnalyzeBlockedDays,
  validateSearchTimeslots,
  validateEnrollment,
  validateSessionTimeslot,
  validateSessionTimeslotUpdate,
  validateAttendance,
  validateAttendanceUpdate,
};
