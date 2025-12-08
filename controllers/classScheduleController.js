const classScheduleService = require("../services/classScheduleService");
const classCreationWizardService = require("../services/classCreationWizardService");
const instructorLeaveService = require("../services/instructorLeaveService");
const classService = require("../services/classService");

const classScheduleController = {
  // Tạo lịch hàng loạt
  createBulkSchedule: async (req, res) => {
    try {
      const {
        ClassID,
        OpendatePlan,
        Numofsession,
        InstructorID,
        SelectedTimeslotIDs,
      } = req.body;

      if (
        !ClassID ||
        !OpendatePlan ||
        !Numofsession ||
        !InstructorID ||
        !SelectedTimeslotIDs
      ) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số bắt buộc",
        });
      }

      const result = await classScheduleService.createBulkSchedule({
        ClassID,
        OpendatePlan,
        Numofsession,
        InstructorID,
        SelectedTimeslotIDs,
      });

      res.status(201).json({
        success: true,
        message: `Tạo thành công ${result.summary.success} buổi học`,
        data: result,
      });
    } catch (error) {
      console.error("Error creating bulk schedule:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo lịch hàng loạt",
        error: error.message,
      });
    }
  },

  // Đếm học viên
  countLearners: async (req, res) => {
    try {
      const { classId } = req.params;
      const count = await classScheduleService.countLearners(classId);

      res.json({
        success: true,
        data: {
          classId: parseInt(classId),
          learnerCount: count,
        },
      });
    } catch (error) {
      console.error("Error counting learners:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đếm học viên",
        error: error.message,
      });
    }
  },

  // Kiểm tra đầy lớp
  checkFullClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const result = await classScheduleService.checkFullClass(classId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error checking full class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra đầy lớp",
        error: error.message,
      });
    }
  },

  // Dời lịch (Reschedule)
  rescheduleSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { Date, TimeslotID } = req.body;

      if (!Date || !TimeslotID) {
        return res.status(400).json({
          success: false,
          message: "Date và TimeslotID là bắt buộc",
        });
      }

      const updated = await classScheduleService.rescheduleSession(sessionId, {
        Date,
        TimeslotID,
      });

      res.json({
        success: true,
        message: "Dời lịch thành công",
        data: updated,
      });
    } catch (error) {
      console.error("Error rescheduling session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi dời lịch",
        error: error.message,
      });
    }
  },

  // Hủy buổi học
  cancelSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const deleted = await classScheduleService.cancelSession(sessionId);

      res.json({
        success: true,
        message: "Hủy buổi học thành công",
        data: { deleted },
      });
    } catch (error) {
      console.error("Error canceling session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi hủy buổi học",
        error: error.message,
      });
    }
  },

  // Thêm buổi học bù
  addMakeupSession: async (req, res) => {
    try {
      const { classId } = req.params;
      const { Title, Description, Date, TimeslotID } = req.body;

      if (!Date || !TimeslotID) {
        return res.status(400).json({
          success: false,
          message: "Date và TimeslotID là bắt buộc",
        });
      }

      const session = await classScheduleService.addMakeupSession(classId, {
        Title,
        Description,
        Date,
        TimeslotID,
      });

      res.status(201).json({
        success: true,
        message: "Thêm buổi học bù thành công",
        data: session,
      });
    } catch (error) {
      console.error("Error adding makeup session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm buổi học bù",
        error: error.message,
      });
    }
  },

  // Tự động đóng đăng ký
  autoCloseEnrollment: async (req, res) => {
    try {
      const { classId } = req.params;
      const result = await classScheduleService.autoCloseEnrollment(classId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error auto closing enrollment:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tự động đóng đăng ký",
        error: error.message,
      });
    }
  },

  // Tự động đóng lớp (chạy hàng đêm)
  autoCloseClasses: async (req, res) => {
    try {
      const closedClasses = await classScheduleService.autoCloseClasses();

      res.json({
        success: true,
        message: `Đã đóng ${closedClasses.length} lớp học`,
        data: {
          closedCount: closedClasses.length,
          closedClasses: closedClasses,
        },
      });
    } catch (error) {
      console.error("Error auto closing classes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tự động đóng lớp",
        error: error.message,
      });
    }
  },

  // =====================================================
  // CLASS CREATION WIZARD
  // =====================================================

  // Tạo lớp với Wizard (3 lần kiểm tra)
  createClassWizard: async (req, res) => {
    try {
      const {
        ClassID,
        OpendatePlan,
        Numofsession,
        InstructorID,
        SelectedTimeslotIDs,
      } = req.body;

      if (
        !ClassID ||
        !OpendatePlan ||
        !Numofsession ||
        !InstructorID ||
        !SelectedTimeslotIDs
      ) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số bắt buộc",
        });
      }

      const result = await classCreationWizardService.createClassWizard({
        ClassID,
        OpendatePlan,
        Numofsession,
        InstructorID,
        SelectedTimeslotIDs,
      });

      res.status(201).json({
        success: true,
        message: `Tạo thành công ${result.summary.success} buổi học`,
        data: result,
      });
    } catch (error) {
      console.error("Error creating class wizard:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo lớp với wizard",
        error: error.message,
      });
    }
  },

  // Dời buổi học đầu
  delayClassStart: async (req, res) => {
    try {
      const { classId } = req.params;
      const result = await classCreationWizardService.delayClassStart(classId);

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error delaying class start:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi dời buổi học đầu",
        error: error.message,
      });
    }
  },

  // Cập nhật lại schedule của lớp khi admin chỉnh sửa (Edit Class Wizard)
  // Body: { sessions: [...], startDate?, endDate? }
  updateClassSchedule: async (req, res) => {
    try {
      const { classId } = req.params;
      const payload = req.body || {};

      const ClassID = Number(classId || payload.ClassID);
      if (!ClassID) {
        return res.status(400).json({
          success: false,
          message: "ClassID là bắt buộc",
        });
      }

      const sessions = payload.sessions || [];
      const { startDate, endDate, scheduleDetail } = payload;

      const result = await classCreationWizardService.updateClassSchedule({
        ClassID,
        sessions,
        startDate,
        endDate,
        scheduleDetail, // Logic mới: Truyền scheduleDetail để validate single timeslot pattern
      });

      return res.json({
        success: true,
        message: "Cập nhật lịch học chi tiết thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error updating class schedule:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật lịch học chi tiết",
        error: error.message,
      });
    }
  },

  // Phân tích độ bận định kỳ của instructor
  analyzeBlockedDays: async (req, res) => {
    try {
      const startTime = Date.now();
      const {
        InstructorID,
        OpendatePlan,
        Numofsession,
        DaysOfWeek,
        TimeslotsByDay,
      } = req.body;

      console.log("[analyzeBlockedDays] START", {
        InstructorID,
        OpendatePlan,
        Numofsession,
        daysOfWeekCount: Array.isArray(DaysOfWeek) ? DaysOfWeek.length : 0,
        hasTimeslotsByDay: !!TimeslotsByDay,
      });

      if (!InstructorID || !OpendatePlan || !Numofsession) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu tham số bắt buộc: InstructorID, OpendatePlan, Numofsession",
        });
      }

      const result = await classCreationWizardService.analyzeBlockedDays({
        InstructorID: parseInt(InstructorID),
        OpendatePlan,
        Numofsession: parseInt(Numofsession),
        DaysOfWeek: DaysOfWeek || [],
        TimeslotsByDay: TimeslotsByDay || {},
      });

      const durationMs = Date.now() - startTime;
      const blockedDaysKeys = Object.keys(result?.blockedDays || {});
      console.log("[analyzeBlockedDays] DONE", {
        InstructorID,
        OpendatePlan,
        Numofsession,
        daysOfWeek: DaysOfWeek,
        blockedDaysCount: blockedDaysKeys.length,
        totalManualConflicts: result?.summary?.totalManualConflicts ?? 0,
        totalSessionConflicts: result?.summary?.totalSessionConflicts ?? 0,
        durationMs,
      });

      res.json({
        success: true,
        message: "Phân tích độ bận định kỳ thành công",
        data: result,
      });
    } catch (error) {
      console.error("[analyzeBlockedDays] ERROR", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        success: false,
        message: "Lỗi khi phân tích độ bận định kỳ",
        error: error.message,
      });
    }
  },

  // Tìm các ca rảnh của GV (Bước 1 - Chỉ kiểm tra GV)
  findAvailableInstructorSlots: async (req, res) => {
    try {
      console.log(
        `[findAvailableInstructorSlots] Request URL: ${req.originalUrl}`
      );
      console.log(`[findAvailableInstructorSlots] Query params:`, req.query);
      const {
        InstructorID,
        TimeslotID,
        Day,
        numSuggestions,
        startDate,
        excludeClassId,
      } = req.query;

      if (!InstructorID || !TimeslotID || !Day) {
        console.log(
          `[findAvailableInstructorSlots] Thiếu tham số: InstructorID=${InstructorID}, TimeslotID=${TimeslotID}, Day=${Day}`
        );
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số bắt buộc",
        });
      }

      console.log(`[findAvailableInstructorSlots] Gọi service với:`, {
        InstructorID: parseInt(InstructorID),
        TimeslotID: parseInt(TimeslotID),
        Day: Day,
        numSuggestions: numSuggestions ? parseInt(numSuggestions) : 5,
        startDate,
        excludeClassId: excludeClassId ? parseInt(excludeClassId) : null,
      });

      const suggestions =
        await classCreationWizardService.findAvailableInstructorSlots({
          InstructorID: parseInt(InstructorID),
          TimeslotID: parseInt(TimeslotID),
          Day: Day,
          numSuggestions: numSuggestions ? parseInt(numSuggestions) : 5,
          startDate,
          excludeClassId: excludeClassId ? parseInt(excludeClassId) : null,
        });

      console.log(
        `[findAvailableInstructorSlots] Service trả về ${suggestions.length} suggestions`
      );

      const response = {
        success: true,
        message: `Tìm thấy ${suggestions.length} gợi ý`,
        data: {
          suggestions: suggestions,
          availableCount: suggestions.filter((s) => s.available).length,
          busyCount: suggestions.filter((s) => !s.available).length,
        },
      };

      console.log(
        `[findAvailableInstructorSlots] Response:`,
        JSON.stringify(response, null, 2)
      );
      res.json(response);
    } catch (error) {
      console.error("Error finding available instructor slots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tìm ca rảnh của giảng viên",
        error: error.message,
      });
    }
  },

  // Kiểm tra xung đột với học viên (Bước 2 - Chỉ khi admin chọn ca)
  checkLearnerConflicts: async (req, res) => {
    try {
      const { ClassID, Date, TimeslotID } = req.body;

      if (!ClassID || !Date || !TimeslotID) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số bắt buộc",
        });
      }

      const result = await classCreationWizardService.checkLearnerConflicts({
        ClassID: parseInt(ClassID),
        Date,
        TimeslotID: parseInt(TimeslotID),
      });

      res.json({
        success: true,
        data: result,
        message: result.isValid
          ? `Hợp lệ! ${result.summary.availableLearners}/${result.summary.totalLearners} học viên có thể tham gia.`
          : `Xung đột! Có ${result.summary.conflictedLearners}/${result.summary.totalLearners} học viên bị trùng lịch.`,
      });
    } catch (error) {
      console.error("Error checking learner conflicts:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra xung đột học viên",
        error: error.message,
      });
    }
  },

  // =====================================================
  // INSTRUCTOR LEAVE MANAGEMENT
  // =====================================================

  listInstructorLeaves: async (req, res) => {
    try {
      console.log("[listInstructorLeaves] Query params:", req.query);
      const result = await instructorLeaveService.listInstructorLeaves(
        req.query
      );
      console.log(
        "[listInstructorLeaves] Result:",
        result?.items?.length || 0,
        "items"
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error listing instructor leaves:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lịch nghỉ",
        error: error.message,
      });
    }
  },

  // Thêm lịch nghỉ hàng loạt
  addBulkInstructorLeave: async (req, res) => {
    try {
      const { InstructorID, Date, Status, Note, blockEntireDay, TimeslotID } =
        req.body;

      if (!InstructorID || !Date || !Status) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số bắt buộc",
        });
      }

      const result = await instructorLeaveService.addBulkInstructorLeave({
        InstructorID: parseInt(InstructorID),
        Date,
        Status,
        Note,
        blockEntireDay: blockEntireDay === true,
        TimeslotID: TimeslotID ? parseInt(TimeslotID) : null,
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error adding bulk instructor leave:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm lịch nghỉ hàng loạt",
        error: error.message,
      });
    }
  },

  deleteInstructorLeave: async (req, res) => {
    try {
      const { leaveId } = req.params;
      if (!leaveId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số leaveId",
        });
      }

      await instructorLeaveService.deleteInstructorLeave(leaveId);
      res.json({
        success: true,
        message: "Đã xóa lịch nghỉ",
      });
    } catch (error) {
      console.error("Error deleting instructor leave:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa lịch nghỉ",
        error: error.message,
      });
    }
  },

  // Xóa tất cả lịch nghỉ của một ngày
  deleteLeavesByDate: async (req, res) => {
    try {
      const { date } = req.params;
      const { status } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số date",
        });
      }

      const result = await instructorLeaveService.deleteLeavesByDate(
        date,
        status || "HOLIDAY"
      );
      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error deleting leaves by date:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa lịch nghỉ",
        error: error.message,
      });
    }
  },

  // Kiểm tra cảnh báo xung đột tương lai
  checkFutureConflicts: async (req, res) => {
    try {
      const { InstructorID, Date, TimeslotID, Status } = req.body;

      if (!InstructorID || !Date || !TimeslotID) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số bắt buộc",
        });
      }

      const result = await instructorLeaveService.checkFutureConflicts({
        InstructorID: parseInt(InstructorID),
        Date,
        TimeslotID: parseInt(TimeslotID),
        Status,
      });

      res.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      console.error("Error checking future conflicts:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi kiểm tra cảnh báo xung đột",
        error: error.message,
      });
    }
  },

  // Xử lý lớp bị ảnh hưởng
  handleAffectedClass: async (req, res) => {
    try {
      const { ClassID, action, sessionIds, newSchedule } = req.body;

      if (!ClassID || !action || !sessionIds || !Array.isArray(sessionIds)) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số bắt buộc",
        });
      }

      const result = await instructorLeaveService.handleAffectedClass({
        ClassID: parseInt(ClassID),
        action,
        sessionIds: sessionIds.map((id) => parseInt(id)),
        newSchedule,
      });

      res.json({
        success: true,
        message: `Đã xử lý ${result.summary.success}/${result.summary.total} session`,
        data: result,
      });
    } catch (error) {
      console.error("Error handling affected class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xử lý lớp bị ảnh hưởng",
        error: error.message,
      });
    }
  },

  // Tìm ngày bắt đầu phù hợp theo desired timeslots (API chuyên dụng - tối ưu)
  searchTimeslots: async (req, res) => {
    try {
      const startTime = Date.now();
      const {
        InstructorID,
        DaysOfWeek,
        TimeslotsByDay,
        Numofsession,
        sessionsPerWeek,
        requiredSlotsPerWeek,
        currentStartDate,
      } = req.body;

      console.log("[searchTimeslots] START", {
        InstructorID,
        Numofsession,
        sessionsPerWeek,
        requiredSlotsPerWeek,
        currentStartDate,
        daysOfWeek: DaysOfWeek,
        hasTimeslotsByDay: !!TimeslotsByDay,
      });

      if (!InstructorID || !DaysOfWeek || !TimeslotsByDay || !Numofsession) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu tham số bắt buộc: InstructorID, DaysOfWeek, TimeslotsByDay, Numofsession",
        });
      }

      // Gọi service để tìm ngày phù hợp
      const suggestions = await classCreationWizardService.searchTimeslots({
        InstructorID: parseInt(InstructorID),
        DaysOfWeek: DaysOfWeek || [],
        TimeslotsByDay: TimeslotsByDay || {},
        Numofsession: parseInt(Numofsession),
        sessionsPerWeek: sessionsPerWeek ? parseInt(sessionsPerWeek) : 0,
        requiredSlotsPerWeek: requiredSlotsPerWeek
          ? parseInt(requiredSlotsPerWeek)
          : sessionsPerWeek
          ? parseInt(sessionsPerWeek)
          : 0,
        currentStartDate: currentStartDate || null,
      });

      const durationMs = Date.now() - startTime;
      console.log("[searchTimeslots] DONE", {
        InstructorID,
        Numofsession,
        sessionsPerWeek,
        requiredSlotsPerWeek,
        currentStartDate,
        suggestionCount: suggestions?.length || 0,
        suggestions,
        durationMs,
      });

      res.json({
        success: true,
        message: "Tìm kiếm ngày phù hợp thành công",
        data: {
          suggestions: suggestions || [],
        },
      });
    } catch (error) {
      console.error("Error searching timeslots:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tìm kiếm ngày phù hợp",
        error: error.message,
      });
    }
  },

  // Lấy lý do chi tiết tại sao một timeslot bị khóa
  getTimeslotLockReasons: async (req, res) => {
    try {
      // Nhận từ body (POST) hoặc query (GET)
      const {
        InstructorID,
        dayOfWeek,
        timeslotId,
        startDate,
        endDatePlan,
        numofsession,
      } = req.body || req.query;

      if (
        !InstructorID ||
        dayOfWeek === undefined ||
        !timeslotId ||
        !startDate ||
        !endDatePlan ||
        !numofsession
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Thiếu tham số bắt buộc: InstructorID, dayOfWeek, timeslotId, startDate, endDatePlan, numofsession",
        });
      }

      // Gọi service để lấy lý do chi tiết
      const reasons = await classCreationWizardService.getTimeslotLockReasons({
        InstructorID: parseInt(InstructorID),
        dayOfWeek: parseInt(dayOfWeek),
        timeslotId: parseInt(timeslotId),
        startDate,
        endDatePlan,
        numofsession: parseInt(numofsession),
      });

      res.json({
        success: true,
        message: "Lấy lý do chi tiết thành công",
        data: reasons,
      });
    } catch (error) {
      console.error("Error getting timeslot lock reasons:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lý do chi tiết",
        error: error.message,
      });
    }
  },

  // Thêm lịch nghỉ HOLIDAY cho tất cả giảng viên
  addHolidayForAllInstructors: async (req, res) => {
    try {
      const result = await instructorLeaveService.addHolidayForAllInstructors(
        req.body
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error adding holiday for all instructors:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm lịch nghỉ cho tất cả giảng viên",
        error: error.message,
      });
    }
  },

  // Đồng bộ lịch nghỉ HOLIDAY cho giảng viên
  syncHolidayForInstructor: async (req, res) => {
    try {
      const { instructorId } = req.params;
      if (!instructorId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số instructorId",
        });
      }

      const result = await instructorLeaveService.syncHolidayForInstructor(
        parseInt(instructorId)
      );

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error syncing holiday for instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đồng bộ lịch nghỉ",
        error: error.message,
      });
    }
  },

  // Lấy danh sách unique DATE có Status = HOLIDAY
  getHolidayDates: async (req, res) => {
    try {
      const dates = await instructorLeaveService.getHolidayDates();

      res.json({
        success: true,
        message: "Lấy danh sách ngày nghỉ HOLIDAY thành công",
        data: dates,
      });
    } catch (error) {
      console.error("Error getting holiday dates:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách ngày nghỉ",
        error: error.message,
      });
    }
  },
};

module.exports = classScheduleController;
