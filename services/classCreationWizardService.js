const sessionService = require("./sessionService");
const classService = require("./ClassService");
const classRepository = require("../repositories/classRepository");
const sessionRepository = require("../repositories/sessionRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const instructorTimeslotRepository = require("../repositories/InstructorTimeslotRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const {
  validateDateDayConsistency,
  validateInstructorLeave,
  getDayOfWeek,
} = require("../utils/sessionValidation");
const { CLASS_STATUS } = require("../constants/classStatus");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Logic "Tạo Lớp" (Class Creation Wizard)
 * Vòng lặp WHILE tìm các buổi học tiếp theo với 3 lần kiểm tra
 *
 * Logic cũ: Hỗ trợ multiple timeslots cho mỗi ngày (không dùng cho DRAFT)
 * Logic mới: Với DRAFT chỉ có một timeslot duy nhất, nhưng hàm này vẫn hỗ trợ multiple timeslots
 *   cho trường hợp edit lịch không phải DRAFT (cho phép chọn timeslot linh hoạt)
 *
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
    throw new ServiceError("Thiếu tham số bắt buộc để tạo lịch lớp", 400);
  }

  // Lấy thông tin lớp
  const classData = await classRepository.findById(ClassID);
  if (!classData || classData.length === 0) {
    throw new ServiceError("Lớp học không tồn tại", 404);
  }
  const className =
    classData[0].Name || classData[0].ClassName || `Class ${ClassID}`;

  // Lấy Type của instructor
  const instructorRepository = require("../repositories/instructorRepository");
  const instructor = await instructorRepository.findById(InstructorID);
  if (!instructor) {
    throw new ServiceError("Giảng viên không tồn tại", 404);
  }
  const instructorType = instructor.Type || "parttime";

  // Validation cho parttime: Kiểm tra có đủ ca để tạo lớp không
  if (instructorType === "parttime") {
    const instructorAvailabilityService = require("./instructorAvailabilityService");
    // Tính khoảng thời gian dự kiến (ước tính)
    const estimatedEndDate = new Date(OpendatePlan);
    estimatedEndDate.setDate(estimatedEndDate.getDate() + Numofsession * 7); // Ước tính

    const availability = await instructorAvailabilityService.getAvailability(
      InstructorID,
      OpendatePlan,
      formatDate(estimatedEndDate)
    );

    // Đếm số ca AVAILABLE
    const availableSlots = (availability.availabilitySlots || []).filter(
      (slot) => slot.status === "AVAILABLE"
    ).length;

    if (availableSlots < Numofsession) {
      const instructorName =
        instructor.FullName ||
        instructor.fullName ||
        `Giảng viên ${InstructorID}`;
      throw new ServiceError(
        `Giảng viên ${instructorName} chưa có đủ số buổi AVAILABLE cho ${Numofsession} buổi của lớp ${className}`,
        400
      );
    }
  }

  const validSessions = []; // Danh sách tạm thời các buổi học hợp lệ
  const conflicts = []; // Danh sách các buổi học bị conflict
  const startDate = new Date(OpendatePlan);
  let currentDate = new Date(startDate);
  const maxIterations = Numofsession * 20; // Giới hạn vòng lặp
  let iterations = 0;
  let sessionNumber = 1;

  // Set để check trùng buổi (cùng Date + TimeslotID)
  const usedSlots = new Set();

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
    // Logic cũ: Hỗ trợ multiple timeslots cho mỗi ngày (không dùng cho DRAFT)
    // Logic mới: Với DRAFT chỉ có một timeslot duy nhất, nhưng logic này vẫn hỗ trợ multiple timeslots
    //   cho trường hợp edit lịch không phải DRAFT (cho phép chọn timeslot linh hoạt)
    for (const timeslot of matchingTimeslots) {
      if (validSessions.length >= Numofsession) break;

      const sessionData = {
        Title: `Session for class ${className}`,

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

      // 2. Kiểm tra TRÙNG BUỔI (Logic mới: Không cho trùng)
      const slotKey = `${dateString}-${timeslot.TimeslotID}`;
      if (usedSlots.has(slotKey)) {
        conflicts.push({
          sessionIndex: sessionNumber,
          sessionData: sessionData,
          conflictType: "duplicate_session",
          conflictInfo: {
            message: `Buổi học trùng với buổi khác (cùng ngày ${dateString} và ca ${timeslot.TimeslotID})`,
            date: dateString,
            timeslotId: timeslot.TimeslotID,
          },
        });
        continue;
      }

      // 3. Kiểm tra Lịch bận để dạy (theo Type)
      const leaveValidation = await validateInstructorLeave(
        sessionData,
        instructorType
      );
      if (leaveValidation.hasConflict) {
        conflicts.push({
          sessionIndex: sessionNumber,
          sessionData: sessionData,
          conflictType: "instructor_leave",
          conflictInfo: leaveValidation.conflictInfo,
        });
        continue;
      }

      // 4. Kiểm tra Lịch DẠY (Session đã tồn tại)
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

      // Vượt qua tất cả kiểm tra - thêm vào danh sách tạm thời
      validSessions.push({
        index: sessionNumber,
        data: sessionData,
      });
      usedSlots.add(slotKey); // Đánh dấu đã sử dụng
      sessionNumber++;
    }

    // Chuyển sang ngày tiếp theo
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (validSessions.length < Numofsession) {
    throw new ServiceError(
      `Không thể tạo đủ ${Numofsession} buổi học. Chỉ tạo được ${validSessions.length} buổi.`,
      400
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
      throw new ServiceError("Lớp học chưa có buổi học nào", 404);
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
    throw new ServiceError(
      `Lỗi khi dời buổi học đầu: ${error.message}`,
      error.status || 500
    );
  }
}

/**
 * Helper: Cập nhật sessions (UPDATE trực tiếp)
 * @param {Array} sessionsToUpdate - [{SessionID, Date, TimeslotID, ...}]
 * @returns {Object} { updated: [...], errors: [...] }
 */
/**
 * UPDATE sessions trực tiếp thay vì xóa rồi tạo lại
 * @param {Array} sessionsToUpdate - Array of session objects với SessionID, Date, TimeslotID, ...
 * @returns {Object} { updated: [], errors: [] }
 */
async function updateSessions(sessionsToUpdate) {
  if (!Array.isArray(sessionsToUpdate) || sessionsToUpdate.length === 0) {
    return { updated: [], errors: [] };
  }

  const updated = [];
  const errors = [];

  console.log(
    `[updateSessions] Bắt đầu update ${sessionsToUpdate.length} sessions`
  );

  for (const session of sessionsToUpdate) {
    try {
      // 1. Validate SessionID
      if (!session.SessionID) {
        errors.push({
          session,
          error: "SessionID là bắt buộc để update",
        });
        continue;
      }

      const sessionId = Number(session.SessionID);
      if (isNaN(sessionId) || sessionId <= 0) {
        errors.push({
          session,
          error: `SessionID không hợp lệ: ${session.SessionID}`,
        });
        continue;
      }

      // 2. Lấy session hiện tại từ DB để có đầy đủ thông tin
      const existingSessions = await sessionRepository.findById(sessionId);
      if (!existingSessions || existingSessions.length === 0) {
        errors.push({
          session,
          error: `Không tìm thấy session với SessionID: ${sessionId}`,
        });
        continue;
      }

      const existingSession = existingSessions[0];
      const currentInstructorID =
        session.InstructorID || existingSession.InstructorID;
      const currentClassID = session.ClassID || existingSession.ClassID;
      const currentZoomUUID = existingSession.ZoomUUID;

      // 3. Validate Date và TimeslotID
      if (!session.Date || !session.TimeslotID) {
        errors.push({
          session,
          error: "Date và TimeslotID là bắt buộc",
        });
        continue;
      }

      // Validate Date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(session.Date)) {
        errors.push({
          session,
          error: `Date format không hợp lệ: ${session.Date} (phải là YYYY-MM-DD)`,
        });
        continue;
      }

      // Validate TimeslotID
      const timeslotId = Number(session.TimeslotID);
      if (isNaN(timeslotId) || timeslotId <= 0) {
        errors.push({
          session,
          error: `TimeslotID không hợp lệ: ${session.TimeslotID}`,
        });
        continue;
      }

      // 4. Kiểm tra xem có thay đổi Date hoặc TimeslotID không
      const hasDateChange = existingSession.Date !== session.Date;
      const hasTimeslotChange =
        Number(existingSession.TimeslotID) !== timeslotId;
      const hasInstructorChange =
        session.InstructorID &&
        Number(existingSession.InstructorID) !== Number(session.InstructorID);

      if (!hasDateChange && !hasTimeslotChange && !hasInstructorChange) {
        // Không có thay đổi gì, chỉ update Title/Description nếu có
        if (session.Title !== undefined || session.Description !== undefined) {
          const updateData = {};
          if (session.Title !== undefined) updateData.Title = session.Title;
          if (session.Description !== undefined)
            updateData.Description = session.Description;

          if (Object.keys(updateData).length > 0) {
            await sessionRepository.update(sessionId, updateData);
            updated.push({
              SessionID: sessionId,
              Date: existingSession.Date,
              TimeslotID: existingSession.TimeslotID,
              note: "Chỉ cập nhật Title/Description",
            });
          }
        }
        continue;
      }

      // 5. Check conflict với lịch giảng viên trước khi update
      // Exclude session hiện tại (không chỉ exclude class) để tránh conflict với chính nó
      const conflictCheck = await sessionService.checkSessionConflictInfo({
        InstructorID: currentInstructorID,
        Date: session.Date,
        TimeslotID: timeslotId,
        excludeSessionId: sessionId, // Exclude session hiện tại
        excludeClassId: currentClassID, // Exclude current class
      });

      if (conflictCheck.hasConflict) {
        errors.push({
          session,
          error: "Conflict với lịch giảng viên",
          conflictInfo: conflictCheck,
          details: {
            InstructorID: currentInstructorID,
            Date: session.Date,
            TimeslotID: timeslotId,
            conflictType: conflictCheck.conflictType,
          },
        });
        continue;
      }

      // 6. Prepare update data
      const updateData = {
        Date: session.Date,
        TimeslotID: timeslotId,
      };

      // Optional fields
      if (session.Title !== undefined) updateData.Title = session.Title;
      if (session.Description !== undefined)
        updateData.Description = session.Description;
      if (session.InstructorID !== undefined)
        updateData.InstructorID = Number(session.InstructorID);

      // 7. Update session trong DB
      await sessionRepository.update(sessionId, updateData);

      console.log(`[updateSessions] ✅ Updated session ${sessionId}:`, {
        oldDate: existingSession.Date,
        newDate: session.Date,
        oldTimeslotID: existingSession.TimeslotID,
        newTimeslotID: timeslotId,
        hasInstructorChange,
      });

      // 8. TODO: Update Zoom occurrence nếu Date/TimeslotID thay đổi
      // Nếu có ZoomUUID và Date/TimeslotID thay đổi, cần update Zoom occurrence
      if (currentZoomUUID && (hasDateChange || hasTimeslotChange)) {
        // TODO: Implement Zoom occurrence update
        // const zoomService = require('./zoomService');
        // await zoomService.updateZoomOccurrence({
        //   zoomUUID: currentZoomUUID,
        //   newDate: session.Date,
        //   newTimeslotID: timeslotId,
        //   oldDate: existingSession.Date,
        //   oldTimeslotID: existingSession.TimeslotID,
        // });
        console.log(
          `[updateSessions] ⚠️ TODO: Update Zoom occurrence cho session ${sessionId} (ZoomUUID: ${currentZoomUUID})`
        );
      }

      updated.push({
        SessionID: sessionId,
        Date: session.Date,
        TimeslotID: timeslotId,
        InstructorID: currentInstructorID,
        ClassID: currentClassID,
        changes: {
          dateChanged: hasDateChange,
          timeslotChanged: hasTimeslotChange,
          instructorChanged: hasInstructorChange,
        },
      });
    } catch (error) {
      console.error(
        `[updateSessions] ❌ Error updating session ${session.SessionID}:`,
        error
      );
      errors.push({
        session,
        error: error.message || "Lỗi khi update session",
        stack: error.stack,
      });
    }
  }

  console.log(
    `[updateSessions] Kết thúc: ${updated.length} updated, ${errors.length} errors`
  );

  return { updated, errors };
}

