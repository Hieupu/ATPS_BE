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
    throw new Error("Thiếu tham số bắt buộc");
  }

  // Lấy thông tin lớp
  const classData = await classRepository.findById(ClassID);
  if (!classData || classData.length === 0) {
    throw new Error("Lớp học không tồn tại");
  }
  const className =
    classData[0].Name || classData[0].ClassName || `Class ${ClassID}`;

  // Lấy Type của instructor
  const instructorRepository = require("../repositories/instructorRepository");
  const instructor = await instructorRepository.findById(InstructorID);
  if (!instructor) {
    throw new Error("Giảng viên không tồn tại");
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
      throw new Error(
        `Giảng viên ${instructorName} chưa tạo đủ số buổi cho ${Numofsession} của lớp ${className}`
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
 * Cập nhật lại schedule của lớp khi admin chỉnh sửa (Edit Class Wizard)
 * - Nhận danh sách sessions mới từ FE (đã đảm bảo không trùng, đủ Numofsession, v.v.)
 * - Xóa các sessions cũ thuộc lớp trong khoảng ngày bị thay đổi (nếu cần)
 * - Tự động giải phóng các slot OTHER -> AVAILABLE thông qua sessionService.deleteSession()
 * - Tạo lại các sessions mới bằng sessionService.createBulkSessions()
 * - Trả về chi tiết conflicts (nếu có) để FE hiển thị message kiểu:
 *   "Ca {Thứ, StartTime-EndTime, Ngày} đã có lịch, vui lòng chọn ca khác"
 *
 * @param {Object} params
 * @param {number} params.ClassID
 * @param {Array} params.sessions - danh sách sessions mới [{Date, TimeslotID, InstructorID, Title, Description}]
 * @param {string} [params.startDate] - (optional) ngày bắt đầu vùng cần cập nhật
 * @param {string} [params.endDate] - (optional) ngày kết thúc vùng cần cập nhật
 */
async function updateClassSchedule(params) {
  const { ClassID, sessions, startDate, endDate, scheduleDetail } = params;

  if (!ClassID) {
    throw new Error("ClassID là bắt buộc khi cập nhật schedule");
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error("Danh sách sessions mới không được rỗng");
  }

  // Lấy thông tin lớp để dùng Name khi cần
  const classData = await classService.getClassById(ClassID);
  if (!classData) {
    throw new Error("Lớp học không tồn tại");
  }

  // Logic mới: Validate single timeslot pattern cho lớp DRAFT
  const classStatus = classData.Status || classData.status || "";
  const isDraftClass = classStatus === "DRAFT" || classStatus === "draft";

  if (isDraftClass) {
    // Nếu có scheduleDetail, validate từ TimeslotsByDay
    if (scheduleDetail) {
      validateSingleTimeslotPattern(scheduleDetail);
    } else if (sessions && sessions.length > 0) {
      // Nếu không có scheduleDetail, validate từ sessions array
      // Logic mới: Các ngày phải có cùng set timeslots (so sánh StartTime-EndTime), ngày cuối được phép có subset

      // Lấy tất cả TimeslotID từ sessions để query timeslot info
      const allTimeslotIds = [
        ...new Set(
          sessions.map((s) => s.TimeslotID).filter((id) => id != null)
        ),
      ];

      // Lấy thông tin timeslot từ database
      const timeslotMap = new Map();
      for (const timeslotId of allTimeslotIds) {
        const timeslot = await timeslotRepository.findById(timeslotId);
        if (timeslot) {
          timeslotMap.set(timeslotId, timeslot);
        }
      }

      // Helper function: Tạo key từ StartTime-EndTime để so sánh
      // Ưu tiên dùng TimeslotStart/TimeslotEnd từ session nếu có, nếu không thì lấy từ timeslot
      const getTimeslotKey = (session) => {
        // Ưu tiên dùng TimeslotStart/TimeslotEnd từ session
        if (session.TimeslotStart && session.TimeslotEnd) {
          return `${(session.TimeslotStart || "").trim()}-${(
            session.TimeslotEnd || ""
          ).trim()}`;
        }
        // Fallback: lấy từ timeslot
        const timeslot = timeslotMap.get(session.TimeslotID);
        if (!timeslot) return null;
        const startTime = (timeslot.StartTime || "").trim();
        const endTime = (timeslot.EndTime || "").trim();
        return `${startTime}-${endTime}`;
      };

      // Nhóm sessions theo Date, lưu timeslot keys (StartTime-EndTime) thay vì TimeslotID
      const sessionsByDate = {};
      sessions.forEach((session) => {
        const date = session.Date;
        if (!date) return;

        if (!sessionsByDate[date]) {
          sessionsByDate[date] = [];
        }
        const timeslotKey = getTimeslotKey(session);
        if (timeslotKey) {
          sessionsByDate[date].push(timeslotKey);
        }
      });

      // Sắp xếp các ngày theo thứ tự
      const sortedDates = Object.keys(sessionsByDate).sort();

      if (sortedDates.length === 0) {
        throw new Error(
          "Lớp học có Status = DRAFT nhưng không có sessions hợp lệ"
        );
      }

      // Lấy set timeslot keys chung từ các ngày (trừ ngày cuối)
      if (sortedDates.length > 1) {
        const datesToCheck = sortedDates.slice(0, -1); // Tất cả ngày trừ ngày cuối

        // Lấy set timeslot keys từ ngày đầu tiên làm chuẩn
        const firstDateTimeslots = new Set(sessionsByDate[datesToCheck[0]]);

        // Kiểm tra các ngày còn lại (trừ ngày cuối) có cùng set timeslot keys không
        for (let i = 1; i < datesToCheck.length; i++) {
          const date = datesToCheck[i];
          const dateTimeslots = new Set(sessionsByDate[date]);

          // So sánh 2 sets có giống nhau không (so sánh StartTime-EndTime)
          if (
            firstDateTimeslots.size !== dateTimeslots.size ||
            ![...firstDateTimeslots].every((key) => dateTimeslots.has(key))
          ) {
            throw new Error(
              `Lớp học có Status = DRAFT: Các ca học trong ngày phải giống nhau cho tất cả các ngày. ` +
                `Ngày ${datesToCheck[0]} có ca học [${[
                  ...firstDateTimeslots,
                ].join(", ")}] ` +
                `nhưng ngày ${date} có ca học [${[...dateTimeslots].join(
                  ", "
                )}]`
            );
          }
        }

        // Kiểm tra ngày cuối: được phép có subset của set chung
        const lastDate = sortedDates[sortedDates.length - 1];
        const lastDateTimeslots = new Set(sessionsByDate[lastDate]);

        // Kiểm tra ngày cuối có phải subset của set chung không (so sánh StartTime-EndTime)
        const isSubset = [...lastDateTimeslots].every((key) =>
          firstDateTimeslots.has(key)
        );

        if (!isSubset) {
          throw new Error(
            `Lớp học có Status = DRAFT: Ngày cuối cùng (${lastDate}) có ca học [${[
              ...lastDateTimeslots,
            ].join(", ")}] ` +
              `không khớp với các ca học chung [${[...firstDateTimeslots].join(
                ", "
              )}]`
          );
        }
      }
    }
  }

  // 1. Lấy toàn bộ sessions hiện tại của lớp
  const existingSessions = await sessionRepository.findByClassId(ClassID);

  // 2. Xác định vùng thời gian cần cập nhật
  // Nếu FE truyền startDate/endDate thì dùng luôn, nếu không thì tự tính min/max từ sessions mới
  let effectiveStart = startDate;
  let effectiveEnd = endDate;

  if (!effectiveStart || !effectiveEnd) {
    const dates = sessions
      .map((s) => s.Date)
      .filter((d) => !!d)
      .sort();
    if (dates.length > 0) {
      effectiveStart = effectiveStart || dates[0];
      effectiveEnd = effectiveEnd || dates[dates.length - 1];
    }
  }

  // 3. Xác định các sessions cũ cần xóa trong vùng bị thay đổi
  let sessionsToDelete = existingSessions;
  if (effectiveStart && effectiveEnd) {
    sessionsToDelete = existingSessions.filter((s) => {
      const d = s.Date;
      return d >= effectiveStart && d <= effectiveEnd;
    });
  }

  // 4. Xóa các sessions cũ trong vùng (deleteSession sẽ tự giải phóng slot và syncClassDates)
  for (const session of sessionsToDelete) {
    try {
      await sessionService.deleteSession(session.SessionID);
    } catch (error) {
      console.error(
        `[updateClassSchedule] Lỗi khi xóa session ${session.SessionID}:`,
        error
      );
      // Tiếp tục với các session khác, không throw để không dừng cả batch
    }
  }

  // Logic mới: Preserve ZoomUUID từ sessions cũ khi tạo sessions mới
  // Map ZoomUUID từ existingSessions sang sessions mới dựa trên Date và TimeslotID
  const zoomUUIDMap = new Map();
  existingSessions.forEach((oldSession) => {
    if (oldSession.ZoomUUID) {
      const key = `${oldSession.Date}-${oldSession.TimeslotID}`;
      zoomUUIDMap.set(key, oldSession.ZoomUUID);
    }
  });

  // 5. Chuẩn bị dữ liệu sessions mới để tạo
  const preparedSessions = sessions.map((s) => {
    // Logic mới: Tìm ZoomUUID từ sessions cũ dựa trên Date và TimeslotID
    const mapKey = `${s.Date}-${s.TimeslotID}`;
    const preservedZoomUUID = zoomUUIDMap.get(mapKey) || null;

    return {
      Title:
        s.Title ||
        `Session for class ${
          classData.Name || classData.ClassName || `Class ${ClassID}`
        }`,
      Description: s.Description || "",
      InstructorID: s.InstructorID || classData.InstructorID,
      ClassID: ClassID,
      TimeslotID: s.TimeslotID,
      Date: s.Date,
      ZoomUUID: preservedZoomUUID || s.ZoomUUID || null, // Logic mới: Preserve ZoomUUID từ session cũ hoặc từ payload
    };
  });

  // 6. Tạo lại sessions bằng createBulkSessions (sử dụng checkSessionConflictInfo bên trong)
  const result = await sessionService.createBulkSessions(preparedSessions);

  // Chuẩn hóa output cho FE
  return {
    success: result.success || [],
    conflicts: (result.conflicts || []).map((conflict) => ({
      type: conflict.conflictType || "instructor",
      info: conflict.conflictInfo || conflict,
    })),
    summary: result.summary || {
      total: preparedSessions.length,
      created: (result.success || []).length,
      conflicts: (result.conflicts || []).length,
    },
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
    throw new Error(`Lỗi khi kiểm tra xung đột học viên: ${error.message}`);
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
    throw new Error(
      "Thiếu tham số bắt buộc: InstructorID, OpendatePlan, Numofsession"
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

    // Phân tích từng ngày trong tuần và từng timeslot
    for (const dayOfWeek of DaysOfWeek) {
      const dayTimeslots = TimeslotsByDay[dayOfWeek] || [];
      if (dayTimeslots.length === 0) continue;

      const blockedTimeslotsForDay = [];

      // Kiểm tra từng timeslot trong ngày
      for (const timeslotId of dayTimeslots) {
        const slotKey = buildSlotKey(dayOfWeek, timeslotId);

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
    if (!entry || entry.TimeslotID === undefined || entry.TimeslotID === null) {
      return;
    }

    const dateObj = new Date(entry.Date || entry.date);
    if (Number.isNaN(dateObj.getTime())) {
      return;
    }

    const dateString = formatDate(dateObj);
    const dayOfWeek = dateObj.getDay();
    const key = buildSlotKey(dayOfWeek, entry.TimeslotID);

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

function buildSlotKey(dayOfWeek, timeslotId) {
  return `${dayOfWeek}_${normalizeTimeslotId(timeslotId)}`;
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
        if (
          availableSlots === totalSlots &&
          totalSlots >= minRequiredSlots &&
          totalSlots > 0
        ) {
          suggestions.push({
            date: dateString,
            availableSlots,
            totalSlots,
            reason: `Đủ ${availableSlots} ca/tuần (tất cả ca đều hợp lệ)`,
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

  if (depth > 50) {
    throw new Error("Không thể tìm đủ số buổi trong thời gian hợp lý");
  }

  if (
    !InstructorID ||
    dayOfWeek === undefined ||
    !timeslotId ||
    !startDate ||
    !endDatePlan ||
    !numofsession
  ) {
    throw new Error(
      "Thiếu tham số bắt buộc: InstructorID, dayOfWeek, timeslotId, startDate, endDatePlan, numofsession"
    );
  }

  const reasons = [];
  let isLocked = false;

  try {
    // ======================
    // 1️⃣ LẤY BLOCK & HOLIDAY
    // ======================
    const blocks = await instructorTimeslotRepository.findByDateRange(
      startDate,
      endDatePlan,
      InstructorID
    );

    const holidayMap = new Map();
    const invalidDates = new Map();

    blocks
      .filter((b) => b.TimeslotID === timeslotId)
      .forEach((b) => {
        console.log("b", b);
        const dateStr = b.Date;
        if (b.Status === "Holiday") {
          holidayMap.set(dateStr, true);
        } else if (b.Status !== "Available") {
          // ➤ BUỔI KHÔNG HỢP LỆ
          invalidDates.set(dateStr, b.Status);
        } else if (b.size() === 0) {
          invalidDates.set("SUNDAY", "Default");
        }
      });

    // Nếu có ngày invalid → dừng ngay, không duyệt tiếp
    if (invalidDates.size > 0) {
      return {
        isLocked: true,
        reasons: [
          {
            type: "invalid_timeslot",
            message: `Có ${invalidDates.size} buổi không hợp lệ`,
            invalidDates: [...invalidDates.entries()],
          },
        ],
        summary: {
          totalValidSessions: 0,
          holidaysSkipped: holidayMap.size,
          invalidCount: invalidDates.size,
        },
      };
    }

    // ======================
    // 2️⃣ CHECK SESSION CONFLICT
    // ======================
    const sessions = await sessionRepository.findByInstructorAndDateRange(
      InstructorID,
      startDate,
      endDatePlan
    );

    const conflictSessions = sessions.filter(
      (s) => s.TimeslotID === timeslotId
    );

    if (conflictSessions.length > 0) {
      // ➤ GẶP SESSION TRÙNG → LOCK NGAY
      return {
        isLocked: true,
        reasons: [
          {
            type: "session_conflict",
            message: `Ca này đã có ${conflictSessions.length} buổi học`,
            sessions: conflictSessions.slice(0, 5),
          },
        ],
        summary: {
          totalValidSessions: 0,
          holidaysSkipped: holidayMap.size,
          conflictCount: conflictSessions.length,
        },
      };
    }

    // ======================
    // 3️⃣ ĐẾM BUỔI HỢP LỆ
    // ======================
    let validCount = 0;
    let holidaysSkipped = 0;
    const start = new Date(startDate);
    const end = new Date(endDatePlan);

    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() === dayOfWeek) {
        const dateStr = current.toISOString().slice(0, 10);
        if (holidayMap.has(dateStr)) {
          holidaysSkipped++; // holiday bỏ qua
        } else {
          validCount++;
          if (validCount >= numofsession) {
            return {
              isLocked: false,
              reasons: [],
              summary: {
                totalValidSessions: validCount,
                holidaysSkipped,
                enoughSessions: true,
              },
            };
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }

    // ======================
    // 4️⃣ CHƯA ĐỦ BUỔI → MỞ RỘNG 1 TUẦN RỒI LÀM TIẾP
    // ======================
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
    throw new Error(`Lỗi khi lấy lý do chi tiết: ${error.message}`);
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
      throw new Error(
        `Lớp học có Status = DRAFT: Các ca học trong ngày phải giống nhau cho tất cả các ngày trong tuần. ` +
          `Thứ ${firstDay} có ca học [${[...firstDayTimeslots].join(", ")}] ` +
          `nhưng thứ ${day} có ca học [${[...dayTimeslots].join(", ")}]`
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
  checkLearnerConflicts,
  analyzeBlockedDays,
  searchTimeslots,
  getTimeslotLockReasons,
  validateSingleTimeslotPattern,
};
