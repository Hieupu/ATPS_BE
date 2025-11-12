const scheduleRepository = require("../repositories/scheduleRepository");

class ScheduleService {
  async getLearnerSchedule(learnerId) {
    try {
      const schedules = await scheduleRepository.getLearnerSchedule(learnerId);

      const formattedSchedules = schedules.map((schedule) => {
        // Parse và clean Description field
        // Loại bỏ các tag reschedule để chỉ giữ lại thông tin chính
        let cleanedDescription = schedule.Description || "";
        let rescheduleInfo = null;

        // Nếu có reschedule info, extract nó và tách khỏi description chính
        if (cleanedDescription.includes("[PENDING_RESCHEDULE]")) {
          // Tìm tất cả các reschedule blocks (có thể có nhiều lần reschedule)
          const pendingBlocks = cleanedDescription.match(
            /\[PENDING_RESCHEDULE\]([^\[]*?)(?=\[PENDING_RESCHEDULE\]|$)/g
          );

          // Lấy reschedule block mới nhất (cuối cùng) nếu có nhiều blocks
          let latestPendingBlock = "";
          if (pendingBlocks && pendingBlocks.length > 0) {
            latestPendingBlock = pendingBlocks[pendingBlocks.length - 1];
          } else {
            // Nếu không match được blocks, lấy từ cuối description
            const lastPendingIndex = cleanedDescription.lastIndexOf(
              "[PENDING_RESCHEDULE]"
            );
            if (lastPendingIndex !== -1) {
              latestPendingBlock =
                cleanedDescription.substring(lastPendingIndex);
            }
          }

          // Extract thông tin từ block mới nhất
          if (latestPendingBlock) {
            const oldScheduleMatch = latestPendingBlock.match(
              /\[Lịch cũ: ([^\]]+)\]/
            );
            const newScheduleMatch = latestPendingBlock.match(
              /\[Đề xuất lịch mới: ([^\]]+)\]/
            );

            // Format schedule helper function
            const formatSchedule = (scheduleStr) => {
              if (!scheduleStr || scheduleStr === "Chưa có lịch học trước đó") {
                return scheduleStr || "Chưa có thông tin";
              }

              // Thử parse format: "2025-11-03 09:00:00-11:00:00" hoặc "2025-11-03 09:00-11:00"
              const dateTimeMatch = scheduleStr.match(
                /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}):?\d{0,2}-(\d{2}:\d{2}):?\d{0,2}$/
              );
              if (dateTimeMatch) {
                const [, date, startTime, endTime] = dateTimeMatch;
                const formattedDate = new Date(date).toLocaleDateString(
                  "vi-VN"
                );
                return `${formattedDate} ${startTime}-${endTime}`;
              }

              // Thử parse format Date object đã stringify (ví dụ: "Mon Nov 03 2025... 09:00:00-11:00:00")
              const dateObjMatch = scheduleStr.match(
                /^(.+?)\s+(\d{2}:\d{2}):\d{2}-(\d{2}:\d{2}):\d{2}/
              );
              if (dateObjMatch) {
                try {
                  const datePart = dateObjMatch[1];
                  const parsedDate = new Date(datePart);
                  if (!isNaN(parsedDate.getTime())) {
                    const formattedDate =
                      parsedDate.toLocaleDateString("vi-VN");
                    const startTime = dateObjMatch[2];
                    const endTime = dateObjMatch[3];
                    return `${formattedDate} ${startTime}-${endTime}`;
                  }
                } catch (e) {
                  // Ignore parse error
                }
              }

              // Nếu không match được format nào, thử parse toàn bộ chuỗi như Date
              try {
                const parsedDate = new Date(scheduleStr);
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate.toLocaleDateString("vi-VN");
                }
              } catch (e) {
                // Ignore parse error
              }

              // Trả về nguyên bản nếu không parse được
              return scheduleStr;
            };

            if (oldScheduleMatch || newScheduleMatch) {
              rescheduleInfo = {
                oldSchedule: oldScheduleMatch
                  ? formatSchedule(oldScheduleMatch[1].trim())
                  : null,
                newSchedule: newScheduleMatch
                  ? formatSchedule(newScheduleMatch[1].trim())
                  : null,
              };
            }
          }

          // Loại bỏ TẤT CẢ reschedule tags khỏi description (clean toàn bộ)
          // Thực hiện nhiều lần để đảm bảo clean hết
          let previousDescription = "";
          let iterationCount = 0;
          const maxIterations = 10;

          while (
            cleanedDescription !== previousDescription &&
            iterationCount < maxIterations
          ) {
            previousDescription = cleanedDescription;
            cleanedDescription = cleanedDescription
              .replace(/\[PENDING_RESCHEDULE\].*?(?=\[|$)/g, "") // Loại bỏ từ [PENDING_RESCHEDULE] đến tag tiếp theo hoặc cuối string
              .replace(/\[PENDING_RESCHEDULE\][^\[]*/g, "") // Fallback: loại bỏ từ [PENDING_RESCHEDULE] đến [ tiếp theo
              .replace(/\[Lịch cũ:[^\]]+\]/g, "")
              .replace(/\[Đề xuất lịch mới:[^\]]+\]/g, "")
              .replace(/\[ORIGINAL_BOOKING:[^\]]+\]/g, "")
              .replace(/Lý do:\s*[^\[]*(?=\[|$)/g, "") // Loại bỏ "Lý do: ..." đến tag tiếp theo hoặc cuối string
              .replace(/\s+/g, " ") // Normalize whitespace
              .trim();
            iterationCount++;
          }
        } else {
          // Nếu không có reschedule, chỉ loại bỏ original booking tag
          cleanedDescription = cleanedDescription
            .replace(/\[ORIGINAL_BOOKING:[^\]]+\]/g, "")
            .trim();
        }