/**
 * Helper: Tạo sessions mới (CREATE)
 * @param {Array} sessionsToCreate - [{Date, TimeslotID, InstructorID, ClassID, ...}]
 * @returns {Object} { created: [...], errors: [...] }
 */
/**
 * CREATE sessions mới khi cần
 * @param {Array} sessionsToCreate - Array of session objects với Date, TimeslotID, InstructorID, ClassID, ...
 * @returns {Object} { created: [], errors: [] }
 */
async function createSessions(sessionsToCreate) {
  if (!Array.isArray(sessionsToCreate) || sessionsToCreate.length === 0) {
    return { created: [], errors: [] };
  }

  const created = [];
  const errors = [];

  console.log(
    `[createSessions] Bắt đầu create ${sessionsToCreate.length} sessions`
  );

  for (const session of sessionsToCreate) {
    try {
      // 1. Validate required fields
      if (
        !session.Date ||
        !session.TimeslotID ||
        !session.InstructorID ||
        !session.ClassID
      ) {
        errors.push({
          session,
          error: "Date, TimeslotID, InstructorID, ClassID là bắt buộc",
        });
        continue;
      }

      // 2. Validate Date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(session.Date)) {
        errors.push({
          session,
          error: `Date format không hợp lệ: ${session.Date} (phải là YYYY-MM-DD)`,
        });
        continue;
      }

      // 3. Validate TimeslotID
      const timeslotId = Number(session.TimeslotID);
      if (isNaN(timeslotId) || timeslotId <= 0) {
        errors.push({
          session,
          error: `TimeslotID không hợp lệ: ${session.TimeslotID}`,
        });
        continue;
      }

      // 4. Validate InstructorID và ClassID
      const instructorId = Number(session.InstructorID);
      const classId = Number(session.ClassID);
      if (isNaN(instructorId) || instructorId <= 0) {
        errors.push({
          session,
          error: `InstructorID không hợp lệ: ${session.InstructorID}`,
        });
        continue;
      }
      if (isNaN(classId) || classId <= 0) {
        errors.push({
          session,
          error: `ClassID không hợp lệ: ${session.ClassID}`,
        });
        continue;
      }

      // 5. Prepare session data
      const sessionData = {
        Title: session.Title || `Session for class ${classId}`,
        Description: session.Description || "",
        InstructorID: instructorId,
        ClassID: classId,
        TimeslotID: timeslotId,
        Date: session.Date,
        ZoomUUID: session.ZoomUUID || null,
      };

      // 6. Create session (sử dụng sessionService để có validation và Zoom handling)
      // sessionService.createSession sẽ tự động:
      // - Validate class tồn tại
      // - Validate timeslot tồn tại
      // - Validate Date-Day consistency
      // - Check instructor leave
      // - Check conflict với lịch giảng viên
      // - Tạo Zoom occurrence nếu class có ZoomID
      // - Sync class dates
      // - Mark instructor slot as booked
      const createResult = await sessionService.createSession(sessionData);

      if (createResult.conflict) {
        // Nếu có conflict (không nên xảy ra vì đã check ở trên, nhưng để an toàn)
        errors.push({
          session,
          error:
            createResult.conflict.conflictInfo?.message ||
            "Conflict khi tạo session",
          conflictType: createResult.conflict.conflictType,
          conflictInfo: createResult.conflict.conflictInfo,
        });
        continue;
      }

      if (!createResult.success) {
        errors.push({
          session,
          error: "Không thể tạo session (không có lỗi cụ thể)",
        });
        continue;
      }

      const newSession = createResult.success;
      const newSessionId = newSession.insertId || newSession.SessionID;

      console.log(`[createSessions] ✅ Created session ${newSessionId}:`, {
        Date: session.Date,
        TimeslotID: timeslotId,
        InstructorID: instructorId,
        ClassID: classId,
        ZoomUUID: newSession.ZoomUUID || session.ZoomUUID || null,
      });

      created.push({
        SessionID: newSessionId,
        Date: session.Date,
        TimeslotID: timeslotId,
        InstructorID: instructorId,
        ClassID: classId,
        Title: sessionData.Title,
        Description: sessionData.Description,
        ZoomUUID: newSession.ZoomUUID || session.ZoomUUID || null,
      });
    } catch (error) {
      console.error(`[createSessions] ❌ Error creating session:`, error);
      errors.push({
        session,
        error: error.message || "Lỗi khi create session",
        stack: error.stack,
      });
    }
  }

  console.log(
    `[createSessions] Kết thúc: ${created.length} created, ${errors.length} errors`
  );

  return { created, errors };
}

/**
 * Helper: Xóa sessions (DELETE)
 * @param {Array<number>} sessionIds - [SessionID1, SessionID2, ...]
 * @returns {Object} { deleted: [...], errors: [...] }
 */
