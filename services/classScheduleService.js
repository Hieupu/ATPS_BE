const sessionService = require("./sessionService");
const classService = require("./classService");
const classRepository = require("../repositories/classRepository");
const sessionRepository = require("../repositories/sessionRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const {
  validateDateDayConsistency,
  validateInstructorLeave,
} = require("../utils/sessionValidation");
const { getDayOfWeek } = require("../utils/sessionValidation");
const { CLASS_STATUS } = require("../constants/classStatus");

/**
 * Hàm Tạo Lịch Hàng loạt (Bulk Schedule Creation)
 * Nhận đầu vào: OpendatePlan, Numofsession, InstructorID, và danh sách SelectedTimeslotIDs
 * @param {Object} params
 * @param {number} params.ClassID
 * @param {string} params.OpendatePlan - Format: 'YYYY-MM-DD'
 * @param {number} params.Numofsession - Số buổi học cần tạo
 * @param {number} params.InstructorID
 * @param {Array<Object>} params.SelectedTimeslotIDs - [{TimeslotID, Day}, ...] hoặc [{TimeslotID, StartTime, EndTime, Day}, ...]
 * @returns {Object} { success: [...], conflicts: [...], summary: {...} }
 */
async function createBulkSchedule(params) {
  const {
    ClassID,
    OpendatePlan,
    Numofsession,
    InstructorID,
    SelectedTimeslotIDs,
  } = params;

  if (
    !ClassID ||
    !OpendatePlan ||
    !Numofsession ||
    !InstructorID ||
    !SelectedTimeslotIDs
  ) {
    throw new Error("Thiếu tham số bắt buộc");
  }

  // Lấy thông tin lớp
  const classData = await classRepository.findById(ClassID);
  if (!classData || classData.length === 0) {
    throw new Error("Lớp học không tồn tại");
  }
  const className =
    classData[0].Name || classData[0].ClassName || `Class ${ClassID}`;

  // Tạo danh sách sessions dựa trên SelectedTimeslotIDs
  const sessionsToCreate = [];
  let sessionNumber = 1;
  const startDate = new Date(OpendatePlan);
  let currentDate = new Date(startDate);
  const maxIterations = Numofsession * 10; // Giới hạn vòng lặp để tránh vô hạn
  let iterations = 0;

  // Tạo sessions cho đến khi đủ số lượng
  while (sessionsToCreate.length < Numofsession && iterations < maxIterations) {
    const dayOfWeek = getDayOfWeek(formatDate(currentDate)); // T2, T3, ...

    // Tìm timeslot phù hợp với thứ trong tuần
    const matchingTimeslot = SelectedTimeslotIDs.find(
      (ts) => ts.Day === dayOfWeek
    );

    if (matchingTimeslot) {
      sessionsToCreate.push({
        Title: `Session for class ${className}`,
        Description: `Buổi học thứ ${sessionNumber}`,
        ClassID: ClassID,
        InstructorID: InstructorID,
        TimeslotID: matchingTimeslot.TimeslotID,
        Date: formatDate(currentDate),
      });
      sessionNumber++;
    }

    // Chuyển sang ngày tiếp theo
    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }

  if (sessionsToCreate.length < Numofsession) {
    throw new Error(
      `Không thể tạo đủ ${Numofsession} buổi học với lịch đã chọn`
    );
  }

  // Gọi hàm tạo bulk sessions (đã có validation)
  const result = await sessionService.createBulkSessions(sessionsToCreate);

  return result;
}

/**
 * Hàm Đếm Học viên
 * @param {number} classId
 * @returns {number} Số lượng học viên đã đăng ký
 */
async function countLearners(classId) {
  try {
    const enrollments = await enrollmentRepository.findByClassId(classId);
    // Chỉ đếm các enrollment có status = 'active'
    const activeEnrollments = enrollments.filter(
      (e) => e.Status === "active" || e.Status === "enrolled"
    );
    return activeEnrollments.length;
  } catch (error) {
    throw new Error(`Lỗi khi đếm học viên: ${error.message}`);
  }
}

