const sessionService = require("./sessionService");
const classService = require("./classService");
const classRepository = require("../repositories/classRepository");
const sessionRepository = require("../repositories/sessionRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const instructorTimeslotRepository = require("../repositories/instructorTimeslotRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const {
  validateDateDayConsistency,
  validateInstructorLeave,
  getDayOfWeek,
} = require("../utils/sessionValidation");
const { CLASS_STATUS } = require("../constants/classStatus");

/**
 * Logic "Tạo Lớp" (Class Creation Wizard)
 * Vòng lặp WHILE tìm các buổi học tiếp theo với 3 lần kiểm tra
 * @param {Object} params
 * @param {number} params.ClassID
 * @param {string} params.OpendatePlan - Format: 'YYYY-MM-DD'
 * @param {number} params.Numofsession - Số buổi học cần tạo
 * @param {number} params.InstructorID
 * @param {Array<Object>} params.SelectedTimeslotIDs - [{TimeslotID, Day, StartTime, EndTime}, ...]
 * @returns {Object} { success: [...], conflicts: [...], summary: {...} }
 */
async function createClassWizard(params) {
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
    !SelectedTimeslotIDs ||
    SelectedTimeslotIDs.length === 0
  ) {
    throw new Error("Thiếu tham số bắt buộc");
  }

  // Lấy thông tin lớp
  const classData = await classRepository.findById(ClassID);
  if (!classData || classData.length === 0) {
    throw new Error("Lớp học không tồn tại");
  }

  const validSessions = []; // Danh sách tạm thời các buổi học hợp lệ
  const conflicts = []; // Danh sách các buổi học bị conflict
  const startDate = new Date(OpendatePlan);
  let currentDate = new Date(startDate);
  const maxIterations = Numofsession * 20; // Giới hạn vòng lặp
  let iterations = 0;
  let sessionNumber = 1;

  // Vòng lặp WHILE tìm các buổi học tiếp theo
  while (validSessions.length < Numofsession && iterations < maxIterations) {
    iterations++;
    const dateString = formatDate(currentDate);
    const dayOfWeek = getDayOfWeek(dateString); // T2, T3, T4, ...

    // Tìm timeslot phù hợp với thứ trong tuần
    const matchingTimeslots = SelectedTimeslotIDs.filter(
      (ts) => ts.Day === dayOfWeek
    );

    if (matchingTimeslots.length === 0) {
      // Không có ca học cho thứ này, chuyển sang ngày tiếp theo
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Xử lý từng ca học của thứ này
    for (const timeslot of matchingTimeslots) {
      if (validSessions.length >= Numofsession) break;

      const sessionData = {
        Title: `Buổi ${sessionNumber}`,
        Description: `Buổi học thứ ${sessionNumber}`,
        ClassID: ClassID,
        InstructorID: InstructorID,
        TimeslotID: timeslot.TimeslotID,
        Date: dateString,
      };

      // ========== 3 LẦN KIỂM TRA ==========

      // 1. Kiểm tra Mâu thuẫn (Ngày vs. Thứ)
      const dateDayValidation = await validateDateDayConsistency(sessionData);
      if (!dateDayValidation.isValid) {
        conflicts.push({
          sessionIndex: sessionNumber,
          sessionData: sessionData,
          conflictType: "date_day_mismatch",
          conflictInfo: {
            message: dateDayValidation.error,
            details: dateDayValidation.details,
          },
        });
        continue;
      }

      // 2. Kiểm tra Lịch NGHỈ (Block List)
      const leaveValidation = await validateInstructorLeave(sessionData);
      if (leaveValidation.hasConflict) {
        conflicts.push({
          sessionIndex: sessionNumber,
          sessionData: sessionData,
          conflictType: "instructor_leave",
          conflictInfo: leaveValidation.conflictInfo,
        });
        continue;
      }

      // 3. Kiểm tra Lịch DẠY (Trùng lịch)
      const teachingConflict = await sessionService.checkSessionConflictInfo(
        sessionData
      );
      if (teachingConflict.hasConflict) {
        conflicts.push({
          sessionIndex: sessionNumber,
          sessionData: sessionData,
          conflictType: teachingConflict.conflictType,
          conflictInfo: teachingConflict.conflictInfo,
        });
        continue;
      }

      // Vượt qua cả 3 lần kiểm tra - thêm vào danh sách tạm thời
      validSessions.push({
        index: sessionNumber,
        data: sessionData,
      });
      sessionNumber++;
    }

    // Chuyển sang ngày tiếp theo
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (validSessions.length < Numofsession) {
    throw new Error(
      `Không thể tạo đủ ${Numofsession} buổi học. Chỉ tạo được ${validSessions.length} buổi.`
    );
  }

  // INSERT đồng loạt các buổi học hợp lệ
  const sessionsToCreate = validSessions.map((s) => s.data);
  const result = await sessionService.createBulkSessions(sessionsToCreate);

  return {
    success: result.success,
    conflicts: conflicts,
    summary: {
      total: Numofsession,
      success: result.summary.success,
      conflicts: conflicts.length,
    },
  };
}

/**
 * Logic "Dời Buổi học Đầu" (Delaying Start)
 * Hủy buổi đầu tiên và tìm buổi hợp lệ tiếp theo
 * @param {number} classId
 * @returns {Object} { cancelled: session, newStartDate: string }
 */
async function delayClassStart(classId) {
  try {
    // Lấy tất cả sessions của lớp, sắp xếp theo Date
    const sessions = await sessionRepository.findByClassId(classId);
    if (!sessions || sessions.length === 0) {
      throw new Error("Lớp học chưa có buổi học nào");
    }

    // Tìm buổi học đầu tiên (ngày sớm nhất)
    const sortedSessions = sessions.sort(
      (a, b) => new Date(a.Date) - new Date(b.Date)
    );
    const firstSession = sortedSessions[0];

    // Hủy buổi học đầu tiên (xóa session)
    await sessionService.deleteSession(firstSession.SessionID);

    // Tìm buổi học hợp lệ tiếp theo
    if (sortedSessions.length > 1) {
      const nextSession = sortedSessions[1];
      const newStartDate = nextSession.Date;

      // Update Opendate trong bảng class
      await classService.updateClass(classId, {
        Opendate: newStartDate,
      });

      // Tự động kích hoạt Logic Học Bù
      // Lưu ý: Có thể bỏ qua nếu không muốn tự động thêm học bù
      try {
        await addMakeupSessionAtEnd(classId, {
          TimeslotID: firstSession.TimeslotID,
          Day: getDayOfWeek(firstSession.Date),
        });
      } catch (error) {
        console.warn(`Không thể tự động thêm học bù: ${error.message}`);
        // Không throw error để không làm gián đoạn flow chính
      }

      return {
        cancelled: firstSession,
        newStartDate: newStartDate,
        message: "Đã hủy buổi học đầu tiên và kích hoạt học bù",
      };
    } else {
      // Không còn buổi học nào, chỉ cập nhật Opendate = null
      await classService.updateClass(classId, {
        Opendate: null,
      });

      return {
        cancelled: firstSession,
        newStartDate: null,
        message: "Đã hủy buổi học đầu tiên. Lớp không còn buổi học nào.",
      };
    }
  } catch (error) {
    throw new Error(`Lỗi khi dời buổi học đầu: ${error.message}`);
  }
}

/**
 * Logic "Thêm Lịch Bù vào Cuối" (Make-up Logic)
 * Tìm ngày cuối cùng và thêm buổi bù theo khung cố định
 * @param {number} classId
 * @param {Object} makeupParams - { TimeslotID, Day }
 * @returns {Object} Created session hoặc gợi ý các ca rảnh
 */
async function addMakeupSessionAtEnd(classId, makeupParams) {
  try {
    const { TimeslotID, Day } = makeupParams;

    // Tìm ngày học cuối cùng
    const sessions = await sessionRepository.findByClassId(classId);
    if (!sessions || sessions.length === 0) {
      throw new Error("Lớp học chưa có buổi học nào");
    }

    const lastSession = sessions.reduce((latest, session) => {
      return new Date(session.Date) > new Date(latest.Date) ? session : latest;
    });

    const lastDate = new Date(lastSession.Date);
    let currentDate = new Date(lastDate);
    currentDate.setDate(currentDate.getDate() + 1); // Bắt đầu từ ngày sau buổi cuối

    const maxIterations = 100; // Giới hạn tìm kiếm
    let iterations = 0;

    // Vòng lặp WHILE tìm ngày cùng thứ
    while (iterations < maxIterations) {
      iterations++;
      const dateString = formatDate(currentDate);
      const dayOfWeek = getDayOfWeek(dateString);

      // Kiểm tra xem có phải thứ cần tìm không
      if (dayOfWeek === Day) {
        const sessionData = {
          ClassID: classId,
          InstructorID: lastSession.InstructorID,
          TimeslotID: TimeslotID,
          Date: dateString,
        };

        // Kiểm tra Lịch NGHỈ
        const leaveValidation = await validateInstructorLeave(sessionData);
        if (leaveValidation.hasConflict) {
          // Giảng viên bận nghỉ, tiếp tục tìm tuần sau
          currentDate.setDate(currentDate.getDate() + 7);
          continue;
        }

        // Kiểm tra Lịch DẠY
        const teachingConflict = await sessionService.checkSessionConflictInfo(
          sessionData
        );
        if (teachingConflict.hasConflict) {
          // Giảng viên bận dạy, tiếp tục tìm tuần sau
          currentDate.setDate(currentDate.getDate() + 7);
          continue;
        }

        // Hợp lệ - Tạo buổi học bù
        const result = await sessionService.createSession({
          Title: "Buổi học bù",
          Description: "Buổi học bù do dời lịch",
          ...sessionData,
        });

        if (result.conflict) {
          throw new Error(
            `Không thể tạo buổi học bù: ${result.conflict.conflictInfo.message}`
          );
        }

        return {
          success: true,
          session: result.success,
          message: `Đã thêm buổi học bù vào ${dateString}`,
        };
      }

      // Chuyển sang ngày tiếp theo
      currentDate.setDate(currentDate.getDate() + 1);
    }

    throw new Error(
      "Không tìm thấy ngày hợp lệ để thêm buổi học bù trong vòng 100 ngày"
    );
  } catch (error) {
    throw new Error(`Lỗi khi thêm buổi học bù: ${error.message}`);
  }
}

/**
 * Hàm tìm các ca rảnh của Giảng viên trong 1 tuần tới (Bước 1)
 * Chỉ kiểm tra lịch của GV, không kiểm tra HV
 * @param {Object} params
 * @param {number} params.InstructorID
 * @param {number} params.TimeslotID
 * @param {string} params.Day - T2, T3, T4, ...
 * @param {number} params.numSuggestions - Số gợi ý (mặc định 5)
 * @param {string} params.startDate - Ngày bắt đầu tìm (YYYY-MM-DD)
 * @param {number} params.excludeClassId - ClassID cần loại trừ (để tránh conflict với sessions đã tạo của class này)
 * @returns {Array} Danh sách các ca rảnh [{ date, timeslot, available: true, reason: null }]
 */
async function findAvailableInstructorSlots(params) {
  const {
    InstructorID,
    TimeslotID,
    Day,
    numSuggestions = 5,
    startDate,
    excludeClassId,
  } = params;

  const availableSlots = [];
  const busySlots = [];
  const initialDate = startDate ? new Date(startDate) : new Date();
  if (isNaN(initialDate.getTime())) {
    initialDate.setTime(Date.now());
  }
  initialDate.setHours(0, 0, 0, 0);
  let currentDate = new Date(initialDate);
  const maxIterations = 50; // Tìm trong 50 ngày
  let iterations = 0;

  console.log(`[findAvailableInstructorSlots] Bắt đầu tìm slots với params:`, {
    InstructorID,
    TimeslotID,
    Day,
    numSuggestions,
    startDate,
    excludeClassId,
    initialDate: initialDate.toISOString().split("T")[0],
  });

  while (availableSlots.length < numSuggestions && iterations < maxIterations) {
    iterations++;
    const dateString = formatDate(currentDate);
    const dayOfWeek = getDayOfWeek(dateString);

    // Chỉ xét ngày cùng thứ
    if (dayOfWeek === Day) {
      const sessionData = {
        InstructorID: InstructorID,
        TimeslotID: TimeslotID,
        Date: dateString,
      };

      console.log(
        `[findAvailableInstructorSlots] [${iterations}/${maxIterations}] Đang kiểm tra ngày ${dateString} (${dayOfWeek}):`,
        {
          sessionData,
          excludeClassId,
        }
      );

      // Kiểm tra Lịch NGHỈ
      console.log(`[findAvailableInstructorSlots] → Kiểm tra lịch nghỉ...`);
      const leaveValidation = await validateInstructorLeave(sessionData);
      const hasLeaveConflict = leaveValidation.hasConflict;
      console.log(
        `[findAvailableInstructorSlots] ← Kết quả lịch nghỉ: hasConflict=${hasLeaveConflict}`,
        hasLeaveConflict ? leaveValidation.conflictInfo : {}
      );

      // Kiểm tra Lịch DẠY
      // Loại trừ các sessions của class hiện tại (nếu có excludeClassId)
      // để tránh conflict với các sessions đã được tạo khi "Lưu bản nháp"
      console.log(
        `[findAvailableInstructorSlots] → Kiểm tra lịch dạy (excludeClassId=${excludeClassId})...`
      );
      const teachingConflict = await sessionService.checkSessionConflictInfo(
        sessionData,
        null, // excludeSessionId
        excludeClassId // excludeClassId - loại trừ sessions của class này
      );
      const hasTeachingConflict = teachingConflict.hasConflict;
      console.log(
        `[findAvailableInstructorSlots] ← Kết quả lịch dạy: hasConflict=${hasTeachingConflict}`,
        hasTeachingConflict ? teachingConflict.conflictInfo : {}
      );

      if (!hasLeaveConflict && !hasTeachingConflict) {
        console.log(
          `[findAvailableInstructorSlots] ✅ Ngày ${dateString} RẢNH - thêm vào availableSlots`
        );
        availableSlots.push({
          date: dateString,
          dayOfWeek: dayOfWeek,
          timeslotId: TimeslotID,
          available: true,
          reason: null,
        });
      } else {
        let reason = "";
        if (hasLeaveConflict) {
          reason = `GV nghỉ: ${
            leaveValidation.conflictInfo.status || "Holiday"
          }`;
        }
        if (hasTeachingConflict) {
          reason += reason
            ? `; GV dạy lớp: ${
                teachingConflict.conflictInfo.className || "N/A"
              }`
            : `GV dạy lớp: ${teachingConflict.conflictInfo.className || "N/A"}`;
        }

        console.log(
          `[findAvailableInstructorSlots] ⛔ Ngày ${dateString} BẬN - ${reason}`
        );
        busySlots.push({
          date: dateString,
          dayOfWeek: dayOfWeek,
          timeslotId: TimeslotID,
          available: false,
          reason: reason,
        });
      }
    } else {
      console.log(
        `[findAvailableInstructorSlots] [${iterations}/${maxIterations}] Bỏ qua ngày ${dateString} (${dayOfWeek} - không khớp với ${Day})`
      );
    }

    // Chuyển sang ngày tiếp theo
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(
    `[findAvailableInstructorSlots] Kết thúc vòng lặp: availableSlots=${availableSlots.length}, busySlots=${busySlots.length}, iterations=${iterations}`
  );

  // Ưu tiên trả về availableSlots
  if (availableSlots.length > 0) {
    if (availableSlots.length >= numSuggestions) {
      // Đủ slots rảnh, chỉ trả về availableSlots
      console.log(
        `[findAvailableInstructorSlots] Trả về ${numSuggestions} available slots`
      );
      return availableSlots.slice(0, numSuggestions);
    } else {
      // Không đủ slots rảnh, bổ sung busySlots nếu có
      if (busySlots.length > 0) {
        const remaining = Math.max(0, numSuggestions - availableSlots.length);
        console.log(
          `[findAvailableInstructorSlots] Trả về ${availableSlots.length} available + ${remaining} busy slots`
        );
        return availableSlots.concat(busySlots.slice(0, remaining));
      } else {
        // Chỉ có availableSlots (ít hơn numSuggestions) và không có busySlots
        console.log(
          `[findAvailableInstructorSlots] Trả về ${availableSlots.length} available slots (ít hơn ${numSuggestions} yêu cầu)`
        );
        console.log(
          `[findAvailableInstructorSlots] Danh sách availableSlots:`,
          availableSlots.map((s) => ({ date: s.date, available: s.available }))
        );
        return availableSlots;
      }
    }
  }

  // Không có availableSlots, trả về busySlots nếu có
  if (busySlots.length > 0) {
    console.log(
      `[findAvailableInstructorSlots] Trả về ${Math.min(
        busySlots.length,
        numSuggestions
      )} busy slots`
    );
    return busySlots.slice(0, numSuggestions);
  }

  // Không có gì
  console.log(`[findAvailableInstructorSlots] Không tìm thấy slots nào`);
  return [];
}

/**
 * Hàm kiểm tra xung đột với Học viên (Bước 2)
 * Chỉ chạy khi admin đã chọn 1 ca cụ thể
 * @param {Object} params
 * @param {number} params.ClassID
 * @param {string} params.Date
 * @param {number} params.TimeslotID
 * @returns {Object} { isValid: boolean, conflicts: [], summary: {} }
 */
async function checkLearnerConflicts(params) {
  const { ClassID, Date, TimeslotID } = params;

  try {
    // Lấy danh sách học viên đã đăng ký lớp này
    const enrollments = await enrollmentRepository.findByClassId(ClassID);
    const activeLearners = enrollments.filter(
      (e) => e.Status === "active" || e.Status === "enrolled"
    );

    if (activeLearners.length === 0) {
      return {
        isValid: true,
        conflicts: [],
        summary: {
          totalLearners: 0,
          conflictedLearners: 0,
          availableLearners: 0,
        },
      };
    }

    const conflicts = [];
    const pool = require("../config/db");

    // Kiểm tra từng học viên có trùng lịch không
    for (const enrollment of activeLearners) {
      const learnerId = enrollment.LearnerID;

      // Kiểm tra học viên có session khác vào ca này không
      const conflictQuery = `
        SELECT 
          s.SessionID,
          s.Title as sessionTitle,
          s.Date,
          c.Name as className,
          t.StartTime,
          t.EndTime
        FROM enrollment e
        INNER JOIN \`class\` c ON e.ClassID = c.ClassID
        INNER JOIN session s ON s.ClassID = c.ClassID
        INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        WHERE e.LearnerID = ?
          AND e.Status IN ('active', 'enrolled')
          AND s.Date = ?
          AND s.TimeslotID = ?
          AND c.ClassID != ?
      `;

      const [conflictRows] = await pool.execute(conflictQuery, [
        learnerId,
        Date,
        TimeslotID,
        ClassID,
      ]);

      if (conflictRows.length > 0) {
        const conflict = conflictRows[0];
        conflicts.push({
          learnerId: learnerId,
          learnerName: enrollment.learnerName || "N/A",
          conflictInfo: {
            className: conflict.className,
            sessionTitle: conflict.sessionTitle,
            date: conflict.Date,
            startTime: conflict.StartTime,
            endTime: conflict.EndTime,
          },
        });
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts: conflicts,
      summary: {
        totalLearners: activeLearners.length,
        conflictedLearners: conflicts.length,
        availableLearners: activeLearners.length - conflicts.length,
      },
    };
  } catch (error) {
    throw new Error(`Lỗi khi kiểm tra xung đột học viên: ${error.message}`);
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
  createClassWizard,
  delayClassStart,
  addMakeupSessionAtEnd,
  findAvailableInstructorSlots,
  checkLearnerConflicts,
};
