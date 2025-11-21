const instructorTimeslotRepository = require("../repositories/instructorTimeslotRepository");
const sessionRepository = require("../repositories/sessionRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const { getDayOfWeek } = require("../utils/sessionValidation");

/**
 * Thêm "Lịch Nghỉ Cố định" hàng loạt
 * Block toàn bộ ngày cho giảng viên
 * @param {Object} params
 * @param {number} params.InstructorID
 * @param {string} params.Date - Format: 'YYYY-MM-DD'
 * @param {string} params.Status - 'Holiday', 'PersonalLeave', ...
 * @param {string} params.Note - Ghi chú
 * @param {boolean} params.blockEntireDay - Block toàn bộ ngày
 * @returns {Object} { inserted: number, slots: [...] }
 */
async function addBulkInstructorLeave(params) {
  const { InstructorID, Date, Status, Note, blockEntireDay } = params;

  if (!InstructorID || !Date || !Status) {
    throw new Error("Thiếu tham số bắt buộc");
  }

  if (!blockEntireDay) {
    // Nếu không block toàn bộ ngày, chỉ cần thêm 1 record với TimeslotID cụ thể
    const { TimeslotID } = params;
    if (!TimeslotID) {
      throw new Error("TimeslotID là bắt buộc khi không block toàn bộ ngày");
    }

    // Kiểm tra xung đột với session đã có
    const sessionConflict = await instructorTimeslotRepository.checkSessionConflict(
      InstructorID,
      TimeslotID,
      Date
    );

    if (sessionConflict) {
      throw new Error(
        `Giảng viên đã có lịch dạy vào ca này. Vui lòng hủy buổi học trước.`
      );
    }

    const result = await instructorTimeslotRepository.create({
      InstructorID,
      TimeslotID,
      Date,
      Status,
      Note,
    });

    return {
      inserted: 1,
      slots: [
        {
          TimeslotID,
          Date,
          Status,
        },
      ],
    };
  }

  // Block toàn bộ ngày
  // 1. Xác định thứ trong tuần
  const dayOfWeek = getDayOfWeek(Date); // T2, T3, T4, ...

  // 2. Tìm tất cả các ca của thứ đó
  const allTimeslots = await timeslotRepository.findAll({ limit: 1000 });
  const slotsForDay = allTimeslots.data.filter(
    (ts) => ts.Day === dayOfWeek
  );

  if (slotsForDay.length === 0) {
    throw new Error(
      `Không tìm thấy ca học nào cho ${dayOfWeek} trong hệ thống`
    );
  }

  // 3. Kiểm tra và INSERT từng ca
  const insertedSlots = [];
  const conflicts = [];

  for (const slot of slotsForDay) {
    // Kiểm tra xung đột với session đã có
    const sessionConflict =
      await instructorTimeslotRepository.checkSessionConflict(
        InstructorID,
        slot.TimeslotID,
        Date
      );

    if (sessionConflict) {
      conflicts.push({
        TimeslotID: slot.TimeslotID,
        StartTime: slot.StartTime,
        EndTime: slot.EndTime,
        reason: `Giảng viên đã có lịch dạy lớp "${sessionConflict.ClassName}" vào ca này`,
      });
      continue; // Bỏ qua ca này
    }

    // Kiểm tra xem đã có lịch nghỉ chưa
    const existingLeave = await instructorTimeslotRepository.checkConflict(
      InstructorID,
      slot.TimeslotID,
      Date
    );

    if (existingLeave) {
      // Đã có lịch nghỉ, bỏ qua
      continue;
    }

    // INSERT lịch nghỉ
    await instructorTimeslotRepository.create({
      InstructorID,
      TimeslotID: slot.TimeslotID,
      Date,
      Status,
      Note,
    });

    insertedSlots.push({
      TimeslotID: slot.TimeslotID,
      StartTime: slot.StartTime,
      EndTime: slot.EndTime,
      Date,
      Status,
    });
  }

  return {
    inserted: insertedSlots.length,
    slots: insertedSlots,
    conflicts: conflicts,
    message:
      conflicts.length > 0
        ? `Đã thêm ${insertedSlots.length} ca nghỉ. Có ${conflicts.length} ca bị xung đột với lịch dạy.`
        : `Đã thêm ${insertedSlots.length} ca nghỉ cho toàn bộ ngày ${Date}`,
  };
}

/**
 * Logic "Cảnh báo Xung đột Tương lai" (GV xin nghỉ)
 * Kiểm tra xem có session nào bị ảnh hưởng khi GV xin nghỉ
 * @param {Object} params
 * @param {number} params.InstructorID
 * @param {string} params.Date - Format: 'YYYY-MM-DD'
 * @param {number} params.TimeslotID
 * @param {string} params.Status - 'Holiday', 'PersonalLeave', ...
 * @returns {Object} { hasConflicts: boolean, affectedSessions: [...], affectedClasses: [...] }
 */
async function checkFutureConflicts(params) {
  const { InstructorID, Date, TimeslotID, Status } = params;

  if (!InstructorID || !Date || !TimeslotID) {
    throw new Error("Thiếu tham số bắt buộc");
  }

  const pool = require("../config/db");

  // Tìm tất cả các session bị ảnh hưởng
  const conflictQuery = `
    SELECT 
      s.SessionID,
      s.Title as sessionTitle,
      s.Date,
      s.ClassID,
      c.Name as className,
      c.Status as classStatus,
      t.StartTime,
      t.EndTime,
      i.FullName as instructorName
    FROM session s
    INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
    INNER JOIN \`class\` c ON s.ClassID = c.ClassID
    INNER JOIN instructor i ON s.InstructorID = i.InstructorID
    WHERE s.InstructorID = ?
      AND s.Date = ?
      AND s.TimeslotID = ?
  `;

  const [affectedSessions] = await pool.execute(conflictQuery, [
    InstructorID,
    Date,
    TimeslotID,
  ]);

  // Nhóm theo ClassID để dễ xử lý
  const affectedClassesMap = new Map();
  const affectedSessionsList = [];

  for (const session of affectedSessions) {
    affectedSessionsList.push({
      SessionID: session.SessionID,
      Title: session.sessionTitle,
      Date: session.Date,
      StartTime: session.StartTime,
      EndTime: session.EndTime,
      ClassID: session.ClassID,
      ClassName: session.className,
      ClassStatus: session.classStatus,
    });

    if (!affectedClassesMap.has(session.ClassID)) {
      // Lấy thêm thông tin lớp
      const classEnrollments = await require("../repositories/enrollmentRepository").findByClassId(
        session.ClassID
      );
      const activeLearners = classEnrollments.filter(
        (e) => e.Status === "active" || e.Status === "enrolled"
      );

      affectedClassesMap.set(session.ClassID, {
        ClassID: session.ClassID,
        ClassName: session.className,
        ClassStatus: session.classStatus,
        affectedSessions: [],
        totalLearners: activeLearners.length,
      });
    }

    const classInfo = affectedClassesMap.get(session.ClassID);
    classInfo.affectedSessions.push({
      SessionID: session.SessionID,
      Title: session.sessionTitle,
      Date: session.Date,
      StartTime: session.StartTime,
      EndTime: session.EndTime,
    });
  }

  const affectedClasses = Array.from(affectedClassesMap.values());

  return {
    hasConflicts: affectedSessions.length > 0,
    affectedSessions: affectedSessionsList,
    affectedClasses: affectedClasses,
    summary: {
      totalAffectedSessions: affectedSessions.length,
      totalAffectedClasses: affectedClasses.length,
      totalAffectedLearners: affectedClasses.reduce(
        (sum, c) => sum + c.totalLearners,
        0
      ),
    },
    message:
      affectedSessions.length > 0
        ? `Cảnh báo: Có ${affectedSessions.length} buổi học và ${affectedClasses.length} lớp bị ảnh hưởng.`
        : "Không có buổi học nào bị ảnh hưởng.",
  };
}

/**
 * Xử lý Class bị ảnh hưởng (Sau khi báo cảnh báo)
 * Admin có thể chọn: Hủy session, Dời lịch, hoặc Tìm học bù
 * @param {Object} params
 * @param {number} params.ClassID
 * @param {string} params.action - 'cancel', 'reschedule', 'makeup'
 * @param {Array<number>} params.sessionIds - Danh sách SessionID cần xử lý
 * @param {Object} params.newSchedule - { Date, TimeslotID } (nếu reschedule)
 * @returns {Object} Result
 */
async function handleAffectedClass(params) {
  const { ClassID, action, sessionIds, newSchedule } = params;

  const classScheduleService = require("./classScheduleService");
  const results = [];

  if (action === "cancel") {
    // Hủy các session
    for (const sessionId of sessionIds) {
      try {
        await classScheduleService.cancelSession(sessionId);
        results.push({
          SessionID: sessionId,
          action: "cancelled",
          success: true,
        });
      } catch (error) {
        results.push({
          SessionID: sessionId,
          action: "cancelled",
          success: false,
          error: error.message,
        });
      }
    }
  } else if (action === "reschedule") {
    // Dời lịch
    if (!newSchedule || !newSchedule.Date || !newSchedule.TimeslotID) {
      throw new Error("Thiếu thông tin lịch mới");
    }

    for (const sessionId of sessionIds) {
      try {
        const updated = await classScheduleService.rescheduleSession(
          sessionId,
          newSchedule
        );
        results.push({
          SessionID: sessionId,
          action: "rescheduled",
          success: true,
          newDate: newSchedule.Date,
          newTimeslotID: newSchedule.TimeslotID,
        });
      } catch (error) {
        results.push({
          SessionID: sessionId,
          action: "rescheduled",
          success: false,
          error: error.message,
        });
      }
    }
  } else if (action === "makeup") {
    // Tìm học bù
    // Lấy thông tin session đầu tiên để biết TimeslotID và Day
    const session = await sessionRepository.findById(sessionIds[0]);
    if (!session || session.length === 0) {
      throw new Error("Session không tồn tại");
    }

    const sessionData = session[0];
    const dayOfWeek = getDayOfWeek(sessionData.Date);

    // Hủy session cũ
    for (const sessionId of sessionIds) {
      await classScheduleService.cancelSession(sessionId);
    }

    // Tìm học bù
    const makeupResult = await classScheduleService.addMakeupSessionAtEnd(
      ClassID,
      {
        TimeslotID: sessionData.TimeslotID,
        Day: dayOfWeek,
      }
    );

    results.push({
      action: "makeup",
      success: true,
      cancelledSessions: sessionIds,
      makeupSession: makeupResult,
    });
  }

  return {
    action: action,
    results: results,
    summary: {
      total: sessionIds.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    },
  };
}

module.exports = {
  addBulkInstructorLeave,
  checkFutureConflicts,
  handleAffectedClass,
};