/**
 * Hàm Kiểm tra Đầy lớp
 * @param {number} classId
 * @returns {Object} { isFull: boolean, currentLearners: number, maxLearners: number }
 */
async function checkFullClass(classId) {
  try {
    const classData = await classRepository.findById(classId);
    if (!classData || classData.length === 0) {
      throw new Error("Lớp học không tồn tại");
    }

    const maxLearners = classData[0].Maxstudent || 0;
    const currentLearners = await countLearners(classId);

    return {
      isFull: currentLearners >= maxLearners,
      currentLearners: currentLearners,
      maxLearners: maxLearners,
      availableSlots: Math.max(0, maxLearners - currentLearners),
    };
  } catch (error) {
    throw new Error(`Lỗi khi kiểm tra đầy lớp: ${error.message}`);
  }
}

/**
 * Hàm Validate Trạng thái (không cho sửa lịch lớp đã đóng)
 * @param {number} classId
 * @returns {Object} { canEdit: boolean, reason: string }
 */
async function validateStatusForEdit(classId) {
  try {
    const classData = await classRepository.findById(classId);
    if (!classData || classData.length === 0) {
      return { canEdit: false, reason: "Lớp học không tồn tại" };
    }

    const status = classData[0].Status;

    // Không cho sửa nếu lớp đã đóng hoặc hủy
    if (
      status === CLASS_STATUS.CLOSE ||
      status === CLASS_STATUS.DONE ||
      status === CLASS_STATUS.COMPLETED ||
      status === CLASS_STATUS.CANCEL ||
      status === CLASS_STATUS.CANCELLED
    ) {
      return {
        canEdit: false,
        reason: `Không thể sửa lịch lớp ở trạng thái ${status}`,
      };
    }

    return { canEdit: true, reason: null };
  } catch (error) {
    return { canEdit: false, reason: error.message };
  }
}

/**
 * Hàm Validate khi Dời lịch (Reschedule)
 * @param {number} sessionId
 * @param {Object} newSchedule - { Date, TimeslotID }
 * @returns {Object} { isValid: boolean, errors: [], conflicts: [] }
 */
async function validateReschedule(sessionId, newSchedule) {
  const errors = [];
  const conflicts = [];

  try {
    // Lấy thông tin session hiện tại
    const currentSession = await sessionService.getSessionById(sessionId);
    if (!currentSession) {
      errors.push({ type: "not_found", message: "Session không tồn tại" });
      return { isValid: false, errors, conflicts };
    }

    // Lấy thông tin lớp để kiểm tra status
    const statusValidation = await validateStatusForEdit(
      currentSession.ClassID
    );
    if (!statusValidation.canEdit) {
      errors.push({
        type: "status_error",
        message: statusValidation.reason,
      });
      return { isValid: false, errors, conflicts };
    }

    // Chuẩn bị session data mới để validate
    const newSessionData = {
      ClassID: currentSession.ClassID,
      InstructorID: currentSession.InstructorID,
      TimeslotID: newSchedule.TimeslotID,
      Date: newSchedule.Date,
    };

    // 1. Kiểm tra mâu thuẫn Date vs Day
    const dateDayValidation = await validateDateDayConsistency(newSessionData);
    if (!dateDayValidation.isValid) {
      errors.push({
        type: "date_day_mismatch",
        message: dateDayValidation.error,
      });
    }

    // 2. Kiểm tra xung đột với lịch nghỉ
    const leaveValidation = await validateInstructorLeave(newSessionData);
    if (leaveValidation.hasConflict) {
      conflicts.push({
        type: "instructor_leave",
        conflictInfo: leaveValidation.conflictInfo,
      });
    }

    // 3. Kiểm tra conflict với session khác
    // Note: Khi reschedule, cần loại trừ session hiện tại khỏi kiểm tra
    // Nhưng checkSessionConflictInfo không hỗ trợ excludeSessionId trong signature
    // Ta sẽ kiểm tra thủ công bằng cách query trực tiếp
    const connectDB = require("../config/db");
    const db = await connectDB();
    const conflictQuery = `
      SELECT 
        s.SessionID,
        s.Title as sessionTitle,
        s.Date,
        c.Name as className,
        t.StartTime,
        t.EndTime
      FROM session s
      INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      INNER JOIN \`class\` c ON s.ClassID = c.ClassID
      WHERE s.InstructorID = ?
        AND s.Date = ?
        AND s.TimeslotID = ?
        AND s.SessionID != ?
    `;

    const [conflictsRows] = await db.execute(conflictQuery, [
      newSessionData.InstructorID,
      newSessionData.Date,
      newSessionData.TimeslotID,
      sessionId,
    ]);

    if (conflictsRows.length > 0) {
      const conflict = conflictsRows[0];
      conflicts.push({
        type: "instructor",
        conflictInfo: {
          className: conflict.className,
          sessionTitle: conflict.sessionTitle,
          date: conflict.Date,
          startTime: conflict.StartTime,
          endTime: conflict.EndTime,
          message: `Giảng viên đã có ca học tại lớp "${conflict.className}" vào ${conflict.Date} (${conflict.StartTime} - ${conflict.EndTime})`,
        },
      });
    }

    return {
      isValid: errors.length === 0 && conflicts.length === 0,
      errors,
      conflicts,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{ type: "validation_error", message: error.message }],
      conflicts: [],
    };
  }
}