        // Loại bỏ các pattern còn sót lại
        cleanedDescription = cleanedDescription
          .replace(/\[PENDING_RESCHEDULE\].*?$/g, "")
          .replace(/\[Lịch cũ:.*?\]/g, "")
          .replace(/\[Đề xuất lịch mới:.*?\]/g, "")
          .replace(/\[ORIGINAL_BOOKING:.*?\]/g, "")
          .replace(/Lý do:.*?$/g, "")
          .replace(/\s+/g, " ")
          .trim();

        // Nếu description sau khi clean rỗng hoặc chỉ còn whitespace hoặc chỉ còn dấu ngoặc, set null
        if (
          !cleanedDescription ||
          cleanedDescription.length === 0 ||
          cleanedDescription.match(/^[\s\[\]]*$/)
        ) {
          cleanedDescription = null;
        }

        // Debug log để kiểm tra
        if (
          schedule.Description &&
          schedule.Description.includes("[PENDING_RESCHEDULE]")
        ) {
          // Clean description for reschedule info
        }

        return {
          ...schedule,
          Description: cleanedDescription, // Description đã được clean
          rescheduleInfo: rescheduleInfo, // Thông tin reschedule riêng (nếu có)
          formattedDate: schedule.Date
            ? new Date(schedule.Date).toLocaleDateString("vi-VN")
            : null,
          timeRange: `${schedule.StartTime} - ${schedule.EndTime}`,
          hasZoom: !!schedule.ZoomURL,
        };
      });

      return formattedSchedules;
    } catch (error) {
      console.error("Error in getLearnerSchedule service:", error);
      throw error;
    }
  }

  async getInstructorSchedule(instructorId) {
    try {
      const schedules = await scheduleRepository.getInstructorSchedule(
        instructorId
      );

      const formattedSchedules = schedules.map((schedule) => ({
        ...schedule,
        formattedDate: schedule.Date
          ? new Date(schedule.Date).toLocaleDateString("vi-VN")
          : null,
        timeRange: `${schedule.StartTime} - ${schedule.EndTime}`,
        hasZoom: !!schedule.ZoomURL,
      }));

      return formattedSchedules;
    } catch (error) {
      console.error("Error in getInstructorSchedule service:", error);
      throw error;
    }
  }

  async getSessionDetails(sessionId) {
    try {
      const session = await scheduleRepository.getSessionDetails(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      // Format timeslot
      if (session.Timeslot) {
        session.Timeslot = {
          ...session.Timeslot,
          formattedDate: new Date(session.Timeslot.Date).toLocaleDateString(
            "vi-VN"
          ),
          timeRange: `${session.Timeslot.StartTime} - ${session.Timeslot.EndTime}`,
        };
      }

      return session;
    } catch (error) {
      console.error("Error in getSessionDetails service:", error);
      throw error;
    }
  }

  async getClassesByInstructor(instructorId) {
    try {
      const classes = await scheduleRepository.getClassesByInstructor(
        instructorId
      );
      return classes;
    } catch (error) {
      console.error("Error in getClassesByInstructor service:", error);
      throw error;
    }
  }

  async getClassSchedule(classId) {
    try {
      const schedules = await scheduleRepository.getClassSchedule(classId);
      return schedules.map((s) => ({
        ...s,
        formattedDate: s.Date
          ? new Date(s.Date).toLocaleDateString("vi-VN")
          : null,
        timeRange: `${s.StartTime || ""} - ${s.EndTime || ""}`.trim(),
      }));
    } catch (error) {
      console.error("Error in getClassSchedule service:", error);
      throw error;
    }
  }

  async createSession(sessionData) {
    try {
      if (
        !sessionData.Title ||
        !sessionData.InstructorID ||
        !sessionData.ClassID
      ) {
        throw new Error("Thiếu thông tin bắt buộc");
      }

      const session = await scheduleRepository.createSession(sessionData);

      return session;
    } catch (error) {
      console.error("Error in createSession service:", error);
      throw error;
    }
  }

  async getAvailableInstructorSlots(instructorId) {
    const slots = await scheduleRepository.getAvailableInstructorSlots(
      instructorId
    );
    return slots.map((slot) => {
      let formattedDate = null;
      if (slot.Date) {
        const dateStr =
          slot.Date instanceof Date ? slot.Date : new Date(slot.Date);
        formattedDate = dateStr.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      return {
        ...slot,
        formattedDate,
        timeRange: `${slot.StartTime} - ${slot.EndTime}`,
        isAvailable: slot.IsAvailable || slot.SessionID === null,
      };
    });
  }

  async getInstructorWeeklySchedule(instructorId, weekStartDate) {
    try {
      const schedule = await scheduleRepository.getInstructorWeeklySchedule(
        instructorId,
        weekStartDate
      );
      return schedule;
    } catch (error) {
      console.error("Error in getInstructorWeeklySchedule service:", error);
      throw error;
    }
  }

  async createOneOnOneBooking(bookingData) {
    if (!bookingData.LearnerID || !bookingData.InstructorID) {
      throw new Error("Missing required booking information");
    }

    const result = await scheduleRepository.createOneOnOneBooking(bookingData);
    return result;
  }

  // booking-requests removed

  async getEnrollmentSessions(enrollmentId) {
    try {
      const sessions = await scheduleRepository.getEnrollmentSessions(
        enrollmentId
      );

      // Format dữ liệu
      const formattedSessions = sessions.map((session) => ({
        ...session,
        formattedSessionDate: session.SessionDate
          ? new Date(session.SessionDate).toLocaleDateString("vi-VN")
          : null,
        timeRange:
          session.StartTime && session.EndTime
            ? `${session.StartTime} - ${session.EndTime}`
            : null,
      }));

      return formattedSessions;
    } catch (error) {
      console.error("Error in getEnrollmentSessions service:", error);
      throw error;
    }
  }

  async updateSessionAction(actionData) {
    try {
      const result = await scheduleRepository.updateSessionAction(actionData);
      return result;
    } catch (error) {
      console.error("Error in updateSessionAction service:", error);
      throw error;
    }
  }

  async updateRescheduleResponse(responseData) {
    try {
      const result = await scheduleRepository.updateRescheduleResponse(
        responseData
      );
      return result;
    } catch (error) {
      console.error("Error in updateRescheduleResponse service:", error);
      throw error;
    }
  }

  async getPendingRescheduleRequestsByAccountId(accountId) {
    try {
      const requests =
        await scheduleRepository.getPendingRescheduleRequestsByAccountId(
          accountId
        );

      if (requests === null) {
        throw new Error(
          "Không có hồ sơ học viên. Vui lòng tạo hồ sơ học viên trước."
        );
      }

      // Format và parse thông tin từ Description
      const formattedRequests = requests.map((req) => {
        const description = req.Description || "";
        const oldScheduleMatch = description.match(/\[Lịch cũ: ([^\]]+)\]/);
        const newScheduleMatch = description.match(
          /\[Đề xuất lịch mới: ([^\]]+)\]/
        );
        const reasonMatch = description.match(/Lý do: (.+?)(?=\[|$)/);

        // Format helper function để format date và time
        const formatSchedule = (scheduleStr) => {
          if (!scheduleStr || scheduleStr === "Chưa có lịch học trước đó") {
            return scheduleStr || "Chưa có thông tin";
          }

          // Thử parse format: "2025-11-03 09:00:00-11:00:00" hoặc "2025-11-03 09:00-11:00"
          const dateTimeMatch = scheduleStr.match(
            /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}):?\d{0,2}-(\d{2}:\d{2}):?\d{0,2}$/
          );
          if (dateTimeMatch) {
            const [, date, startTime, endTime] = dateTimeMatch;
            const formattedDate = new Date(date).toLocaleDateString("vi-VN");
            return `${formattedDate} ${startTime}-${endTime}`;
          }

          // Thử parse format Date object đã stringify (ví dụ: "Mon Nov 03 2025... 09:00:00-11:00:00")
          // Pattern: Date string + time range
          const dateObjMatch = scheduleStr.match(
            /^(.+?)\s+(\d{2}:\d{2}):\d{2}-(\d{2}:\d{2}):\d{2}/
          );
          if (dateObjMatch) {
            try {
              // Tìm date trong chuỗi và parse
              const datePart = dateObjMatch[1];
              const parsedDate = new Date(datePart);
              if (!isNaN(parsedDate.getTime())) {
                const formattedDate = parsedDate.toLocaleDateString("vi-VN");
                const startTime = dateObjMatch[2];
                const endTime = dateObjMatch[3];
                return `${formattedDate} ${startTime}-${endTime}`;
              }
            } catch (e) {
              // Ignore parse error
            }
          }

          // Nếu không match được format nào, thử parse toàn bộ chuỗi như Date
          try {
            const parsedDate = new Date(scheduleStr);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toLocaleDateString("vi-VN");
            }
          } catch (e) {
            // Ignore parse error
          }

          // Trả về nguyên bản nếu không parse được
          return scheduleStr;
        };

        // Format oldSchedule và newSchedule
        const oldScheduleStr = oldScheduleMatch ? oldScheduleMatch[1] : null;
        const newScheduleStr = newScheduleMatch ? newScheduleMatch[1] : null;

        const formattedOldSchedule = formatSchedule(oldScheduleStr);
        const formattedNewSchedule = formatSchedule(newScheduleStr);

        return {
          ...req,
          formattedSessionDate: req.SessionDate
            ? new Date(req.SessionDate).toLocaleDateString("vi-VN")
            : null,
          timeRange:
            req.StartTime && req.EndTime
              ? `${req.StartTime} - ${req.EndTime}`
              : null,
          rescheduleInfo: {
            oldSchedule: formattedOldSchedule,
            newSchedule: formattedNewSchedule,
            reason: reasonMatch ? reasonMatch[1].trim() : null,
          },
        };
      });

      return formattedRequests;
    } catch (error) {
      console.error(
        "Error in getPendingRescheduleRequestsByAccountId service:",
        error
      );
      throw error;
    }
  }

  async getLearnerEnrollmentRequestsByAccountId(accountId) {
    // Lấy danh sách đơn đăng ký (enrollment) của người học ở trạng thái Pending
    const connectDB = require("../config/db");
    const db = await connectDB();

    // Tìm LearnerID từ AccountID
    const [learnerRows] = await db.query(
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [accountId]
    );
    if (!learnerRows.length || !learnerRows[0].LearnerID) {
      throw new Error("Không có hồ sơ học viên");
    }

    const learnerId = learnerRows[0].LearnerID;

    const [rows] = await db.query(
      `SELECT 
        e.EnrollmentID,
        e.EnrollmentDate,
        e.Status as EnrollmentStatus,
        e.OrderCode,
        l.LearnerID,
        l.FullName as LearnerName,
        l.ProfilePicture as LearnerAvatar,
        cl.ClassID,
        cl.Name as ClassName,
        cl.Status as ClassStatus,
        cl.Fee as ClassFee,
        cl.InstructorID,
        i.FullName as InstructorName,
        COUNT(DISTINCT s.SessionID) as TotalSessions,
        MIN(s.Date) as FirstSessionDate,
        MAX(s.Date) as LastSessionDate
       FROM enrollment e
       INNER JOIN learner l ON e.LearnerID = l.LearnerID
       INNER JOIN class cl ON e.ClassID = cl.ClassID
       LEFT JOIN instructor i ON cl.InstructorID = i.InstructorID
       LEFT JOIN session s ON cl.ClassID = s.ClassID
       WHERE e.LearnerID = ? 
         AND cl.Status = 'pending'
         AND e.Status = 'Pending'
       GROUP BY 
         e.EnrollmentID,
         e.EnrollmentDate,
         e.Status,
         e.OrderCode,
         l.LearnerID,
         l.FullName,
         l.ProfilePicture,
         cl.ClassID,
         cl.Name,
         cl.Status,
         cl.Fee,
         cl.InstructorID,
         i.FullName
       ORDER BY e.EnrollmentDate DESC`,
      [learnerId]
    );

    return rows;
  }

  async cancelEnrollmentByLearner(enrollmentId, accountId) {
    const connectDB = require("../config/db");
    const db = await connectDB();

    // Xác định learner từ account
    const [learnerRows] = await db.query(
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [accountId]
    );
    if (!learnerRows.length) {
      throw new Error("Không có hồ sơ học viên");
    }
    const learnerId = learnerRows[0].LearnerID;

    // Chỉ cho phép hủy nếu đơn thuộc học viên này và đang Pending + lớp pending
    const [rows] = await db.query(
      `SELECT e.EnrollmentID, e.ClassID
       FROM enrollment e 
       INNER JOIN class c ON e.ClassID = c.ClassID
       WHERE e.EnrollmentID = ? AND e.LearnerID = ? AND e.Status = 'Pending' AND c.Status = 'pending'`,
      [enrollmentId, learnerId]
    );
    if (!rows.length) {
      throw new Error("Không thể hủy: đơn không tồn tại hoặc đã được xử lý");
    }

    const classId = rows[0].ClassID;

    // Cập nhật trạng thái hủy cho enrollment và class
    await db.query(
      `UPDATE enrollment SET Status = 'Cancelled' WHERE EnrollmentID = ?`,
      [enrollmentId]
    );
    await db.query(`UPDATE class SET Status = 'cancelled' WHERE ClassID = ?`, [
      classId,
    ]);

    return { success: true };
  }
}

module.exports = new ScheduleService();
