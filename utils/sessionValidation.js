const pool = require("../config/db");
const instructorTimeslotRepository = require("../repositories/instructorTimeslotRepository");
const timeslotRepository = require("../repositories/timeslotRepository");

/**
 * Chuyển đổi ngày thành thứ trong tuần (tiếng Việt)
 * @param {string} dateString - Ngày dạng 'YYYY-MM-DD'
 * @returns {string} - Thứ trong tuần (T2, T3, T4, T5, T6, T7, CN)
 */
function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const day = date.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7

  const dayMap = {
    0: "CN", // Chủ nhật
    1: "T2", // Thứ 2
    2: "T3", // Thứ 3
    3: "T4", // Thứ 4
    4: "T5", // Thứ 5
    5: "T6", // Thứ 6
    6: "T7", // Thứ 7
  };

  return dayMap[day] || null;
}

/**
 * Chuyển đổi thứ trong tuần từ tiếng Việt sang tiếng Anh
 * @param {string} vietnameseDay - Thứ trong tuần (T2, T3, T4, T5, T6, T7, CN)
 * @returns {string} - Thứ trong tuần tiếng Anh (Monday, Tuesday, ...)
 */
function convertVietnameseDayToEnglish(vietnameseDay) {
  const dayMap = {
    T2: "Monday",
    T3: "Tuesday",
    T4: "Wednesday",
    T5: "Thursday",
    T6: "Friday",
    T7: "Saturday",
    CN: "Sunday",
  };

  return dayMap[vietnameseDay] || null;
}

/**
 * Validation Function A: Kiểm tra xung đột Session vs. Lịch bận để dạy
 * Logic mới:
 * - Fulltime: Chỉ check HOLIDAY (mặc định full ca T2-T7)
 * - Parttime: Check AVAILABLE (phải có), HOLIDAY (conflict), CLOSE (conflict)
 * @param {Object} sessionData - Dữ liệu session { InstructorID, TimeslotID, Date }
 * @param {string} instructorType - 'fulltime' hoặc 'parttime'
 * @param {number} excludeSessionId - SessionID cần loại trừ (khi update)
 * @returns {Object} - { hasConflict: boolean, conflictInfo: object }
 */
async function validateInstructorLeave(
  sessionData,
  instructorType = null,
  excludeSessionId = null
) {
  try {
    const { InstructorID, TimeslotID, Date } = sessionData;

    // Validate required fields
    if (InstructorID === undefined || InstructorID === null) {
      throw new Error("InstructorID is required but was undefined/null");
    }
    if (TimeslotID === undefined || TimeslotID === null) {
      throw new Error("TimeslotID is required but was undefined/null");
    }
    if (Date === undefined || Date === null) {
      throw new Error("Date is required but was undefined/null");
    }

    // Lấy Type nếu chưa có
    if (!instructorType) {
      const instructorRepository = require("../repositories/instructorRepository");
      const instructor = await instructorRepository.findById(InstructorID);
      instructorType = instructor?.Type || "parttime";
    }

    // Kiểm tra giảng viên có lịch bận vào ca này không
    const leaveConflict = await instructorTimeslotRepository.checkConflict(
      InstructorID,
      TimeslotID,
      Date
    );

    if (instructorType === "fulltime") {
      // Fulltime: Chỉ conflict nếu có HOLIDAY
      if (
        leaveConflict &&
        leaveConflict.Status &&
        leaveConflict.Status.toUpperCase() === "HOLIDAY"
      ) {
        return {
          hasConflict: true,
          conflictType: "instructor_leave",
          conflictInfo: {
            instructorId: InstructorID,
            timeslotId: TimeslotID,
            date: Date,
            status: leaveConflict.Status,
            note: leaveConflict.Note,
            message: `Giảng viên nghỉ lễ vào ca này`,
          },
        };
      }
      // Fulltime mặc định có thể dạy T2-T7, không cần check AVAILABLE
      return { hasConflict: false };
    } else {
      // Parttime: Phải có AVAILABLE, conflict nếu có HOLIDAY hoặc CLOSE
      if (leaveConflict) {
        const status = (leaveConflict.Status || "").toUpperCase();
        if (status === "HOLIDAY") {
          return {
            hasConflict: true,
            conflictType: "instructor_leave",
            conflictInfo: {
              instructorId: InstructorID,
              timeslotId: TimeslotID,
              date: Date,
              status: leaveConflict.Status,
              note: leaveConflict.Note,
              message: `Giảng viên nghỉ lễ vào ca này`,
            },
          };
        }
        if (status === "CLOSE") {
          return {
            hasConflict: true,
            conflictType: "instructor_leave",
            conflictInfo: {
              instructorId: InstructorID,
              timeslotId: TimeslotID,
              date: Date,
              status: leaveConflict.Status,
              note: leaveConflict.Note,
              message: `Ca này đã được book (CLOSE)`,
            },
          };
        }
        // Nếu có AVAILABLE thì OK
        if (status === "AVAILABLE") {
          return { hasConflict: false };
        }
      }
      // Parttime: Không có trong instructortimeslot = conflict (chưa chọn ca này)
      return {
        hasConflict: true,
        conflictType: "instructor_leave",
        conflictInfo: {
          instructorId: InstructorID,
          timeslotId: TimeslotID,
          date: Date,
          message: `Giảng viên parttime chưa chọn ca này (không có trong lịch bận để dạy)`,
        },
      };
    }
  } catch (error) {
    throw new Error(`Lỗi khi kiểm tra lịch bận: ${error.message}`);
  }
}