/**
 * Hàm Dời lịch (Reschedule)
 * @param {number} sessionId
 * @param {Object} newSchedule - { Date, TimeslotID }
 * @returns {Object} Updated session
 */
async function rescheduleSession(sessionId, newSchedule) {
  // Validate trước
  const validation = await validateReschedule(sessionId, newSchedule);
  if (!validation.isValid) {
    throw new Error(
      `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`
    );
  }

  if (validation.conflicts.length > 0) {
    throw new Error(
      `Có xung đột: ${validation.conflicts
        .map((c) => c.conflictInfo.message || c.conflictInfo)
        .join(", ")}`
    );
  }

  // Cập nhật session
  const updated = await sessionService.updateSession(sessionId, {
    Date: newSchedule.Date,
    TimeslotID: newSchedule.TimeslotID,
  });

  return updated;
}

/**
 * Hàm Hủy buổi học (Cancel Session)
 * @param {number} sessionId
 * @returns {boolean}
 */
async function cancelSession(sessionId) {
  try {
    const session = await sessionService.getSessionById(sessionId);
    if (!session) {
      throw new Error("Session không tồn tại");
    }

    // Kiểm tra status lớp
    const statusValidation = await validateStatusForEdit(session.ClassID);
    if (!statusValidation.canEdit) {
      throw new Error(statusValidation.reason);
    }

    // Xóa session (sẽ tự động sync class dates)
    const deleted = await sessionService.deleteSession(sessionId);
    return deleted;
  } catch (error) {
    throw new Error(`Lỗi khi hủy buổi học: ${error.message}`);
  }
}

/**
 * Hàm Thêm buổi bù (Add Makeup Session)
 * @param {number} classId
 * @param {Object} sessionData - { Title, Description, Date, TimeslotID }
 * @returns {Object} Created session
 */
async function addMakeupSession(classId, sessionData) {
  try {
    // Kiểm tra status lớp
    const statusValidation = await validateStatusForEdit(classId);
    if (!statusValidation.canEdit) {
      throw new Error(statusValidation.reason);
    }

    // Lấy thông tin lớp để lấy InstructorID
    const classData = await classRepository.findById(classId);
    if (!classData || classData.length === 0) {
      throw new Error("Lớp học không tồn tại");
    }

    // Chuẩn bị session data
    const preparedSessionData = {
      Title: sessionData.Title || "Buổi học bù",
      Description: sessionData.Description || "",
      ClassID: classId,
      InstructorID: classData[0].InstructorID,
      TimeslotID: sessionData.TimeslotID,
      Date: sessionData.Date,
    };

    // Tạo session (đã có validation)
    const result = await sessionService.createSession(preparedSessionData);

    if (result.conflict) {
      throw new Error(
        `Không thể thêm buổi học bù: ${
          result.conflict.conflictInfo.message || "Có xung đột"
        }`
      );
    }

    return result.success;
  } catch (error) {
    throw new Error(`Lỗi khi thêm buổi học bù: ${error.message}`);
  }
}

