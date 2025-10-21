const { body, validationResult } = require("express-validator");

// Middleware để xử lý validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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

  body("ZoomURL")
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === "") return true; // cho phép rỗng
      try {
        new URL(val);
        return true;
      } catch {
        throw new Error("ZoomURL phải là URL hợp lệ");
      }
    }),

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

  body("ZoomURL").optional().isURL().withMessage("ZoomURL phải là URL hợp lệ"),

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

// Validation cho Session
const validateSession = [
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

  handleValidationErrors,
];

// Validation cho Session Update
const validateSessionUpdate = [
  body("Title")
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage("Title phải từ 3-255 ký tự"),

  body("Description")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Description phải tối thiểu 10 ký tự"),

  body("InstructorID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("InstructorID phải là số nguyên dương"),

  body("ClassID")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ClassID phải là số nguyên dương"),

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
  validateEnrollment,
  validateSessionTimeslot,
  validateSessionTimeslotUpdate,
  validateAttendance,
  validateAttendanceUpdate,
};