async function deleteSessions(sessionIds) {
  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    return { deleted: [], errors: [] };
  }

  const deleted = [];
  const errors = [];
  const classIdsToSync = new Set(); // Để sync class dates sau khi xóa

  console.log(`[deleteSessions] Bắt đầu delete ${sessionIds.length} sessions`);

  // 1. Validate sessionIds
  const validIds = sessionIds
    .map((id) => Number(id))
    .filter((id) => !isNaN(id) && id > 0);

  if (validIds.length === 0) {
    return {
      deleted: [],
      errors: [{ error: "Không có SessionID hợp lệ" }],
    };
  }

  // 2. Lấy thông tin sessions trước khi xóa
  const sessionsToDelete = [];
  for (const sessionId of validIds) {
    try {
      const sessionData = await sessionRepository.findById(sessionId);
      if (!sessionData || sessionData.length === 0) {
        errors.push({
          sessionId,
          error: `Không tìm thấy session với SessionID: ${sessionId}`,
        });
        continue;
      }

      const session = sessionData[0];
      sessionsToDelete.push({
        SessionID: sessionId,
        InstructorID: session.InstructorID,
        TimeslotID: session.TimeslotID,
        Date: session.Date,
        ClassID: session.ClassID,
        ZoomUUID: session.ZoomUUID,
      });

      // Thu thập ClassIDs để sync sau
      if (session.ClassID) {
        classIdsToSync.add(Number(session.ClassID));
      }
    } catch (error) {
      console.error(
        `[deleteSessions] ❌ Error getting session ${sessionId}:`,
        error
      );
      errors.push({
        sessionId,
        error: `Lỗi khi lấy thông tin session: ${error.message}`,
      });
    }
  }

  if (sessionsToDelete.length === 0) {
    console.log(
      `[deleteSessions] Không có session nào để xóa sau khi validate`
    );
    return { deleted, errors };
  }

  // 3. Xóa Zoom occurrences trước (nếu có)
  const zoomService = require("./zoomService");
  for (const session of sessionsToDelete) {
    if (session.ZoomUUID) {
      try {
        // TODO: Implement Zoom occurrence deletion
        // await zoomService.deleteZoomOccurrence({
        //   zoomUUID: session.ZoomUUID,
        //   sessionId: session.SessionID,
        // });
        console.log(
          `[deleteSessions] ⚠️ TODO: Delete Zoom occurrence cho session ${session.SessionID} (ZoomUUID: ${session.ZoomUUID})`
        );
      } catch (zoomError) {
        console.error(
          `[deleteSessions] ❌ Error deleting Zoom occurrence cho session ${session.SessionID}:`,
          zoomError
        );
        // Không throw để không làm gián đoạn flow xóa session
      }
    }
  }

  // 4. Giải phóng instructor slots (markSlotAsAvailable)
  const instructorAvailabilityService = require("./instructorAvailabilityService");
  for (const session of sessionsToDelete) {
    if (session.InstructorID && session.TimeslotID && session.Date) {
      try {
        await instructorAvailabilityService.markSlotAsAvailable(
          session.InstructorID,
          session.TimeslotID,
          session.Date
        );
        console.log(
          `[deleteSessions] ✅ Released instructor slot: InstructorID=${session.InstructorID}, TimeslotID=${session.TimeslotID}, Date=${session.Date}`
        );
      } catch (releaseError) {
        console.error(
          `[deleteSessions] ❌ Error releasing instructor slot cho session ${session.SessionID}:`,
          releaseError
        );
        // Không throw để không làm gián đoạn flow xóa session
      }
    }
  }

  // 5. Xóa sessions trong DB
  try {
    const sessionIdsToDelete = sessionsToDelete.map((s) => s.SessionID);
    const result = await sessionRepository.deleteMany(sessionIdsToDelete);

    console.log(
      `[deleteSessions] ✅ Deleted ${
        result.affectedRows || sessionIdsToDelete.length
      } sessions từ DB`
    );

    // 6. Sync class dates sau khi xóa
    for (const classId of classIdsToSync) {
      try {
        await sessionService.syncClassDates(classId);
        console.log(
          `[deleteSessions] ✅ Synced class dates cho ClassID: ${classId}`
        );
      } catch (syncError) {
        console.error(
          `[deleteSessions] ❌ Error syncing class dates cho ClassID ${classId}:`,
          syncError
        );
        // Không throw để không làm gián đoạn flow
      }
    }

    // 7. Return kết quả
    deleted.push(
      ...sessionsToDelete.map((s) => ({
        SessionID: s.SessionID,
        ClassID: s.ClassID,
        Date: s.Date,
        TimeslotID: s.TimeslotID,
        InstructorID: s.InstructorID,
      }))
    );
  } catch (error) {
    console.error(`[deleteSessions] ❌ Error deleting sessions:`, error);
    errors.push({
      error: error.message || "Lỗi khi delete sessions",
      stack: error.stack,
    });
  }

  console.log(
    `[deleteSessions] Kết thúc: ${deleted.length} deleted, ${errors.length} errors`
  );

  return { deleted, errors };
}

/**
 * Helper: Reschedule sessions (Xóa cũ + Tạo mới)
 * @param {Array} sessionsToReschedule - [{originalSessionID, Date, TimeslotID, ...}]
 * @returns {Object} { rescheduled: [...], errors: [...] }
 */
/**
 * RESCHEDULE sessions (Xóa session cũ + Tạo session mới)
 * @param {Array} sessionsToReschedule - Array of session objects với originalSessionID, Date, TimeslotID, ...
 * @returns {Object} { rescheduled: [], errors: [] }
 */
async function rescheduleSessions(sessionsToReschedule) {
  if (
    !Array.isArray(sessionsToReschedule) ||
    sessionsToReschedule.length === 0
  ) {
    return { rescheduled: [], errors: [] };
  }

  const rescheduled = [];
  const errors = [];

  console.log(
    `[rescheduleSessions] Bắt đầu reschedule ${sessionsToReschedule.length} sessions`
  );

  for (const session of sessionsToReschedule) {
    try {
      // 1. Validate originalSessionID
      if (!session.originalSessionID) {
        errors.push({
          session,
          error: "originalSessionID là bắt buộc để reschedule",
        });
        continue;
      }

      const originalSessionId = Number(session.originalSessionID);
      if (isNaN(originalSessionId) || originalSessionId <= 0) {
        errors.push({
          session,
          error: `originalSessionID không hợp lệ: ${session.originalSessionID}`,
        });
        continue;
      }

      // 2. Validate required fields cho session mới
      if (
        !session.Date ||
        !session.TimeslotID ||
        !session.InstructorID ||
        !session.ClassID
      ) {
        errors.push({
          session,
          error:
            "Date, TimeslotID, InstructorID, ClassID là bắt buộc cho session mới",
        });
        continue;
      }

      // 3. Validate Date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(session.Date)) {
        errors.push({
          session,
          error: `Date format không hợp lệ: ${session.Date} (phải là YYYY-MM-DD)`,
        });
        continue;
      }

      // 4. Validate TimeslotID, InstructorID, ClassID
      const timeslotId = Number(session.TimeslotID);
      const instructorId = Number(session.InstructorID);
      const classId = Number(session.ClassID);

      if (isNaN(timeslotId) || timeslotId <= 0) {
        errors.push({
          session,
          error: `TimeslotID không hợp lệ: ${session.TimeslotID}`,
        });
        continue;
      }
      if (isNaN(instructorId) || instructorId <= 0) {
        errors.push({
          session,
          error: `InstructorID không hợp lệ: ${session.InstructorID}`,
        });
        continue;
      }
      if (isNaN(classId) || classId <= 0) {
        errors.push({
          session,
          error: `ClassID không hợp lệ: ${session.ClassID}`,
        });
        continue;
      }

      // 5. Lấy thông tin session cũ trước khi xóa
      const oldSessionData = await sessionRepository.findById(
        originalSessionId
      );
      if (!oldSessionData || oldSessionData.length === 0) {
        errors.push({
          session,
          error: `Không tìm thấy session cũ với SessionID: ${originalSessionId}`,
        });
        continue;
      }

      const oldSession = oldSessionData[0];
      const oldZoomUUID = oldSession.ZoomUUID;

      // 6. Check conflict với lịch giảng viên trước khi reschedule
      // Exclude session cũ để tránh conflict với chính nó
      const conflictCheck = await sessionService.checkSessionConflictInfo({
        InstructorID: instructorId,
        Date: session.Date,
        TimeslotID: timeslotId,
        excludeSessionId: originalSessionId, // Exclude session cũ
        excludeClassId: classId, // Exclude current class
      });

      if (conflictCheck.hasConflict) {
        errors.push({
          session,
          error: "Conflict với lịch giảng viên",
          conflictType: conflictCheck.conflictType,
          conflictInfo: conflictCheck.conflictInfo,
        });
        continue;
      }

      // 7. Xóa session cũ (sử dụng sessionService để có đầy đủ logic)
      // sessionService.deleteSession sẽ tự động:
      // - Release instructor slot
      // - Sync class dates
      await sessionService.deleteSession(originalSessionId);

      console.log(
        `[rescheduleSessions] ✅ Deleted old session ${originalSessionId}`
      );

      // 8. Tạo session mới (sử dụng sessionService để có validation và Zoom handling)
      const sessionData = {
        Title:
          session.Title || oldSession.Title || `Session for class ${classId}`,
        Description: session.Description || oldSession.Description || "",
        InstructorID: instructorId,
        ClassID: classId,
        TimeslotID: timeslotId,
        Date: session.Date,
        ZoomUUID: session.ZoomUUID || null, // ZoomUUID sẽ được tạo tự động nếu class có ZoomID
      };

      const createResult = await sessionService.createSession(sessionData);

      if (createResult.conflict) {
        // Nếu có conflict khi tạo session mới (không nên xảy ra vì đã check ở trên)
        errors.push({
          session,
          error:
            createResult.conflict.conflictInfo?.message ||
            "Conflict khi tạo session mới",
          conflictType: createResult.conflict.conflictType,
          conflictInfo: createResult.conflict.conflictInfo,
        });
        // Session cũ đã bị xóa, cần rollback hoặc thông báo lỗi nghiêm trọng
        console.error(
          `[rescheduleSessions] ❌ CRITICAL: Session cũ đã bị xóa nhưng không thể tạo session mới! originalSessionID: ${originalSessionId}`
        );
        continue;
      }

      if (!createResult.success) {
        errors.push({
          session,
          error: "Không thể tạo session mới (không có lỗi cụ thể)",
        });
        // Session cũ đã bị xóa, cần rollback hoặc thông báo lỗi nghiêm trọng
        console.error(
          `[rescheduleSessions] ❌ CRITICAL: Session cũ đã bị xóa nhưng không thể tạo session mới! originalSessionID: ${originalSessionId}`
        );
        continue;
      }

      const newSession = createResult.success;
      const newSessionId = newSession.insertId || newSession.SessionID;

      // 9. TODO: Update Zoom occurrence nếu có ZoomUUID cũ
      // Nếu session cũ có ZoomUUID và session mới cũng có ZoomUUID (từ class ZoomID),
      // cần update Zoom occurrence thay vì xóa rồi tạo mới
      if (oldZoomUUID && newSession.ZoomUUID) {
        // TODO: Implement Zoom occurrence update
        // const zoomService = require('./zoomService');
        // await zoomService.updateZoomOccurrence({
        //   oldZoomUUID: oldZoomUUID,
        //   newZoomUUID: newSession.ZoomUUID,
        //   oldDate: oldSession.Date,
        //   newDate: session.Date,
        //   oldTimeslotID: oldSession.TimeslotID,
        //   newTimeslotID: timeslotId,
        // });
        console.log(
          `[rescheduleSessions] ⚠️ TODO: Update Zoom occurrence: oldZoomUUID=${oldZoomUUID}, newZoomUUID=${newSession.ZoomUUID}`
        );
      } else if (oldZoomUUID && !newSession.ZoomUUID) {
        // Session cũ có ZoomUUID nhưng session mới không có (class không có ZoomID)
        // TODO: Delete Zoom occurrence cũ
        console.log(
          `[rescheduleSessions] ⚠️ TODO: Delete Zoom occurrence cũ: oldZoomUUID=${oldZoomUUID}`
        );
      }

      console.log(`[rescheduleSessions] ✅ Rescheduled session:`, {
        originalSessionID: originalSessionId,
        newSessionID: newSessionId,
        oldDate: oldSession.Date,
        newDate: session.Date,
        oldTimeslotID: oldSession.TimeslotID,
        newTimeslotID: timeslotId,
        oldZoomUUID: oldZoomUUID,
        newZoomUUID: newSession.ZoomUUID || null,
      });

      rescheduled.push({
        originalSessionID: originalSessionId,
        newSessionID: newSessionId,
        Date: session.Date,
        TimeslotID: timeslotId,
        InstructorID: instructorId,
        ClassID: classId,
        Title: sessionData.Title,
        Description: sessionData.Description,
        oldDate: oldSession.Date,
        oldTimeslotID: oldSession.TimeslotID,
        oldZoomUUID: oldZoomUUID,
        newZoomUUID: newSession.ZoomUUID || null,
      });
    } catch (error) {
      console.error(
        `[rescheduleSessions] ❌ Error rescheduling session:`,
        error
      );
      errors.push({
        session,
        error: error.message || "Lỗi khi reschedule session",
        stack: error.stack,
      });
    }
  }

  console.log(
    `[rescheduleSessions] Kết thúc: ${rescheduled.length} rescheduled, ${errors.length} errors`
  );

  return { rescheduled, errors };
}

