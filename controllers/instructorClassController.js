const {
  listInstructorClassesService,
  getInstructorClassDetailService,
  getInstructorClassRosterService,
  getInstructorClassScheduleService,
  getAttendanceSheetService,
  saveAttendanceService,
  getInstructorScheduleService,
  getInstructorAvailabilityService,
  saveInstructorAvailabilityService,
  addInstructorAvailabilityService,
} = require("../services/instructorClassService");
const courseRepository = require("../repositories/instructorCourseRepository");

const getInstructorId = async (accId) => {
  const instructorId = await courseRepository.findInstructorIdByAccountId(
    accId
  );
  if (!instructorId) {
    throw new Error("Instructor không tồn tại");
  }
  return instructorId;
};

const listInstructorClasses = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));
    const result = await listInstructorClassesService(instructorId);
    res.status(200).json(result);
  } catch (error) {
    console.error("listInstructorClasses error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy danh sách lớp",
    });
  }
};

// chi tiết lớp + StudentCount
const getInstructorClassDetail = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));
    const classId = Number(req.params.classId);

    const result = await getInstructorClassDetailService(classId, instructorId);
    res.status(200).json(result);
  } catch (error) {
    console.error("getInstructorClassDetail error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy chi tiết lớp",
    });
  }
};

// tab Danh sách học viên
const getInstructorClassRoster = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));
    const classId = Number(req.params.classId);

    const result = await getInstructorClassRosterService(classId, instructorId);
    res.status(200).json(result);
  } catch (error) {
    console.error("getInstructorClassRoster error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy danh sách học viên",
    });
  }
};

// lịch các buổi học (vào Zoom)
const getInstructorClassSchedule = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));
    const classId = Number(req.params.classId);

    const result = await getInstructorClassScheduleService(
      classId,
      instructorId
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("getInstructorClassSchedule error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy lịch học",
    });
  }
};

// mở form điểm danh
const getAttendanceSheet = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));
    const classId = Number(req.params.classId);
    const sessionId = Number(req.params.sessionId);

    const result = await getAttendanceSheetService(
      sessionId,
      classId,
      instructorId
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("getAttendanceSheet error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy danh sách điểm danh",
    });
  }
};

//  lưu điểm danh
const saveAttendance = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));
    const classId = Number(req.params.classId);
    const sessionId = Number(req.params.sessionId);
    const attendanceData = req.body;

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res
        .status(400)
        .json({ message: "Dữ liệu điểm danh không hợp lệ" });
    }

    const result = await saveAttendanceService(
      sessionId,
      classId,
      instructorId,
      attendanceData
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("saveAttendance error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lưu điểm danh",
    });
  }
};

// lịch tất cả các buổi học của giảng viên
const getInstructorSchedule = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));

    const result = await getInstructorScheduleService(instructorId);

    res.status(200).json(result);
  } catch (error) {
    console.error("getInstructorSchedule error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy lịch giảng dạy",
    });
  }
};

//  Lấy danh sách lịch rảnh (Availability)
const getInstructorAvailability = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));

    const { startDate, endDate } = req.query;

    const result = await getInstructorAvailabilityService(
      instructorId,
      startDate,
      endDate
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("getInstructorAvailability error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi lấy lịch rảnh",
    });
  }
};

// Lưu/Cập nhật lịch rảnh
const saveInstructorAvailability = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));

    // Lấy dữ liệu từ Body
    const { startDate, endDate, slots } = req.body;

    // Gọi Service xử lý (Logic Diff & Transaction nằm ở đây)
    const result = await saveInstructorAvailabilityService(
      instructorId,
      startDate,
      endDate,
      slots
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("saveInstructorAvailability error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi cập nhật lịch rảnh",
    });
  }
};

const addInstructorAvailability = async (req, res) => {
  try {
    const instructorId = await getInstructorId(Number(req.user.id));

    const { slots } = req.body;

    // Gọi Service xử lý (Logic chỉ thêm, không xóa)
    const result = await addInstructorAvailabilityService(instructorId, slots);

    res.status(200).json(result);
  } catch (error) {
    console.error("addInstructorAvailability error:", error);
    res.status(error.status || 500).json({
      message: error.message || "Lỗi khi đăng ký thêm lịch rảnh",
    });
  }
};

module.exports = {
  listInstructorClasses,
  getInstructorClassDetail,
  getInstructorClassRoster,
  getInstructorClassSchedule,
  getAttendanceSheet,
  saveAttendance,
  getInstructorSchedule,
  getInstructorAvailability,
  saveInstructorAvailability,
  addInstructorAvailability,
};