/**
 * Validation Function B: Kiểm tra mâu thuẫn Date vs. Day
 * @param {Object} sessionData - Dữ liệu session { TimeslotID, Date }
 * @returns {Object} - { isValid: boolean, error: string }
 */
async function validateDateDayConsistency(sessionData) {
  try {
    const { TimeslotID, Date } = sessionData;

    // Lấy thông tin timeslot
    const timeslot = await timeslotRepository.findById(TimeslotID);
    if (!timeslot) {
      return {
        isValid: false,
        error: `Timeslot với ID ${TimeslotID} không tồn tại`,
      };
    }

    // Kiểm tra timeslot có trường Day không (dbver5)
    if (!timeslot.Day) {
      // Nếu không có Day, bỏ qua validation này (backward compatibility)
      return { isValid: true };
    }

    // Lấy thứ trong tuần từ Date
    const dateDay = getDayOfWeek(Date);
    if (!dateDay) {
      return {
        isValid: false,
        error: `Không thể xác định thứ trong tuần từ ngày ${Date}`,
      };
    }

    // So sánh Day từ timeslot với Day từ Date
    // NOTE: Bỏ qua validation này vì một timeslot có thể được dùng cho nhiều ngày khác nhau
    // Trường Day trong bảng timeslot chỉ là gợi ý/mặc định, không phải ràng buộc cứng
    // Nếu cần strict validation, có thể bật lại bằng cách uncomment đoạn code dưới
    /*
    if (timeslot.Day !== dateDay) {
      return {
        isValid: false,
        error: `Dữ liệu mâu thuẫn: Ngày ${Date} là ${dateDay} nhưng timeslot được định nghĩa cho ${timeslot.Day}`,
        details: {
          dateDay: dateDay,
          timeslotDay: timeslot.Day,
          date: Date,
          timeslotId: TimeslotID,
        },
      };
    }
    */

    return { isValid: true };
  } catch (error) {
    throw new Error(
      `Lỗi khi kiểm tra tính nhất quán ngày/thứ: ${error.message}`
    );
  }
}

/**
 * Validation Function tổng hợp: Kiểm tra tất cả các điều kiện trước khi tạo/cập nhật session
 * @param {Object} sessionData - Dữ liệu session
 * @param {number} excludeSessionId - SessionID cần loại trừ (khi update)
 * @returns {Object} - { isValid: boolean, errors: array, conflicts: array }
 */
async function validateSessionData(sessionData, excludeSessionId = null) {
  const errors = [];
  const conflicts = [];

  try {
    // 1. Kiểm tra xung đột với lịch nghỉ
    const leaveValidation = await validateInstructorLeave(
      sessionData,
      excludeSessionId
    );
    if (leaveValidation.hasConflict) {
      conflicts.push(leaveValidation);
    }

    // 2. Kiểm tra mâu thuẫn Date vs Day
    const dateDayValidation = await validateDateDayConsistency(sessionData);
    if (!dateDayValidation.isValid) {
      errors.push({
        type: "date_day_mismatch",
        message: dateDayValidation.error,
        details: dateDayValidation.details || null,
      });
    }

    return {
      isValid: errors.length === 0 && conflicts.length === 0,
      errors: errors,
      conflicts: conflicts,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{ type: "validation_error", message: error.message }],
      conflicts: [],
    };
  }
}

module.exports = {
  getDayOfWeek,
  convertVietnameseDayToEnglish,
  validateInstructorLeave,
  validateDateDayConsistency,
  validateSessionData,
};