/**
 * Cập nhật lại schedule của lớp khi admin chỉnh sửa (Edit Class Wizard)
 *
 * Format mới (optimized) - Chỉ hỗ trợ format này:
 * - sessions phải là Object với các trường: update, create, delete, reschedule
 * - Mỗi trường là array các session objects hoặc session IDs
 * - Operations được thực hiện theo thứ tự: UPDATE → CREATE → DELETE → RESCHEDULE
 *
 * @param {Object} params
 * @param {number} params.ClassID - ID của lớp học
 * @param {Object} params.sessions - Object chứa các operations:
 *   - update: Array sessions cần UPDATE [{SessionID, Date, TimeslotID, Title?, Description?, InstructorID?}]
 *     * SessionID: Bắt buộc, ID của session cần update
 *     * Date: Bắt buộc, ngày mới (format: YYYY-MM-DD)
 *     * TimeslotID: Bắt buộc, ID của timeslot mới
 *   - create: Array sessions cần CREATE [{Date, TimeslotID, InstructorID, ClassID, Title?, Description?}]
 *     * Date, TimeslotID, InstructorID, ClassID: Bắt buộc
 *   - delete: Array SessionIDs cần DELETE [SessionID1, SessionID2, ...]
 *     * Chỉ cần gửi SessionID (number)
 *   - reschedule: Array sessions cần RESCHEDULE [{originalSessionID, Date, TimeslotID, InstructorID, ClassID, ...}]
 *     * originalSessionID: Bắt buộc, ID của session cũ cần xóa
 *     * Date, TimeslotID, InstructorID, ClassID: Bắt buộc cho session mới
 * @param {string} [params.OpendatePlan] - (optional) Ngày bắt đầu kế hoạch mới (format: YYYY-MM-DD)
 * @param {string} [params.EnddatePlan] - (optional) Ngày kết thúc kế hoạch mới (format: YYYY-MM-DD)
 * @param {number} [params.Numofsession] - (optional) Số buổi học mới
 * @param {number} [params.InstructorID] - (optional) ID giảng viên mới (sẽ update tất cả sessions nếu có)
 * @returns {Object} { success: boolean, summary: {...}, details: {...}, conflicts: [...] }
 *
 * @example
 * await updateClassSchedule({
 *   ClassID: 157,
 *   sessions: {
 *     update: [{ SessionID: 123, Date: "2026-01-15", TimeslotID: 26 }],
 *     create: [{ Date: "2026-01-20", TimeslotID: 26, InstructorID: 16, ClassID: 157 }],
 *     delete: [124, 125],
 *     reschedule: [{ originalSessionID: 126, Date: "2026-01-25", TimeslotID: 26, InstructorID: 16, ClassID: 157 }]
 *   },
 *   OpendatePlan: "2026-01-01",
 *   Numofsession: 12
 * });
 */
async function updateClassSchedule(params) {
  const {
    ClassID,
    sessions,
    scheduleDetail,
    // Metadata changes
    OpendatePlan,
    EnddatePlan,
    Numofsession,
    InstructorID,
  } = params;

  if (!ClassID) {
    throw new ServiceError("Thiếu ClassID khi cập nhật lịch", 400);
  }

  // Validate payload format mới: sessions phải là object với update/create/delete/reschedule
  if (!sessions || typeof sessions !== "object" || Array.isArray(sessions)) {
    throw new ServiceError(
      "Payload không hợp lệ: sessions phải là object với các trường update, create, delete, hoặc reschedule",
      400
    );
  }

  // Validate: Phải có ít nhất một trong các trường update/create/delete/reschedule
  const hasAnySessions =
    (Array.isArray(sessions.update) && sessions.update.length > 0) ||
    (Array.isArray(sessions.create) && sessions.create.length > 0) ||
    (Array.isArray(sessions.delete) && sessions.delete.length > 0) ||
    (Array.isArray(sessions.reschedule) && sessions.reschedule.length > 0);

  if (!hasAnySessions) {
    throw new ServiceError(
      "Danh sách buổi học mới không được rỗng (phải có ít nhất một trong: update, create, delete, reschedule)",
      400
    );
  }

  // Lấy thông tin lớp để dùng Name khi cần
  const classData = await classService.getClassById(ClassID);
  if (!classData) {
    throw new ServiceError("Lớp học không tồn tại", 404);
  }

  // Notify when admin postpones planned start date for an ACTIVE class
  // Requirement: when admin updates an ACTIVE class and moves OpendatePlan later,
  // notify learners (if any), instructor, and staff creator.
  try {
    const oldOpendatePlan = classData.OpendatePlan || classData.opendatePlan;
    const newOpendatePlan = OpendatePlan;
    const classStatus = classData.Status || classData.status;
    const isActiveClass = classStatus === "ACTIVE";
    const oldD = oldOpendatePlan ? new Date(oldOpendatePlan) : null;
    const newD = newOpendatePlan ? new Date(newOpendatePlan) : null;
    const isPostponed =
      oldOpendatePlan &&
      newOpendatePlan &&
      oldD &&
      newD &&
      !Number.isNaN(oldD.getTime()) &&
      !Number.isNaN(newD.getTime()) &&
      newD.getTime() > oldD.getTime();

    if (isActiveClass && isPostponed) {
      const notificationService = require("./notificationService");
      await notificationService.notifyClassStartDatePostponed({
        classId: ClassID,
        className: classData.Name,
        newOpendatePlan: newOpendatePlan,
        instructorId: classData.InstructorID,
        createdByStaffId: classData.CreatedByStaffID,
      });
    }
  } catch (notifError) {
    console.error(
      "[updateClassSchedule] Failed to notifyClassStartDatePostponed:",
      notifError?.message || notifError
    );
    // Don't throw to avoid breaking main flow
  }

  // 1. Cập nhật metadata nếu có (OpendatePlan, Numofsession, InstructorID)
  // Lưu ý: Không gọi classService.updateClass() vì nó không cho phép cập nhật schedule fields
  // Thay vào đó, cập nhật trực tiếp qua repository
  if (OpendatePlan || EnddatePlan || Numofsession || InstructorID) {
    const metadataUpdate = {};
    if (OpendatePlan) metadataUpdate.OpendatePlan = OpendatePlan;
    if (EnddatePlan) metadataUpdate.EnddatePlan = EnddatePlan;
    if (Numofsession) metadataUpdate.Numofsession = Numofsession;
    if (InstructorID) metadataUpdate.InstructorID = InstructorID;

    if (Object.keys(metadataUpdate).length > 0) {
      // Cập nhật trực tiếp qua repository (bypass updateClass validation)
      await classRepository.update(ClassID, metadataUpdate);
      console.log(
        `[updateClassSchedule] Đã cập nhật metadata:`,
        metadataUpdate
      );
    }
  }

  // 2. Xử lý sessions với format mới
  return await updateClassScheduleNewFormat({
    ClassID,
    sessions,
    classData,
    scheduleDetail,
  });
}

/**
 * Xử lý updateClassSchedule với format mới (optimized)
 * @private
 */