/**
 * Hàm Tự động Đóng đăng ký (Auto Close Enrollment)
 * Khi lớp đã đầy, tự động chuyển status nếu cần
 * @param {number} classId
 * @returns {Object} { updated: boolean, newStatus: string }
 */
async function autoCloseEnrollment(classId) {
  try {
    const fullCheck = await checkFullClass(classId);
    const classData = await classRepository.findById(classId);

    if (!classData || classData.length === 0) {
      return { updated: false, reason: "Lớp học không tồn tại" };
    }

    const currentStatus = classData[0].Status;

    // Nếu lớp đã đầy và đang ở trạng thái ACTIVE, có thể tự động chuyển sang ONGOING
    if (fullCheck.isFull && currentStatus === CLASS_STATUS.ACTIVE) {
      // Kiểm tra xem lớp đã bắt đầu chưa (có session trong quá khứ hoặc hôm nay)
      const sessions = await sessionRepository.findByClassId(classId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const hasStarted = sessions.some((s) => {
        const sessionDate = new Date(s.Date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate <= today;
      });

      if (hasStarted) {
        await classService.updateClass(classId, {
          Status: CLASS_STATUS.ONGOING,
        });
        return {
          updated: true,
          newStatus: CLASS_STATUS.ON_GOING,
          reason: "Lớp đã đầy và đã bắt đầu học",
        };
      }
    }

    return { updated: false, reason: "Không cần cập nhật" };
  } catch (error) {
    console.error(`Lỗi khi tự động đóng đăng ký: ${error.message}`);
    return { updated: false, reason: error.message };
  }
}

/**
 * Hàm Tự động Kết thúc (Auto Close Class)
 * Chạy hàng đêm để kiểm tra và đóng các lớp đã kết thúc
 * @returns {Array} Danh sách các lớp đã được đóng
 */
async function autoCloseClasses() {
  try {
    const connectDB = require("../config/db");
    const db = await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tìm các lớp có Enddate < hôm nay và status chưa đóng
    const query = `
      SELECT ClassID, Name, Enddate, Status
      FROM \`class\`
      WHERE Enddate < ?
        AND Status NOT IN (?, ?, ?, ?)
    `;

    const [classes] = await db.execute(query, [
      formatDate(today),
      CLASS_STATUS.CLOSE,
      CLASS_STATUS.DONE,
      CLASS_STATUS.COMPLETED,
      CLASS_STATUS.CANCEL,
    ]);

    const closedClasses = [];

    for (const classItem of classes) {
      // Kiểm tra lại xem có session nào sau Enddate không
      const sessions = await sessionRepository.findByClassId(classItem.ClassID);
      const lastSessionDate =
        sessions.length > 0
          ? new Date(Math.max(...sessions.map((s) => new Date(s.Date))))
          : null;

      if (lastSessionDate && lastSessionDate < today) {
        // Đóng lớp
        await classService.updateClass(classItem.ClassID, {
          Status: CLASS_STATUS.CLOSE,
        });

        closedClasses.push({
          ClassID: classItem.ClassID,
          Name: classItem.Name,
          previousStatus: classItem.Status,
          newStatus: CLASS_STATUS.CLOSE,
        });
      }
    }

    return closedClasses;
  } catch (error) {
    console.error(`Lỗi khi tự động đóng lớp: ${error.message}`);
    throw error;
  }
}

/**
 * Helper: Format date to YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

module.exports = {
  createBulkSchedule,
  countLearners,
  checkFullClass,
  validateStatusForEdit,
  validateReschedule,
  rescheduleSession,
  cancelSession,
  addMakeupSession,
  autoCloseEnrollment,
  autoCloseClasses,
};
