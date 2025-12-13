const instructorTimeslotRepository = require("../repositories/InstructorTimeslotRepository");
const instructorRepository = require("../repositories/instructorRepository");
const sessionRepository = require("../repositories/sessionRepository");
const notificationRepository = require("../repositories/notificationRepository");
const logService = require("./logService");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * InstructorAvailabilityService
 *
 * Xử lý lịch bận để dạy của giảng viên:
 * - AVAILABLE: Giảng viên chọn để dạy (parttime tự thêm lịch dạy)
 * - OTHER: Lịch dạy đã được book và chuyển vào session
 * - HOLIDAY: Ngày nghỉ lễ
 *
 * Logic:
 * - Fulltime: Mặc định T2-T7 full ca, có thể thêm CN
 * - Parttime: Chọn tay từng ca trong tuần
 */
class InstructorAvailabilityService {
  /**
   * Lấy lịch bận để dạy của giảng viên trong khoảng ngày
   */
  async getAvailability(instructorId, startDate, endDate) {
    try {
      // Kiểm tra instructor tồn tại
      const instructor = await instructorRepository.findById(instructorId);
      if (!instructor) {
        throw new ServiceError("Giảng viên không tồn tại", 404);
      }

      // Lấy lịch bận để dạy (AVAILABLE, OTHER, HOLIDAY)
      const availabilitySlots =
        await instructorTimeslotRepository.findByDateRange(
          startDate,
          endDate,
          instructorId
        );

      // Lấy lịch dạy đã được book (sessions)
      const sessions = await sessionRepository.findByInstructorAndDateRange(
        instructorId,
        startDate,
        endDate
      );

      // Format dữ liệu để frontend dễ sử dụng
      const formattedSlots = availabilitySlots.map((slot) => ({
        date: slot.Date,
        timeslotId: slot.TimeslotID,
        status: slot.Status,
        note: slot.Note,
        day: slot.Day,
        startTime: slot.StartTime,
        endTime: slot.EndTime,
      }));

      const formattedSessions = sessions.map((session) => ({
        date: session.Date,
        timeslotId: session.TimeslotID,
        classId: session.ClassID,
        className: session.ClassName || null,
      }));

      return {
        instructor: {
          id: instructor.InstructorID,
          name: instructor.FullName,
          type: instructor.Type || "fulltime",
        },
        availabilitySlots: formattedSlots,
        existingSessions: formattedSessions,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lưu lịch bận để dạy của giảng viên
   *
   * @param {number} instructorId - ID giảng viên
   * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
   * @param {Array} slots - Mảng các slot: [{date, timeslotId, status?}]
   * @param {string} instructorType - 'fulltime' hoặc 'parttime'
   */
  async saveAvailability(
    instructorId,
    startDate,
    endDate,
    slots,
    instructorType = "parttime"
  ) {
    try {
      // Kiểm tra instructor tồn tại
      const instructor = await instructorRepository.findById(instructorId);
      if (!instructor) {
        throw new ServiceError("Giảng viên không tồn tại", 404);
      }

      const type = instructorType || instructor.Type || "parttime";

      // Xóa các slot cũ trong khoảng ngày (trừ HOLIDAY và OTHER)
      await instructorTimeslotRepository.deleteByDateRange(
        instructorId,
        startDate,
        endDate,
        ["HOLIDAY", "OTHER"]
      );

      // Nếu là fulltime, tự động tạo lịch T2-T7 cho tất cả các ca
      if (type === "fulltime") {
        const fulltimeSlots = this.generateFulltimeSlots(
          startDate,
          endDate,
          slots // slots có thể chứa CN hoặc HOLIDAY
        );
        slots = fulltimeSlots;
      }

      // Validate và format slots
      const slotsToInsert = slots
        .filter((slot) => slot.date && slot.timeslotId)
        .map((slot) => ({
          InstructorID: instructorId,
          TimeslotID: slot.timeslotId,
          Date: slot.date,
          Status: slot.status || "AVAILABLE",
          Note: slot.note || null,
        }));

      if (slotsToInsert.length > 0) {
        // Insert từng slot để tránh conflict
        for (const slot of slotsToInsert) {
          // Kiểm tra xem đã tồn tại chưa (có thể là HOLIDAY hoặc OTHER)
          const existing = await instructorTimeslotRepository.checkConflict(
            slot.InstructorID,
            slot.TimeslotID,
            slot.Date
          );

          if (existing) {
            // Chỉ update nếu status không phải OTHER (đã được book và chuyển vào session)
            if (existing.Status !== "OTHER") {
              await instructorTimeslotRepository.update(
                existing.InstructortimeslotID,
                {
                  Status: slot.Status,
                  Note: slot.Note,
                }
              );
            }
          } else {
            await instructorTimeslotRepository.create(slot);
          }
        }
      }

      // Log thay đổi
      if (instructor.AccID) {
        await logService.logAction({
          action: "UPDATE_INSTRUCTOR_AVAILABILITY",
          accId: instructor.AccID,
          detail: JSON.stringify({
            instructorId,
            startDate,
            endDate,
            slotsCount: slotsToInsert.length,
            type,
          }),
        });
      }

      return {
        success: true,
        message: "Lưu lịch bận để dạy thành công",
        slotsCount: slotsToInsert.length,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo lịch mặc định cho fulltime instructor (T2-T7, tất cả các ca)
   */
  generateFulltimeSlots(startDate, endDate, additionalSlots = []) {
    const slots = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allTimeslots = [1, 2, 3, 4]; // 4 ca học

    // Tạo map cho các slot bổ sung (CN, HOLIDAY)
    const additionalMap = new Map();
    additionalSlots.forEach((slot) => {
      const key = `${slot.date}-${slot.timeslotId}`;
      additionalMap.set(key, slot);
    });

    // Duyệt từng ngày
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
      const dateStr = d.toISOString().split("T")[0];

      // T2-T7 (dayOfWeek: 1-6)
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        allTimeslots.forEach((timeslotId) => {
          const key = `${dateStr}-${timeslotId}`;
          // Nếu có slot bổ sung (ví dụ HOLIDAY), dùng slot đó
          if (additionalMap.has(key)) {
            slots.push(additionalMap.get(key));
          } else {
            slots.push({
              date: dateStr,
              timeslotId,
              status: "AVAILABLE",
            });
          }
        });
      } else if (dayOfWeek === 0) {
        // Chủ nhật - chỉ thêm nếu có trong additionalSlots
        allTimeslots.forEach((timeslotId) => {
          const key = `${dateStr}-${timeslotId}`;
          if (additionalMap.has(key)) {
            slots.push(additionalMap.get(key));
          }
        });
      }
    }

    return slots;
  }

  /**
   * Khi session được book, chuyển status từ AVAILABLE sang OTHER
   */
  async markSlotAsBooked(instructorId, timeslotId, date) {
    try {
      const existing = await instructorTimeslotRepository.checkConflict(
        instructorId,
        timeslotId,
        date
      );

      if (existing && existing.Status === "AVAILABLE") {
        await instructorTimeslotRepository.update(
          existing.InstructortimeslotID,
          {
            Status: "OTHER",
          }
        );

        // Log
        const instructor = await instructorRepository.findById(instructorId);
        if (instructor && instructor.AccID) {
          await logService.logAction({
            action: "BOOK_INSTRUCTOR_SLOT",
            accId: instructor.AccID,
            detail: JSON.stringify({
              instructorId,
              timeslotId,
              date,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Error marking slot as booked:", error);
      // Không throw để không ảnh hưởng đến flow chính
    }
  }

  /**
   * Khi hủy/đổi lịch session, nếu slot đang ở trạng thái OTHER thì trả về AVAILABLE
   * Dùng khi xóa session để giải phóng ca đã book cho giảng viên
   */
  async markSlotAsAvailable(instructorId, timeslotId, date) {
    try {
      const existing = await instructorTimeslotRepository.checkConflict(
        instructorId,
        timeslotId,
        date
      );

      if (existing && existing.Status === "OTHER") {
        await instructorTimeslotRepository.update(
          existing.InstructortimeslotID,
          {
            Status: "AVAILABLE",
          }
        );

        // Log
        const instructor = await instructorRepository.findById(instructorId);
        if (instructor && instructor.AccID) {
          await logService.logAction({
            action: "RELEASE_INSTRUCTOR_SLOT",
            accId: instructor.AccID,
            detail: JSON.stringify({
              instructorId,
              timeslotId,
              date,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Error marking slot as available:", error);
      // Không throw để không ảnh hưởng đến flow chính
    }
  }

  /**
   * Khi đổi lịch, gửi notification và log
   */
  async handleScheduleChange(instructorId, changes, affectedStudents = []) {
    try {
      // Lấy thông tin instructor để có AccID
      const instructor = await instructorRepository.findById(instructorId);
      if (!instructor) {
        throw new ServiceError("Giảng viên không tồn tại", 404);
      }

      // Gửi notification cho giảng viên
      if (instructor.AccID) {
        await notificationRepository.create({
          Content: `Lịch dạy của bạn đã được thay đổi: ${
            changes.description || "Có thay đổi trong lịch dạy"
          }`,
          Type: "SCHEDULE_CHANGE",
          Status: "unread",
          AccID: instructor.AccID,
        });
      }

      // Gửi notification cho học viên bị ảnh hưởng
      // TODO: Cần lấy AccID từ studentId (có thể cần thêm repository hoặc service)
      // for (const studentId of affectedStudents) {
      //   await notificationRepository.create({
      //     Content: `Lịch học của bạn đã được thay đổi: ${changes.description || "Có thay đổi trong lịch học"}`,
      //     Type: "SCHEDULE_CHANGE",
      //     Status: "unread",
      //     AccID: studentAccID,
      //   });
      // }

      // Log
      if (instructor.AccID) {
        await logService.logAction({
          action: "SCHEDULE_CHANGE",
          accId: instructor.AccID,
          detail: JSON.stringify({
            instructorId,
            changes,
            affectedStudents,
          }),
        });
      }
    } catch (error) {
      console.error("Error handling schedule change:", error);
    }
  }
}

module.exports = new InstructorAvailabilityService();
