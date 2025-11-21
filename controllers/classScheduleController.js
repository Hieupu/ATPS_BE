const classScheduleService = require("../services/classScheduleService");
const classCreationWizardService = require("../services/classCreationWizardService");
const instructorLeaveService = require("../services/instructorLeaveService");
const classService = require("../services/classService");

const classScheduleController = {
  // Tạo lịch hàng loạt
  createBulkSchedule: async (req, res) => {
    try {
      const { ClassID, OpendatePlan, Numofsession, InstructorID, SelectedTimeslotIDs } =
        req.body;

      if (!ClassID || !OpendatePlan || !Numofsession || !InstructorID || !SelectedTimeslotIDs) {
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

  // Tìm các ca rảnh của GV (Bước 1 - Chỉ kiểm tra GV)
  findAvailableInstructorSlots: async (req, res) => {
    try {
      console.log(`[findAvailableInstructorSlots] Request URL: ${req.originalUrl}`);
      console.log(`[findAvailableInstructorSlots] Query params:`, req.query);
      const { InstructorID, TimeslotID, Day, numSuggestions, startDate, excludeClassId } = req.query;

      if (!InstructorID || !TimeslotID || !Day) {
        console.log(`[findAvailableInstructorSlots] Thiếu tham số: InstructorID=${InstructorID}, TimeslotID=${TimeslotID}, Day=${Day}`);
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

      console.log(`[findAvailableInstructorSlots] Service trả về ${suggestions.length} suggestions`);

      const response = {
        success: true,
        message: `Tìm thấy ${suggestions.length} gợi ý`,
        data: {
          suggestions: suggestions,
          availableCount: suggestions.filter((s) => s.available).length,
          busyCount: suggestions.filter((s) => !s.available).length,
        },
      };

      console.log(`[findAvailableInstructorSlots] Response:`, JSON.stringify(response, null, 2));
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
};

module.exports = classScheduleController;