async function updateClassScheduleNewFormat(params) {
  const { ClassID, sessions, classData, scheduleDetail } = params;

  // Validate DRAFT pattern nếu cần
  const classStatus = classData.Status || classData.status || "";
  const isDraftClass = classStatus === "DRAFT" || classStatus === "draft";
  if (isDraftClass && scheduleDetail) {
    validateSingleTimeslotPattern(scheduleDetail);
  }

  const results = {
    updated: [],
    created: [],
    deleted: [],
    rescheduled: [],
    errors: [],
  };

  // 1. UPDATE sessions
  if (Array.isArray(sessions.update) && sessions.update.length > 0) {
    // Ensure ClassID và InstructorID cho mỗi session
    const sessionsToUpdate = sessions.update.map((s) => ({
      ...s,
      ClassID: s.ClassID || ClassID,
      InstructorID: s.InstructorID || classData.InstructorID,
    }));

    const updateResult = await updateSessions(sessionsToUpdate);
    results.updated = updateResult.updated;
    results.errors.push(...updateResult.errors);
  }

  // 2. CREATE sessions
  if (Array.isArray(sessions.create) && sessions.create.length > 0) {
    // Ensure ClassID và InstructorID cho mỗi session
    const sessionsToCreate = sessions.create.map((s) => ({
      ...s,
      ClassID: s.ClassID || ClassID,
      InstructorID: s.InstructorID || classData.InstructorID,
    }));

    const createResult = await createSessions(sessionsToCreate);
    results.created = createResult.created;
    results.errors.push(...createResult.errors);
  }

  // 3. DELETE sessions
  if (Array.isArray(sessions.delete) && sessions.delete.length > 0) {
    const deleteResult = await deleteSessions(sessions.delete);
    results.deleted = deleteResult.deleted;
    results.errors.push(...deleteResult.errors);
  }

  // 4. RESCHEDULE sessions
  if (Array.isArray(sessions.reschedule) && sessions.reschedule.length > 0) {
    // Ensure ClassID và InstructorID cho mỗi session
    const sessionsToReschedule = sessions.reschedule.map((s) => ({
      ...s,
      ClassID: s.ClassID || ClassID,
      InstructorID: s.InstructorID || classData.InstructorID,
    }));

    const rescheduleResult = await rescheduleSessions(sessionsToReschedule);
    results.rescheduled = rescheduleResult.rescheduled;
    results.errors.push(...rescheduleResult.errors);
  }

  // Return kết quả
  return {
    success: true,
    summary: {
      updated: results.updated.length,
      created: results.created.length,
      deleted: results.deleted.length,
      rescheduled: results.rescheduled.length,
      errors: results.errors.length,
    },
    details: {
      updated: results.updated,
      created: results.created,
      deleted: results.deleted,
      rescheduled: results.rescheduled,
    },
    conflicts: results.errors.map((err) => ({
      type: "error",
      info: err.error || err,
      session: err.session,
    })),
  };
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
      throw new ServiceError("Lớp học chưa có buổi học nào", 404);
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
          throw new ServiceError(
            `Không thể tạo buổi học bù: ${result.conflict.conflictInfo.message}`,
            409
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

    throw new ServiceError(
      "Không tìm thấy ngày hợp lệ để thêm buổi học bù trong vòng 100 ngày",
      400
    );
  } catch (error) {
    throw new ServiceError(
      `Lỗi khi thêm buổi học bù: ${error.message}`,
      error.status || 500
    );
  }
}

/**
 * Hàm tìm các ca rảnh của Giảng viên trong 1 tuần tới (Bước 1)
 * Kiểm tra lịch của GV và (nếu có ClassID) kiểm tra trùng lịch học viên
 * @param {Object} params
 * @param {number} params.InstructorID
 * @param {number} params.TimeslotID
 * @param {string} params.Day - T2, T3, T4, ...
 * @param {number} params.numSuggestions - Số gợi ý (mặc định 5)
 * @param {string} params.startDate - Ngày bắt đầu tìm (YYYY-MM-DD)
 * @param {number} params.excludeClassId - ClassID cần loại trừ (để tránh conflict với sessions đã tạo của class này)
 * @param {number} [params.ClassID] - ClassID lớp hiện tại để check learner conflicts (tùy chọn)
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
    ClassID,
  } = params;

  const suggestionsLimit = Math.max(1, Math.min(numSuggestions, 20)); // giới hạn an toàn
  const availableSlots = [];
  const busySlots = [];
  const initialDate = startDate ? new Date(startDate) : new Date();
  if (isNaN(initialDate.getTime())) {
    initialDate.setTime(Date.now());
  }
  initialDate.setHours(0, 0, 0, 0);
  let currentDate = new Date(initialDate);
  const maxIterations = 50; // Tìm trong 50 ngày (giới hạn cứng để tránh vòng lặp dài)
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

  while (
    availableSlots.length < suggestionsLimit &&
    iterations < maxIterations
  ) {
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

      let learnerConflictResult = null;
      let hasLearnerConflict = false;

      if (ClassID) {
        try {
          learnerConflictResult = await checkLearnerConflicts({
            ClassID,
            Date: dateString,
            TimeslotID,
          });
          hasLearnerConflict = learnerConflictResult?.isValid === false;
        } catch (err) {
          console.warn(
            `[findAvailableInstructorSlots] Warning: checkLearnerConflicts failed for ${dateString} - ${TimeslotID}`,
            err?.message
          );
          hasLearnerConflict = false; // fallback: không block nếu check lỗi
        }
      }

      if (!hasLeaveConflict && !hasTeachingConflict && !hasLearnerConflict) {
        availableSlots.push({
          date: dateString,
          dayOfWeek: dayOfWeek,
          timeslotId: TimeslotID,
          available: true,
          reason: null,
          learnerConflicts: learnerConflictResult?.conflicts || [],
        });
      } else {
        let reason = "";
        if (hasLeaveConflict) {
          reason = `GV nghỉ: ${
            leaveValidation.conflictInfo.status || "HOLIDAY"
          }`;
        }
        if (hasTeachingConflict) {
          reason += reason
            ? `; GV dạy lớp: ${
                teachingConflict.conflictInfo.className || "N/A"
              }`
            : `GV dạy lớp: ${teachingConflict.conflictInfo.className || "N/A"}`;
        }
        if (hasLearnerConflict) {
          const learnerMsg =
            learnerConflictResult?.summary?.conflictedLearners > 0
              ? `${learnerConflictResult.summary.conflictedLearners} học viên trùng lịch`
              : "Học viên trùng lịch";
          reason += reason ? `; ${learnerMsg}` : learnerMsg;
        }

        console.log(
          `[findAvailableInstructorSlots] Ngày ${dateString} BẬN - ${reason}`
        );
        busySlots.push({
          date: dateString,
          dayOfWeek: dayOfWeek,
          timeslotId: TimeslotID,
          available: false,
          reason: reason,
          learnerConflicts: learnerConflictResult?.conflicts || [],
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
    if (availableSlots.length >= suggestionsLimit) {
      // Đủ slots rảnh, chỉ trả về availableSlots
      console.log(
        `[findAvailableInstructorSlots] Trả về ${suggestionsLimit} available slots`
      );
      return availableSlots.slice(0, suggestionsLimit);
    } else {
      // Không đủ slots rảnh, bổ sung busySlots nếu có
      if (busySlots.length > 0) {
        const remaining = Math.max(0, suggestionsLimit - availableSlots.length);
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
        suggestionsLimit
      )} busy slots`
    );
    return busySlots.slice(0, suggestionsLimit);
  }

  // Không có gì
  console.log(`[findAvailableInstructorSlots] Không tìm thấy slots nào`);
  return [];
}

/**
 * Hàm gợi ý ca học cho EDIT schedule
 * - Gọi findAvailableInstructorSlots để lấy suggestions
 * - Sau đó check HOLIDAY cho từng slot bằng cách query instructor_leave table
 * - Chỉ trả về các slot không có HOLIDAY
 */
async function findAvailableSlotsForEdit(params) {
  const {
    InstructorID,
    TimeslotID,
    Day,
    numSuggestions = 20,
    startDate,
    excludeClassId = null,
    ClassID = null,
  } = params;

  console.log(
    `[findAvailableSlotsForEdit] Params:`,
    JSON.stringify({ InstructorID, TimeslotID, Day, ClassID, excludeClassId })
  );

  // Nếu có ClassID, query để xem các sessions hiện tại của lớp này
  if (ClassID) {
    const connectDB = require("../config/db");
    const pool = await connectDB();
    const checkQuery = `
      SELECT SessionID, Date, TimeslotID, ClassID
      FROM session
      WHERE ClassID = ?
        AND InstructorID = ?
      ORDER BY Date
      LIMIT 20
    `;
    const [existingSessions] = await pool.execute(checkQuery, [
      ClassID,
      InstructorID,
    ]);
    console.log(
      `[findAvailableSlotsForEdit] Existing sessions of class ${ClassID}:`,
      existingSessions
    );
  }

  // Bước 1: Lấy suggestions từ findAvailableInstructorSlots
  // KHÔNG truyền excludeClassId (truyền null) để vẫn check conflict với các sessions của lớp hiện tại
  // Nếu truyền excludeClassId, nó sẽ bỏ qua các sessions của lớp đó, không check conflict
  const allSuggestions = await findAvailableInstructorSlots({
    InstructorID,
    TimeslotID,
    Day,
    numSuggestions,
    startDate,
    excludeClassId: null, // Không bỏ qua lớp hiện tại, vẫn check conflict với TẤT CẢ sessions
    ClassID,
  });

  if (allSuggestions.length === 0) {
    return [];
  }

  // Bước 2: Lấy danh sách HOLIDAY dates và check conflict với lớp hiện tại
  const connectDB = require("../config/db");
  const pool = await connectDB();

  // Tìm min và max date từ suggestions
  const dates = allSuggestions
    .map((s) => s.date || s.Date)
    .filter(Boolean)
    .sort();

  if (dates.length === 0) {
    return allSuggestions;
  }

  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  // Query HOLIDAY leaves trong khoảng ngày
  const holidayQuery = `
    SELECT DISTINCT Date, TimeslotID
    FROM instructortimeslot
    WHERE InstructorID = ?
      AND Status = 'HOLIDAY'
      AND Date >= ?
      AND Date <= ?
      AND (TimeslotID = ? OR TimeslotID IS NULL)
  `;

  const [holidayRows] = await pool.execute(holidayQuery, [
    InstructorID,
    minDate,
    maxDate,
    TimeslotID,
  ]);

  // Tạo Set các ngày HOLIDAY (cả ngày hoặc theo timeslot)
  const holidayDates = new Set();
  holidayRows.forEach((row) => {
    if (row.TimeslotID === null || row.TimeslotID === TimeslotID) {
      holidayDates.add(row.Date);
    }
  });

  console.log(
    `[findAvailableSlotsForEdit] Found ${holidayDates.size} HOLIDAY dates:`,
    Array.from(holidayDates)
  );

  // Bước 3: Filter các suggestions không có HOLIDAY
  // Conflict với các sessions (kể cả lớp hiện tại) đã được check trong findAvailableInstructorSlots
  // với excludeClassId: null, nên không cần check thêm
  const validSuggestions = allSuggestions.filter((suggestion) => {
    const slotDate = suggestion.date || suggestion.Date;
    if (!slotDate) return false;

    // Nếu slot date nằm trong holidayDates, bỏ qua
    if (holidayDates.has(slotDate)) {
      console.log(
        `[findAvailableSlotsForEdit] Slot ${slotDate} là HOLIDAY, bỏ qua`
      );
      return false;
    }

    return true;
  });

  console.log(
    `[findAvailableSlotsForEdit] Filtered: ${allSuggestions.length} → ${
      validSuggestions.length
    } (removed ${
      allSuggestions.length - validSuggestions.length
    } HOLIDAY slots)`
  );

  return validSuggestions;
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

    const pool = require("../config/db");

    // Gom tất cả LearnerID đang active/enrolled thành 1 mảng để query bulk
    const learnerIds = activeLearners.map((e) => e.LearnerID);
    const placeholders = learnerIds.map(() => "?").join(", ");

    const conflictQuery = `
      SELECT 
        e.LearnerID,
        l.FullName AS learnerName,
        s.SessionID,
        s.Title AS sessionTitle,
        s.Date,
        c.Name AS className,
        t.StartTime,
        t.EndTime
      FROM enrollment e
      INNER JOIN \`class\` c ON e.ClassID = c.ClassID
      INNER JOIN session s ON s.ClassID = c.ClassID
      INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN learner l ON e.LearnerID = l.LearnerID
      WHERE e.LearnerID IN (${placeholders})
        AND e.Status IN ('active', 'enrolled')
        AND s.Date = ?
        AND s.TimeslotID = ?
        AND c.ClassID != ?
    `;

    const queryParams = [...learnerIds, Date, TimeslotID, ClassID];
    const [conflictRows] = await pool.execute(conflictQuery, queryParams);

    const conflicts = conflictRows.map((row) => ({
      learnerId: row.LearnerID,
      learnerName: row.learnerName || "N/A",
      conflictInfo: {
        className: row.className,
        sessionTitle: row.sessionTitle,
        date: row.Date,
        startTime: row.StartTime,
        endTime: row.EndTime,
      },
    }));

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
    throw new ServiceError(
      `Lỗi khi kiểm tra xung đột học viên: ${error.message}`,
      error.status || 500
    );
  }
}

/**
 * Hàm Phân tích độ bận định kỳ (analyzeBlockedDays)
 * Phân tích lịch bận của instructor để xác định các ngày trong tuần bị bận định kỳ
 * Logic mới: Nếu số buổi bận > 0 cho một timeslot -> Coi là bận -> KHÓA (không cho trùng)
 * @param {Object} params
 * @param {number} params.InstructorID - ID giảng viên
 * @param {string} params.OpendatePlan - Ngày bắt đầu dự kiến (YYYY-MM-DD)
 * @param {number} params.Numofsession - Tổng số buổi học dự kiến
 * @param {Array<number>} params.DaysOfWeek - Mảng các thứ trong tuần [0,1,2,...] (0=CN, 1=T2, ...)
 * @param {Object} params.TimeslotsByDay - Object với key là dayOfWeek, value là array timeslotIDs {0: [1,2], 1: [3]}
 * @returns {Object} { blockedDays: {dayOfWeek: [timeslotIds]}, analysis: {...} }
 */
// Simple in-memory cache cho analyzeBlockedDays (TTL ngắn)
const analyzeBlockedDaysCache = new Map();
const ANALYZE_BLOCKED_TTL_MS = 5 * 60 * 1000; // 5 phút

function buildAnalyzeBlockedCacheKey(params) {
  const {
    InstructorID,
    OpendatePlan,
    Numofsession,
    DaysOfWeek = [],
    TimeslotsByDay = {},
  } = params || {};

  // Sắp xếp key TimeslotsByDay để key ổn định
  const normalizedTimeslotsByDay = {};
  Object.keys(TimeslotsByDay)
    .sort()
    .forEach((day) => {
      const arr = TimeslotsByDay[day] || [];
      normalizedTimeslotsByDay[day] = [...arr].sort();
    });

  return JSON.stringify({
    InstructorID,
    OpendatePlan,
    Numofsession,
    DaysOfWeek: [...DaysOfWeek].sort(),
    TimeslotsByDay: normalizedTimeslotsByDay,
  });
}

async function analyzeBlockedDays(params) {
  const {
    InstructorID,
    OpendatePlan,
    Numofsession,
    DaysOfWeek = [],
    TimeslotsByDay = {},
  } = params;

  if (!InstructorID || !OpendatePlan || !Numofsession) {
    throw new ServiceError(
      "Thiếu tham số: InstructorID, OpendatePlan, Numofsession",
      400
    );
  }

  // Kiểm tra cache trước
  try {
    const cacheKey = buildAnalyzeBlockedCacheKey(params);
    const cached = analyzeBlockedDaysCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const blockedDays = {}; // {dayOfWeek: [timeslotIds]} - các timeslot bị khóa
    const analysis = {}; // Chi tiết phân tích

    // Tính số tuần dự kiến
    let sessionsPerWeek = 0;
    DaysOfWeek.forEach((dayOfWeek) => {
      const dayTimeslots = TimeslotsByDay[dayOfWeek] || [];
      sessionsPerWeek += dayTimeslots.length;
    });

    if (sessionsPerWeek === 0) {
      // Không có ca học nào, không cần phân tích
      const emptyResult = { blockedDays: {}, analysis: {} };
      analyzeBlockedDaysCache.set(cacheKey, {
        value: emptyResult,
        expiresAt: now + ANALYZE_BLOCKED_TTL_MS,
      });
      return emptyResult;
    }

    const totalWeeks = Math.ceil(Numofsession / sessionsPerWeek);

    console.log("[analyzeBlockedDays] INPUT", {
      InstructorID,
      OpendatePlan,
      Numofsession,
      DaysOfWeek,
      TimeslotsByDay,
      sessionsPerWeek,
      totalWeeks,
    });

    // Tính ngày kết thúc dự kiến (xấp xỉ)
    const startDate = new Date(OpendatePlan);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalWeeks * 7);

    // Lấy tất cả lịch bận của instructor trong khoảng thời gian này (OTHER)
    const blockedSchedules = await instructorTimeslotRepository.findByDateRange(
      formatDate(startDate),
      formatDate(endDate),
      InstructorID
    );

    const relevantBlocks = blockedSchedules.filter(
      (block) => (block.Status || "").toUpperCase() === "OTHER"
    );

    const manualStats = buildConflictStats(relevantBlocks);

    // Lấy lịch dạy (session) để cộng dồn xung đột
    const teachingSchedules = await sessionRepository.findByDateRange(
      formatDate(startDate),
      formatDate(endDate),
      { instructorId: InstructorID }
    );

    const teachingStats = buildConflictStats(teachingSchedules);

    console.log("[analyzeBlockedDays] RAW BLOCKS", {
      OTHER_count: relevantBlocks.length,
      SESSION_count: teachingSchedules.length,
    });

    // Chuẩn bị meta timeslot cho pattern đang xét (TimeslotsByDay)
    const timeslotMetaMap = new Map();
    const patternTimeslotIds = new Set();
    DaysOfWeek.forEach((dow) => {
      const tsForDay = TimeslotsByDay[dow] || [];
      tsForDay.forEach((id) => {
        const normId = normalizeTimeslotId(id);
        patternTimeslotIds.add(normId);
      });
    });

    for (const normId of patternTimeslotIds) {
      const numericId = Number(normId);
      try {
        const ts =
          !Number.isNaN(numericId) && numericId > 0
            ? await timeslotRepository.findById(numericId)
            : await timeslotRepository.findById(normId);
        if (ts) {
          timeslotMetaMap.set(normId, ts);
        }
      } catch (e) {
        console.warn(
          "[analyzeBlockedDays] Warning: cannot load timeslot meta for",
          normId,
          e?.message
        );
      }
    }

    // Phân tích từng ngày trong tuần và từng timeslot
    for (const dayOfWeek of DaysOfWeek) {
      const dayTimeslots = TimeslotsByDay[dayOfWeek] || [];
      if (dayTimeslots.length === 0) continue;

      const blockedTimeslotsForDay = [];

      // Kiểm tra từng timeslot trong ngày
      for (const timeslotId of dayTimeslots) {
        const normTsId = normalizeTimeslotId(timeslotId);
        const tsMeta = timeslotMetaMap.get(normTsId);

        let slotKeyPart;
        if (
          tsMeta &&
          (tsMeta.StartTime || tsMeta.startTime) &&
          (tsMeta.EndTime || tsMeta.endTime)
        ) {
          const startKey = normalizeTimeToKey(
            tsMeta.StartTime || tsMeta.startTime
          );
          const endKey = normalizeTimeToKey(tsMeta.EndTime || tsMeta.endTime);
          slotKeyPart = `${startKey}-${endKey}`;
        } else {
          // Fallback: dùng TimeslotID nếu không có giờ
          slotKeyPart = `TSID:${normTsId}`;
        }

        const slotKey = buildSlotKey(dayOfWeek, slotKeyPart);

        // Đếm số buổi bận cho timeslot này
        const manualCount = manualStats.counts.get(slotKey) || 0;
        const sessionCount = teachingStats.counts.get(slotKey) || 0;
        const totalBusyCount = manualCount + sessionCount;

        // Logic mới: Nếu số buổi bận > 0 thì khóa timeslot này (không cho trùng)
        if (totalBusyCount > 0) {
          blockedTimeslotsForDay.push(timeslotId);
        }

        // Lưu thông tin phân tích
        const blockedDates = collectConflictDates(
          [slotKey],
          manualStats.dates,
          teachingStats.dates
        );

        analysis[`${dayOfWeek}-${timeslotId}`] = {
          manualOccurrences: manualCount,
          sessionOccurrences: sessionCount,
          totalBusyCount,
          isBlocked: totalBusyCount > 0, // Logic mới: > 0 là blocked (không cho trùng)
          blockedDates,
        };

        console.log("[analyzeBlockedDays] SLOT ANALYSIS", {
          dayOfWeek,
          timeslotId,
          slotKey,
          manualCount,
          sessionCount,
          totalBusyCount,
          isBlocked: totalBusyCount > 0,
          blockedDates,
        });
      }

      // Nếu có timeslot bị khóa, lưu vào blockedDays
      if (blockedTimeslotsForDay.length > 0) {
        blockedDays[dayOfWeek] = blockedTimeslotsForDay;
      }
    }

    const result = {
      blockedDays,
      analysis,
      summary: {
        totalWeeks,
        totalManualConflicts: relevantBlocks.length,
        totalSessionConflicts: teachingSchedules.length,
      },
    };

    analyzeBlockedDaysCache.set(cacheKey, {
      value: result,
      expiresAt: now + ANALYZE_BLOCKED_TTL_MS,
    });

    return result;
  } catch (e) {
    // Nếu có lỗi, không cache kết quả lỗi
    throw e;
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

function buildConflictStats(entries = []) {
  const counts = new Map();
  const dates = new Map();

  entries.forEach((entry) => {
    if (!entry) {
      return;
    }

    const dateObj = new Date(entry.Date || entry.date);
    if (Number.isNaN(dateObj.getTime())) {
      return;
    }

    const dateString = formatDate(dateObj);
    const dayOfWeek = dateObj.getDay();

    // Ưu tiên dùng StartTime/EndTime để gom xung đột theo khoảng giờ,
    // tránh trường hợp nhiều TimeslotID khác nhau nhưng cùng giờ học.
    const rawStart = entry.StartTime || entry.startTime;
    const rawEnd = entry.EndTime || entry.endTime;

    let slotKeyPart;
    if (rawStart && rawEnd) {
      const startKey = normalizeTimeToKey(rawStart);
      const endKey = normalizeTimeToKey(rawEnd);
      if (startKey && endKey) {
        slotKeyPart = `${startKey}-${endKey}`;
      }
    }

    // Fallback: nếu không có giờ, gom theo TimeslotID như cũ
    if (!slotKeyPart) {
      if (entry.TimeslotID === undefined || entry.TimeslotID === null) {
        return;
      }
      slotKeyPart = `TSID:${normalizeTimeslotId(entry.TimeslotID)}`;
    }

    const key = buildSlotKey(dayOfWeek, slotKeyPart);

    counts.set(key, (counts.get(key) || 0) + 1);

    if (!dates.has(key)) {
      dates.set(key, []);
    }
    const currentDates = dates.get(key);
    if (currentDates.length < 10) {
      currentDates.push(dateString);
    }
  });

  return { counts, dates };
}

function collectConflictDates(slotKeys, manualDatesMap, sessionDatesMap) {
  const combined = [];

  slotKeys.forEach((key) => {
    (manualDatesMap.get(key) || []).forEach((date) => {
      if (combined.length < 10) {
        combined.push(`${date} (OTHER)`);
      }
    });
    (sessionDatesMap.get(key) || []).forEach((date) => {
      if (combined.length < 10) {
        combined.push(`${date} (SESSION)`);
      }
    });
  });

  return combined.slice(0, 10);
}

function buildSlotKey(dayOfWeek, slotKeyPart) {
  return `${dayOfWeek}_${String(slotKeyPart ?? "").trim()}`;
}

function normalizeTimeToKey(value) {
  if (!value) return "";
  const str = String(value).trim();

  // Cắt bỏ phần ngày / timezone / mili-giây nếu có (ví dụ: "HH:MM:SS.000Z", "HH:MM:SS +07:00")
  const mainPart = str.split(/[T\s+]/)[0]; // lấy phần trước khoảng trắng / 'T' / '+'

  // Tìm pattern HH:MM hoặc H:MM trong mainPart
  const match = /(\d{1,2}):(\d{2})/.exec(mainPart);
  if (!match) {
    return str.trim();
  }

  const hh = match[1].padStart(2, "0");
  const mm = match[2].padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeTimeslotId(value) {
  if (value === null || value === undefined) return "";
  const numberCandidate = Number(value);
  if (!Number.isNaN(numberCandidate)) {
    return String(numberCandidate);
  }
  return String(value).trim();
}

/**
 * Tìm ngày bắt đầu phù hợp theo desired timeslots (API chuyên dụng - tối ưu)
 * Logic tương tự findBetterStartDate ở FE nhưng được tối ưu ở BE
 * @param {Object} params
 * @param {number} params.InstructorID
 * @param {Array<number>} params.DaysOfWeek
 * @param {Object} params.TimeslotsByDay
 * @param {number} params.Numofsession
 * @param {number} params.sessionsPerWeek
 * @param {number} params.requiredSlotsPerWeek
 * @param {string} params.currentStartDate
 * @returns {Array<Object>} [{date, availableSlots, reason}, ...]
 */
async function searchTimeslots(params) {
  const {
    InstructorID,
    DaysOfWeek = [],
    TimeslotsByDay = {},
    Numofsession,
    sessionsPerWeek = 0,
    requiredSlotsPerWeek = 0,
    currentStartDate = null,
    ClassID = null,
  } = params;

  // Validate input cơ bản để tránh chạy thuật toán nặng không cần thiết
  if (!InstructorID) {
    return [];
  }

  if (!Array.isArray(DaysOfWeek) || DaysOfWeek.length === 0) {
    return [];
  }

  if (!Numofsession || Numofsession <= 0) {
    return [];
  }

  if (sessionsPerWeek === 0) {
    return [];
  }

  // Chuẩn hoá DaysOfWeek để sử dụng xuyên suốt
  const normalizedDaysOfWeek = Array.from(new Set(DaysOfWeek)).sort();
  const daysOfWeekSet = new Set(normalizedDaysOfWeek);

  const suggestions = [];
  const requiredSlots = requiredSlotsPerWeek || sessionsPerWeek;
  // Tính tổng số timeslots đã chọn
  let totalSelectedSlots = 0;
  normalizedDaysOfWeek.forEach((dow) => {
    const timeslotsForDay = TimeslotsByDay[dow] || [];
    totalSelectedSlots += timeslotsForDay.length;
  });
  // minRequiredSlots = số timeslots đã chọn (không ép tối thiểu 3, vì có thể chỉ chọn 1-2 ca)
  const minRequiredSlots = Math.max(requiredSlots, totalSelectedSlots || 1);
  const maxSuggestions = 3;

  // Thay vì luôn check 104 tuần, giới hạn động theo nhu cầu thực tế:
  // - weeksNeeded = số tuần tối thiểu để đủ Numofsession với sessionsPerWeek hiện tại
  // - maxWeeksToCheck = min(weeksNeeded * 4, 52) → tối đa 1 năm, nhưng ưu tiên vùng gần
  const weeksNeeded = Math.ceil(Numofsession / sessionsPerWeek);
  const maxWeeksToCheck = Math.min(Math.max(weeksNeeded * 4, weeksNeeded), 52);

  // Bắt đầu từ ngày hiện tại hoặc currentStartDate
  let checkDate = currentStartDate ? new Date(currentStartDate) : new Date();
  checkDate.setDate(checkDate.getDate() + 1); // Ngày mai

  let weeksChecked = 0;
  let totalDaysChecked = 0;
  const maxDaysToCheck = maxWeeksToCheck * 7; // Giới hạn tổng số ngày

  while (
    weeksChecked < maxWeeksToCheck &&
    suggestions.length < maxSuggestions &&
    totalDaysChecked < maxDaysToCheck
  ) {
    // Tìm ngày đầu tiên trong tuần này phù hợp với daysOfWeek
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      if (suggestions.length >= maxSuggestions) break;
      totalDaysChecked++;

      const candidateDate = new Date(checkDate);
      candidateDate.setDate(candidateDate.getDate() + dayOffset);
      const dateString = formatDate(candidateDate);
      const dayOfWeekNum = candidateDate.getDay();

      // Kiểm tra xem ngày này có trong daysOfWeek không
      if (!daysOfWeekSet.has(dayOfWeekNum)) continue;

      // Kiểm tra số slot khả dụng cho ngày này
      try {
        // Gọi analyzeBlockedDays để kiểm tra
        const blockedResult = await analyzeBlockedDays({
          InstructorID,
          OpendatePlan: dateString,
          Numofsession,
          DaysOfWeek,
          TimeslotsByDay,
        });

        // Logic mới: Tính số slot khả dụng (chỉ AVAILABLE, không trùng)
        let availableSlots = 0;
        let totalSlots = 0;

        normalizedDaysOfWeek.forEach((dow) => {
          const timeslotsForDay = TimeslotsByDay[dow] || [];

          timeslotsForDay.forEach((timeslotId) => {
            totalSlots++;
            // Lấy thông tin phân tích từ analysis
            const analysisKey = `${dow}-${timeslotId}`;
            const slotAnalysis = blockedResult.analysis?.[analysisKey];

            // Logic mới: KHÔNG cho trùng buổi (busyCount > 0 là LOCKED)
            const busyCount = slotAnalysis?.totalBusyCount || 0;

            // Timeslot hợp lệ khi busyCount === 0 (không trùng)
            if (busyCount === 0) {
              availableSlots++;
            }
          });
        });

        // Logic mới: Suggest ngày khi TẤT CẢ timeslots đều AVAILABLE (không trùng)
        // 1. availableSlots === totalSlots (tất cả ca đều không trùng)
        // 2. totalSlots >= minRequiredSlots (đủ số ca đã chọn)
        console.log("[searchTimeslots] CANDIDATE", {
          dateString,
          dayOfWeekNum,
          availableSlots,
          totalSlots,
          minRequiredSlots,
        });

        if (
          availableSlots === totalSlots &&
          totalSlots >= minRequiredSlots &&
          totalSlots > 0
        ) {
          // ✅ Thêm check learner conflicts nếu có ClassID
          let learnerConflictCount = 0;
          let learnerConflicts = [];
          if (ClassID) {
            try {
              for (const dow of normalizedDaysOfWeek) {
                const timeslotsForDay = TimeslotsByDay[dow] || [];
                for (const timeslotId of timeslotsForDay) {
                  const conflictResult = await checkLearnerConflicts({
                    ClassID,
                    Date: dateString,
                    TimeslotID: timeslotId,
                  });
                  if (conflictResult?.isValid === false) {
                    learnerConflictCount +=
                      conflictResult.summary?.conflictedLearners || 0;
                    learnerConflicts.push(...(conflictResult.conflicts || []));
                  }
                }
              }
            } catch (err) {
              console.warn(
                `[searchTimeslots] Warning: checkLearnerConflicts fail at ${dateString}`,
                err?.message
              );
            }
          }

          const hasLearnerConflicts = learnerConflictCount > 0;

          suggestions.push({
            date: dateString,
            availableSlots,
            totalSlots,
            reason: hasLearnerConflicts
              ? `Đủ ${availableSlots} ca/tuần (có ${learnerConflictCount} học viên trùng lịch)`
              : `Đủ ${availableSlots} ca/tuần (tất cả ca đều hợp lệ)`,
            hasLearnerConflicts,
            learnerConflicts,
          });

          // Nếu đã tìm được ngày có tất cả ca hợp lệ, ưu tiên dừng sớm
          if (suggestions.length >= 1) {
            // Vẫn tiếp tục tìm thêm 1-2 ngày nữa để có nhiều lựa chọn
            if (suggestions.length >= maxSuggestions) {
              return suggestions;
            }
          }
        }
      } catch (error) {
        console.error(`Error checking date ${dateString}:`, error);
        // Bỏ qua lỗi và tiếp tục
      }
    }

    // Chuyển sang tuần tiếp theo
    checkDate.setDate(checkDate.getDate() + 7);
    weeksChecked++;
  }

  return suggestions;
}

/**
 * Lấy lý do chi tiết tại sao một timeslot bị khóa
 * @param {Object} params
 * @param {number} params.InstructorID
 * @param {number} params.dayOfWeek
 * @param {number} params.timeslotId
 * @param {string} params.startDate
 * @param {string} params.endDatePlan
 * @param {number} params.numofsession
 * @param {number} params.depth - Độ sâu đệ quy (mặc định 0)
 * @returns {Object} { isLocked, reasons: [...], summary: {...} }
 */
async function getTimeslotLockReasons(params, depth = 0) {
  const {
    InstructorID,
    dayOfWeek,
    timeslotId,
    startDate,
    endDatePlan,
    numofsession,
  } = params;

  if (depth > 20) {
    throw new ServiceError(
      "Không thể tìm đủ số buổi trong thời gian hợp lý (quá 20 lần đệ quy)",
      400
    );
  }

  try {
    const blocks = await instructorTimeslotRepository.findByDateRange(
      startDate,
      endDatePlan,
      InstructorID
    );

    const holidayMap = new Map();
    const blockMap = new Map();

    const slotBlocks = blocks.filter((b) => b.TimeslotID === timeslotId);

    console.log(slotBlocks);

    slotBlocks.forEach((b) => {
      const dateStr = new Date(b.Date).toISOString().slice(0, 10);

      blockMap.set(dateStr, b.Status);

      if (b.Status === "HOLIDAY") {
        holidayMap.set(dateStr, true);
      }
    });

    const sessions = await sessionRepository.findByInstructorAndDateRange(
      InstructorID,
      startDate,
      endDatePlan
    );

    const conflictSessions = sessions.filter(
      (s) => s.TimeslotID === timeslotId
    );

    if (conflictSessions.length > 0) {
      return {
        isLocked: true,
        reasons: [
          {
            type: "session_conflict",
            message: `Ca này đã có ${conflictSessions.length} buổi học`,
            sessions: conflictSessions.slice(0, 5),
          },
        ],
      };
    }

    let validCount = 0;
    let holidaysSkipped = 0;

    let current = new Date(startDate);
    const end = new Date(endDatePlan);

    while (current <= end) {
      if (current.getDay() === dayOfWeek) {
        const dateStr = current.toISOString().slice(0, 10);
        const weekday = current.getDay(); // 0 = Sunday

        const status = blockMap.get(dateStr);
        const isHoliday = holidayMap.has(dateStr);

        if (isHoliday) {
          holidaysSkipped++;
        } else if (weekday === 0) {
          if (!status) {
            return {
              isLocked: true,
              reasons: [
                {
                  type: "sunday_missing_block",
                  message: `Chủ nhật ${dateStr} không có block → bị chặn`,
                },
              ],
            };
          }

          if (status !== "Available" && status !== "AVAILABLE") {
            return {
              isLocked: true,
              reasons: [
                {
                  type: "sunday_blocked",
                  message: `Chủ nhật ${dateStr} bị block với trạng thái ${status}`,
                },
              ],
            };
          }

          validCount++;
        } else {
          if (!status || status === "AVAILABLE") {
            validCount++;
          } else {
            return {
              isLocked: true,
              reasons: [
                {
                  type: "weekday_blocked",
                  message: `Ngày ${dateStr} bị block (${status})`,
                },
              ],
            };
          }
        }

        if (validCount >= numofsession) {
          return {
            isLocked: false,
            summary: {
              totalValidSessions: validCount,
              holidaysSkipped,
            },
          };
        }
      }

      current.setDate(current.getDate() + 1);
    }

    const newEndDatePlan = new Date(endDatePlan);
    newEndDatePlan.setDate(newEndDatePlan.getDate() + 7);

    return await getTimeslotLockReasons(
      {
        ...params,
        endDatePlan: newEndDatePlan.toISOString().slice(0, 10),
      },
      depth + 1
    );
  } catch (error) {
    throw new ServiceError(
      `Lỗi khi lấy lý do chi tiết: ${error.message}`,
      error.status || 500
    );
  }
}

/**
 * Logic mới: Validate timeslot pattern cho lớp DRAFT
 * Yêu cầu: Các ca học trong ngày phải giống nhau cho tất cả các ngày trong tuần
 * @param {Object} scheduleDetail - Object chứa TimeslotsByDay: { dayOfWeek: [timeslotIDs] }
 * @throws {Error} Nếu các ngày có set timeslots khác nhau
 */
function validateSingleTimeslotPattern(scheduleDetail) {
  if (!scheduleDetail || !scheduleDetail.TimeslotsByDay) {
    return; // Không có TimeslotsByDay → không validate (có thể là edit lịch không phải DRAFT)
  }

  const timeslotsByDay = scheduleDetail.TimeslotsByDay;
  const dayOfWeeks = Object.keys(timeslotsByDay).filter(
    (day) =>
      Array.isArray(timeslotsByDay[day]) && timeslotsByDay[day].length > 0
  );

  if (dayOfWeeks.length === 0) {
    return; // Không có ngày nào được chọn → không validate
  }

  // Lấy set timeslots từ ngày đầu tiên làm chuẩn
  const firstDay = dayOfWeeks[0];
  const firstDayTimeslots = new Set(
    timeslotsByDay[firstDay].map((id) => String(id))
  );

  // Kiểm tra các ngày còn lại có cùng set timeslots không
  for (let i = 1; i < dayOfWeeks.length; i++) {
    const day = dayOfWeeks[i];
    const dayTimeslots = new Set(timeslotsByDay[day].map((id) => String(id)));

    // So sánh 2 sets có giống nhau không
    if (
      firstDayTimeslots.size !== dayTimeslots.size ||
      ![...firstDayTimeslots].every((id) => dayTimeslots.has(id))
    ) {
      throw new ServiceError(
        `Lớp DRAFT: Các ca học trong tuần phải giống nhau. ` +
          `Thứ ${firstDay} có ca [${[...firstDayTimeslots].join(", ")}], ` +
          `nhưng thứ ${day} có ca [${[...dayTimeslots].join(", ")}]`,
        400
      );
    }
  }
}

module.exports = {
  createClassWizard,
  delayClassStart,
  updateClassSchedule,
  addMakeupSessionAtEnd,
  findAvailableInstructorSlots,
  findAvailableSlotsForEdit,
  checkLearnerConflicts,
  analyzeBlockedDays,
  searchTimeslots,
  getTimeslotLockReasons,
  validateSingleTimeslotPattern,
};
