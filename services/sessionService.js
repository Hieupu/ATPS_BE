const sessionRepository = require("../repositories/sessionRepository");
const classRepository = require("../repositories/classRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const lessonRepository = require("../repositories/lessonRepository");
const zoomService = require("./zoomService");
const {
  validateSessionData,
  validateInstructorLeave,
  validateDateDayConsistency,
} = require("../utils/sessionValidation");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class SessionService {
  // Tạo session mới (Single Create)
  // Return: { success: session, conflict: null } hoặc { success: null, conflict: conflictInfo }
  async createSession(sessionData) {
    try {
      // Kiểm tra lớp tồn tại và lấy thông tin
      const classData = await classRepository.findById(sessionData.ClassID);
      if (!classData || classData.length === 0) {
        throw new ServiceError("Lớp học không tồn tại", 404);
      }
      const classInfo = classData[0];
      const hasZoomMeeting = Boolean(classInfo?.ZoomID);

      // InstructorID từ request được ưu tiên (đã validate bắt buộc ở controller)
      // Fallback lấy từ Class chỉ là biện pháp phòng thủ
      const instructorId =
        sessionData.InstructorID || classData[0].InstructorID;
      if (!instructorId) {
        throw new ServiceError(
          `Không tìm thấy InstructorID cho ClassID ${sessionData.ClassID}`,
          400
        );
      }

      // Kiểm tra timeslot tồn tại
      const timeslot = await timeslotRepository.findById(
        sessionData.TimeslotID
      );
      if (!timeslot || timeslot.length === 0) {
        throw new ServiceError("Timeslot không tồn tại", 404);
      }

      // Chuẩn bị session data
      const preparedSessionData = {
        Title: sessionData.Title,
        Description: sessionData.Description || "",
        ClassID: sessionData.ClassID,
        TimeslotID: sessionData.TimeslotID,
        InstructorID: instructorId, // Ưu tiên từ request, fallback từ Class
        Date: sessionData.Date,
      };

      // ========== VALIDATION THEO DBVER5 ==========
      // 1. Kiểm tra xung đột với lịch nghỉ (instructortimeslot)
      const leaveValidation = await validateInstructorLeave(
        preparedSessionData
      );
      if (leaveValidation.hasConflict) {
        return {
          success: null,
          conflict: {
            conflictType: "instructor_leave",
            conflictInfo: {
              ...leaveValidation.conflictInfo,
              sessionData: {
                ...preparedSessionData,
                className: classData[0].Name || classData[0].ClassName,
              },
            },
          },
        };
      }

      // 2. Kiểm tra mâu thuẫn Date vs Day
      const dateDayValidation = await validateDateDayConsistency(
        preparedSessionData
      );
      if (!dateDayValidation.isValid) {
        return {
          success: null,
          conflict: {
            conflictType: "date_day_mismatch",
            conflictInfo: {
              message: dateDayValidation.error,
              details: dateDayValidation.details || null,
              sessionData: {
                ...preparedSessionData,
                className: classData[0].Name || classData[0].ClassName,
              },
            },
          },
        };
      }

      // 3. Kiểm tra conflict với session khác (instructor/class trùng lịch)
      const conflictCheck = await this.checkSessionConflictInfo(
        preparedSessionData
      );

      if (conflictCheck.hasConflict) {
        return {
          success: null,
          conflict: {
            conflictType: conflictCheck.conflictType,
            conflictInfo: {
              ...conflictCheck.conflictInfo,
              sessionData: {
                ...preparedSessionData,
                className: classData[0].Name || classData[0].ClassName,
              },
            },
          },
        };
      }

      // Tạo Zoom occurrence nếu lớp có ZoomID
      if (hasZoomMeeting) {
        try {
          const zoomUUID = await zoomService.createZoomOccurrence(
            preparedSessionData.ClassID,
            preparedSessionData.Date,
            preparedSessionData.TimeslotID
          );
          if (zoomUUID) {
            preparedSessionData.ZoomUUID = zoomUUID;
          }
        } catch (zoomError) {
          console.error(
            "[sessionService] Failed to create Zoom occurrence:",
            zoomError?.response?.data || zoomError.message
          );
        }
      }

      // Tạo session
      const newSession = await sessionRepository.create(preparedSessionData);

      // ========== SYNCHRONIZATION FUNCTION: Đồng bộ class.Opendate/Enddate ==========
      await this.syncClassDates(preparedSessionData.ClassID);

      // Chuyển status từ AVAILABLE sang OTHER trong instructortimeslot
      try {
        const instructorAvailabilityService = require("./instructorAvailabilityService");
        await instructorAvailabilityService.markSlotAsBooked(
          preparedSessionData.InstructorID,
          preparedSessionData.TimeslotID,
          preparedSessionData.Date
        );
      } catch (error) {
        console.error("Error marking slot as booked:", error);
        // Không throw để không ảnh hưởng đến flow chính
      }

      // Lấy thông tin đầy đủ
      const fullSessionData = await sessionRepository.findById(
        newSession.insertId
      );

      return {
        success: fullSessionData[0],
        conflict: null,
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy session theo ID
  async getSessionById(sessionId) {
    try {
      const sessions = await sessionRepository.findById(sessionId);
      return sessions[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả sessions
  async getAllSessions() {
    try {
      const sessions = await sessionRepository.findAll();
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  // Lấy sessions của lớp
  async getSessionsByClass(classId) {
    try {
      const sessions = await sessionRepository.findByClassId(classId);
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  // Alias for getSessionsByClass
  async getSessionsByClassId(classId) {
    return this.getSessionsByClass(classId);
  }

  async getSessionsByInstructorId(instructorId) {
    try {
      const query = `
        SELECT 
          s.*,
          t.StartTime,
          t.EndTime,
          c.Name as ClassName,
          i.FullName as InstructorName
        FROM session s
        LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
        LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
        WHERE s.InstructorID = ?
        ORDER BY s.Date ASC
      `;

      const connectDB = require("../config/db");
      const db = await connectDB();
      const [rows] = await db.execute(query, [instructorId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM VALIDATE KHI DỜI LỊCH ==========
  /**
   * Hàm Validate khi Dời lịch: Khi Admin UPDATE một session (dời sang newDate, newTimeslotID)
   * @param {number} sessionId - ID của session cần dời
   * @param {string} newDate - Ngày mới
   * @param {number} newTimeslotID - TimeslotID mới
   * @returns {Object} - { isValid: boolean, errors: array, conflicts: array }
   */
  async validateReschedule(sessionId, newDate, newTimeslotID) {
    try {
      const currentSession = await this.getSessionById(sessionId);
      if (!currentSession) {
        return {
          isValid: false,
          errors: [{ message: "Session không tồn tại" }],
          conflicts: [],
        };
      }

      const sessionDataToCheck = {
        ClassID: currentSession.ClassID,
        TimeslotID: newTimeslotID,
        InstructorID: currentSession.InstructorID,
        Date: newDate,
      };

      // 1. Validate Date vs Day
      const dateDayValidation = await validateDateDayConsistency(
        sessionDataToCheck
      );
      if (!dateDayValidation.isValid) {
        return {
          isValid: false,
          errors: [{ message: dateDayValidation.error }],
          conflicts: [],
        };
      }

      // 2. Validate instructor leave
      const leaveValidation = await validateInstructorLeave(sessionDataToCheck);
      if (leaveValidation.hasConflict) {
        return {
          isValid: false,
          errors: [],
          conflicts: [leaveValidation],
        };
      }

      // 3. Validate conflict với session khác (loại trừ session hiện tại)
      const conflictCheck = await this.checkSessionConflictInfo(
        sessionDataToCheck,
        sessionId
      );
      if (conflictCheck.hasConflict) {
        return {
          isValid: false,
          errors: [],
          conflicts: [conflictCheck],
        };
      }

      return { isValid: true, errors: [], conflicts: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: error.message }],
        conflicts: [],
      };
    }
  }

  // Cập nhật session
  async updateSession(sessionId, updateData) {
    try {
      // Lấy thông tin session hiện tại
      const currentSession = await this.getSessionById(sessionId);
      if (!currentSession) {
        throw new ServiceError("Buổi học không tồn tại", 404);
      }

      // Logic mới: Không cho phép update ZoomUUID (chỉ được giữ nguyên hoặc không có)
      // Chỉ cho phép update: Title, Description, Date, TimeslotID
      if (
        updateData.ZoomUUID !== undefined &&
        updateData.ZoomUUID !== currentSession.ZoomUUID
      ) {
        // Nếu ZoomUUID khác với ZoomUUID hiện tại → reject hoặc ignore
        // Giữ nguyên ZoomUUID cũ, không update
        delete updateData.ZoomUUID;
      }

      // Nếu có thay đổi Date, TimeslotID, ClassID, hoặc InstructorID thì cần kiểm tra conflict
      const needConflictCheck =
        (updateData.Date && updateData.Date !== currentSession.Date) ||
        (updateData.TimeslotID &&
          updateData.TimeslotID !== currentSession.TimeslotID) ||
        (updateData.ClassID && updateData.ClassID !== currentSession.ClassID) ||
        (updateData.InstructorID &&
          updateData.InstructorID !== currentSession.InstructorID);

      if (needConflictCheck) {
        // Chuẩn bị session data để kiểm tra conflict
        const sessionDataToCheck = {
          ClassID: updateData.ClassID || currentSession.ClassID,
          TimeslotID: updateData.TimeslotID || currentSession.TimeslotID,
          InstructorID: updateData.InstructorID || currentSession.InstructorID,
          Date: updateData.Date || currentSession.Date,
        };

        // ========== VALIDATION THEO DBVER5 ==========
        // 1. Validate Date vs Day
        const dateDayValidation = await validateDateDayConsistency(
          sessionDataToCheck
        );
        if (!dateDayValidation.isValid) {
          throw new ServiceError(
            dateDayValidation.error || "Ngày không hợp lệ với thứ đã chọn",
            400
          );
        }

        // 2. Validate instructor leave
        const leaveValidation = await validateInstructorLeave(
          sessionDataToCheck
        );
        if (leaveValidation.hasConflict) {
          throw new ServiceError(
            leaveValidation.conflictInfo.message ||
              "Lịch nghỉ của giảng viên bị trùng",
            409
          );
        }

        // 3. Kiểm tra conflict với session khác, nhưng loại trừ session hiện tại
        await this.checkSessionConflicts(sessionDataToCheck, null, sessionId);
      }

      // Cập nhật session
      const updated = await sessionRepository.update(sessionId, updateData);
      if (updated.affectedRows === 0) {
        throw new ServiceError("Buổi học không tồn tại", 404);
      }

      // ========== SYNCHRONIZATION FUNCTION: Đồng bộ class.Opendate/Enddate ==========
      const sessionDataToCheck = {
        ClassID: updateData.ClassID || currentSession.ClassID,
      };
      await this.syncClassDates(sessionDataToCheck.ClassID);

      // Lấy thông tin đầy đủ sau khi cập nhật
      const updatedSession = await this.getSessionById(sessionId);
      return updatedSession;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM SỬA LỊCH: DỜI LỊCH (RESCHEDULE) ==========
  /**
   * Hàm Dời lịch: Dời một session sang ngày/ca mới
   * @param {number} sessionId - ID của session
   * @param {string} newDate - Ngày mới
   * @param {number} newTimeslotID - TimeslotID mới
   * @returns {Object} - Session đã được cập nhật
   */
  async rescheduleSession(
    sessionId,
    newDate,
    newTimeslotID,
    options = { updateZoom: true }
  ) {
    try {
      const { updateZoom = true } = options;
      // Validate trạng thái lớp
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new ServiceError("Buổi học không tồn tại", 404);
      }

      const classData = await classRepository.findById(session.ClassID);
      const classInfo = classData && classData.length > 0 ? classData[0] : null;
      if (classInfo) {
        const {
          validateClassStatusForEdit,
        } = require("../utils/classValidation");
        validateClassStatusForEdit(classInfo.Status);
      }

      // Validate reschedule
      const validation = await this.validateReschedule(
        sessionId,
        newDate,
        newTimeslotID
      );
      if (!validation.isValid) {
        const msg =
          validation.errors[0]?.message ||
          validation.conflicts[0]?.conflictInfo?.message ||
          "Kiểm tra hợp lệ không thành công";
        throw new ServiceError(msg, 400);
      }

      const updatePayload = {
        Date: newDate,
        TimeslotID: newTimeslotID,
      };

      const dateChanged = session.Date !== newDate;
      const timeslotChanged = session.TimeslotID !== newTimeslotID;
      const hasZoomMeeting = Boolean(classInfo?.ZoomID);

      if (updateZoom && hasZoomMeeting && (dateChanged || timeslotChanged)) {
        try {
          const newZoomUUID = await zoomService.updateZoomOccurrence(
            session.ZoomUUID,
            session.ClassID,
            newDate,
            newTimeslotID
          );
          if (newZoomUUID) {
            updatePayload.ZoomUUID = newZoomUUID;
          }
        } catch (zoomError) {
          console.error(
            "[sessionService] Failed to update Zoom occurrence:",
            zoomError?.response?.data || zoomError.message
          );
        }
      }

      const updated = await this.updateSession(sessionId, updatePayload);

      // Notify learners when the session date is changed successfully
      if (dateChanged) {
        try {
          const notificationService = require("./notificationService");
          await notificationService.notifyClassSessionRescheduled({
            classId: session.ClassID,
            className: classInfo?.Name,
            oldDate: session.Date,
            newDate: newDate,
          });
        } catch (notifError) {
          console.error(
            "[sessionService] Failed to notifyClassSessionRescheduled:",
            notifError?.message || notifError
          );
        }
      }

      return updated;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM SỬA LỊCH: HỦY BUỔI (CANCEL) ==========
  /**
   * Hàm Hủy buổi: Hủy một session
   * @param {number} sessionId - ID của session
   * @param {string} reason - Lý do hủy (optional)
   * @returns {boolean} - true nếu hủy thành công
   */
  async cancelSession(sessionId, reason = null) {
    try {
      // Validate trạng thái lớp
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new ServiceError("Buổi học không tồn tại", 404);
      }

      const classData = await classRepository.findById(session.ClassID);
      if (classData && classData.length > 0) {
        const {
          validateClassStatusForEdit,
        } = require("../utils/classValidation");
        validateClassStatusForEdit(classData[0].Status);
      }

      // Xóa session
      const deleted = await this.deleteSession(sessionId);

      if (reason) {
        console.log(`Session ${sessionId} đã bị hủy. Lý do: ${reason}`);
      }

      return deleted;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM SỬA LỊCH: THÊM BUỔI BÙ (ADD MAKEUP) ==========
  /**
   * Hàm Thêm buổi bù: Thêm session mới vào cuối lịch (học bù)
   * @param {number} classId - ID của lớp
   * @param {Object} sessionData - Dữ liệu session { Title, Description, Date, TimeslotID }
   * @returns {Object} - Session đã được tạo
   */
  async addMakeupSession(classId, sessionData) {
    try {
      // Validate trạng thái lớp
      const classData = await classRepository.findById(classId);
      if (!classData || classData.length === 0) {
        throw new ServiceError("Lớp học không tồn tại", 404);
      }

      const {
        validateClassStatusForEdit,
      } = require("../utils/classValidation");
      validateClassStatusForEdit(classData[0].Status);

      // Lấy InstructorID từ class
      const instructorId =
        sessionData.InstructorID || classData[0].InstructorID;

      // Lấy className để tạo title
      const className =
        classData[0].Name || classData[0].ClassName || `Class ${classId}`;

      // Chuẩn bị session data
      const preparedSessionData = {
        Title: sessionData.Title || `Session for class ${className}`,
        Description: sessionData.Description || "",
        ClassID: classId,
        TimeslotID: sessionData.TimeslotID,
        InstructorID: instructorId,
        Date: sessionData.Date,
      };

      // Validate session data (sử dụng validation functions)
      const leaveValidation = await validateInstructorLeave(
        preparedSessionData
      );
      if (leaveValidation.hasConflict) {
        throw new ServiceError(
          leaveValidation.conflictInfo.message ||
            "Lịch nghỉ của giảng viên bị trùng",
          409
        );
      }

      const dateDayValidation = await validateDateDayConsistency(
        preparedSessionData
      );
      if (!dateDayValidation.isValid) {
        throw new ServiceError(
          dateDayValidation.error || "Ngày không khớp với thứ đã chọn",
          400
        );
      }

      const conflictCheck = await this.checkSessionConflictInfo(
        preparedSessionData
      );
      if (conflictCheck.hasConflict) {
        throw new ServiceError(
          conflictCheck.conflictInfo.message || "Buổi học bị trùng lịch",
          409
        );
      }

      // Tạo session
      const result = await this.createSession(preparedSessionData);
      if (result.conflict) {
        throw new ServiceError(
          result.conflict.conflictInfo.message || "Buổi học bị trùng lịch",
          409
        );
      }

      return result.success;
    } catch (error) {
      throw error;
    }
  }

  // Xóa session
  async deleteSession(sessionId) {
    try {
      // Lấy thông tin session trước khi xóa để biết ClassID
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new ServiceError("Buổi học không tồn tại", 404);
      }

      // Nếu có thông tin InstructorID, TimeslotID, Date thì giải phóng slot (OTHER -> AVAILABLE)
      try {
        if (session.InstructorID && session.TimeslotID && session.Date) {
          const instructorAvailabilityService = require("./instructorAvailabilityService");
          await instructorAvailabilityService.markSlotAsAvailable(
            session.InstructorID,
            session.TimeslotID,
            session.Date
          );
        }
      } catch (releaseError) {
        console.error(
          "Error releasing instructor slot when deleting session:",
          releaseError
        );
        // Không throw để không làm gián đoạn flow xóa session
      }

      // Xóa session
      const deleted = await sessionRepository.delete(sessionId);

      // ========== SYNCHRONIZATION FUNCTION: Đồng bộ class.Opendate/Enddate ==========
      if (deleted && session.ClassID) {
        await this.syncClassDates(session.ClassID);
      }

      return deleted;
    } catch (error) {
      throw error;
    }
  }

  // Tạo nhiều sessions cùng lúc (Bulk Create)
  // Return: { success: [...], conflicts: [...] }
  async createBulkSessions(sessionsData) {
    try {
      if (!sessionsData || sessionsData.length === 0) {
        throw new ServiceError("Không có dữ liệu buổi học để tạo", 400);
      }

      // Logic mới: Validate timeslot pattern cho DRAFT classes
      // Yêu cầu: Các ca học trong ngày phải giống nhau cho tất cả các ngày
      // Được phép ở buổi cuối chỉ có một phần ca học nếu đã đủ số buổi
      const classIds = [...new Set(sessionsData.map((s) => s.ClassID))];
      for (const classId of classIds) {
        const classSessions = sessionsData.filter((s) => s.ClassID === classId);
        if (classSessions.length > 0) {
          // Lấy thông tin class để check Status
          const classData = await classRepository.findById(classId);
          if (classData && classData.length > 0) {
            const classStatus = classData[0].Status || classData[0].status;
            const numofsession = classData[0].Numofsession || 0;

            // Nếu class có Status = 'DRAFT', validate timeslot pattern
            if (classStatus === "DRAFT" || classStatus === "draft") {
              // Lấy tất cả TimeslotID từ sessions để query timeslot info
              const allTimeslotIds = [
                ...new Set(
                  classSessions
                    .map((s) => s.TimeslotID)
                    .filter((id) => id != null)
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
              const getTimeslotKey = (timeslotId) => {
                const timeslot = timeslotMap.get(timeslotId);
                if (!timeslot) return null;
                const startTime = (timeslot.StartTime || "").trim();
                const endTime = (timeslot.EndTime || "").trim();
                return `${startTime}-${endTime}`;
              };

              // Nhóm sessions theo Date, lưu timeslot keys (StartTime-EndTime) thay vì TimeslotID
              const sessionsByDate = {};
              classSessions.forEach((session) => {
                const date = session.Date;
                if (!date) return;

                if (!sessionsByDate[date]) {
                  sessionsByDate[date] = [];
                }
                const timeslotKey = getTimeslotKey(session.TimeslotID);
                if (timeslotKey) {
                  sessionsByDate[date].push(timeslotKey);
                }
              });

              // Sắp xếp các ngày theo thứ tự
              const sortedDates = Object.keys(sessionsByDate).sort();

              if (sortedDates.length === 0) {
                throw new ServiceError(
                  `Lớp (ClassID: ${classId}) ở trạng thái DRAFT nhưng không có buổi hợp lệ`,
                  400
                );
              }

              // Lấy set timeslot keys chung từ các ngày (trừ ngày cuối)
              let commonTimeslotsSet = null;
              const datesToCheck = sortedDates.slice(0, -1); // Tất cả ngày trừ ngày cuối

              if (datesToCheck.length > 0) {
                // Lấy set timeslot keys từ ngày đầu tiên làm chuẩn
                const firstDateTimeslots = new Set(
                  sessionsByDate[datesToCheck[0]]
                );
                commonTimeslotsSet = firstDateTimeslots;

                // Kiểm tra các ngày còn lại (trừ ngày cuối) có cùng set timeslot keys không
                for (let i = 1; i < datesToCheck.length; i++) {
                  const date = datesToCheck[i];
                  const dateTimeslots = new Set(sessionsByDate[date]);

                  // So sánh 2 sets có giống nhau không (so sánh StartTime-EndTime)
                  if (
                    commonTimeslotsSet.size !== dateTimeslots.size ||
                    ![...commonTimeslotsSet].every((key) =>
                      dateTimeslots.has(key)
                    )
                  ) {
                    throw new ServiceError(
                      `Lớp (ClassID: ${classId}) trạng thái DRAFT: Các ca học phải giống nhau. ` +
                        `Ngày ${datesToCheck[0]} có ca [${[
                          ...commonTimeslotsSet,
                        ].join(", ")}], ngày ${date} có ca [${[
                          ...dateTimeslots,
                        ].join(", ")}]`,
                      400
                    );
                  }
                }
              }

              // Kiểm tra ngày cuối: được phép có subset của set chung nếu đã đủ số buổi
              const lastDate = sortedDates[sortedDates.length - 1];
              const lastDateTimeslots = new Set(sessionsByDate[lastDate]);

              if (commonTimeslotsSet && commonTimeslotsSet.size > 0) {
                // Kiểm tra ngày cuối có phải subset của set chung không (so sánh StartTime-EndTime)
                const isSubset = [...lastDateTimeslots].every((key) =>
                  commonTimeslotsSet.has(key)
                );

                if (!isSubset) {
                  throw new ServiceError(
                    `Lớp (ClassID: ${classId}) trạng thái DRAFT: Ngày cuối (${lastDate}) có ca [${[
                      ...lastDateTimeslots,
                    ].join(", ")}] không khớp ca chung [${[
                      ...commonTimeslotsSet,
                    ].join(", ")}]`,
                    400
                  );
                }

                // Kiểm tra số buổi: nếu chưa đủ số buổi thì ngày cuối phải có đủ các ca
                const totalSessions = classSessions.length;
                if (totalSessions < numofsession) {
                  // Chưa đủ số buổi → ngày cuối phải có đủ các ca như các ngày khác
                  if (lastDateTimeslots.size < commonTimeslotsSet.size) {
                    throw new ServiceError(
                      `Lớp (ClassID: ${classId}) trạng thái DRAFT: Chưa đủ số buổi (${totalSessions}/${numofsession}). ` +
                        `Ngày cuối (${lastDate}) phải có đủ ca [${[
                          ...commonTimeslotsSet,
                        ].join(", ")}]`,
                      400
                    );
                  }
                }
                // Nếu đã đủ số buổi (totalSessions >= numofsession), ngày cuối được phép có ít hơn
              } else {
                // Chỉ có 1 ngày → không cần validate pattern
                // Nhưng vẫn cần kiểm tra số buổi
                const totalSessions = classSessions.length;
                if (totalSessions < numofsession) {
                  throw new ServiceError(
                    `Lớp (ClassID: ${classId}) trạng thái DRAFT: Chưa đủ số buổi (${totalSessions}/${numofsession})`,
                    400
                  );
                }
              }
            }
          }
        }
      }

      // Chuẩn bị dữ liệu sessions với các giá trị mặc định
      const validSessions = []; // Sessions hợp lệ, không conflict
      const conflicts = []; // Sessions bị conflict

      for (let i = 0; i < sessionsData.length; i++) {
        const session = sessionsData[i];

        try {
          // Kiểm tra lớp tồn tại và lấy thông tin
          const classData = await classRepository.findById(session.ClassID);
          if (!classData || classData.length === 0) {
            conflicts.push({
              sessionIndex: i + 1,
              sessionData: session,
              error: `Lớp học với ClassID ${session.ClassID} không tồn tại`,
            });
            continue;
          }

          // InstructorID từ request được ưu tiên (đã validate bắt buộc ở controller)
          // Fallback lấy từ Class chỉ là biện pháp phòng thủ
          const instructorId =
            session.InstructorID || classData[0].InstructorID;
          if (!instructorId) {
            conflicts.push({
              sessionIndex: i + 1,
              sessionData: session,
              error: `Không tìm thấy InstructorID cho ClassID ${session.ClassID}`,
            });
            continue;
          }

          // Kiểm tra timeslot tồn tại
          const timeslot = await timeslotRepository.findById(
            session.TimeslotID
          );
          if (!timeslot || timeslot.length === 0) {
            conflicts.push({
              sessionIndex: i + 1,
              sessionData: session,
              error: `Timeslot với TimeslotID ${session.TimeslotID} không tồn tại`,
            });
            continue;
          }

          // Chuẩn bị session data với các giá trị mặc định
          // Logic mới: Preserve ZoomUUID nếu có trong session data (không sinh mới)
          const preparedSession = {
            Title: session.Title,
            Description: session.Description || "", // Mặc định rỗng nếu không có
            ClassID: session.ClassID,
            TimeslotID: session.TimeslotID,
            InstructorID: instructorId, // Ưu tiên từ request, fallback từ Class
            Date: session.Date,
            ZoomUUID: session.ZoomUUID || null, // Logic mới: Giữ lại ZoomUUID nếu có, không sinh mới
          };

          // Lấy thông tin instructor và class name
          const instructorRepository = require("../repositories/instructorRepository");
          const instructorData = await instructorRepository.findById(
            instructorId
          );
          const instructorName =
            instructorData && instructorData.length > 0
              ? instructorData[0].FullName
              : "N/A";
          const className =
            classData[0].Name || classData[0].ClassName || "N/A";

          // ========== VALIDATION THEO DBVER5 ==========
          // 1. Kiểm tra xung đột với lịch nghỉ
          const leaveValidation = await validateInstructorLeave(
            preparedSession
          );
          if (leaveValidation.hasConflict) {
            conflicts.push({
              sessionIndex: i + 1,
              sessionData: {
                ...preparedSession,
                className: className,
                instructorName: instructorName,
              },
              conflictType: "instructor_leave",
              conflictInfo: leaveValidation.conflictInfo,
            });
            continue;
          }

          // 2. Kiểm tra mâu thuẫn Date vs Day
          const dateDayValidation = await validateDateDayConsistency(
            preparedSession
          );
          if (!dateDayValidation.isValid) {
            conflicts.push({
              sessionIndex: i + 1,
              sessionData: {
                ...preparedSession,
                className: className,
                instructorName: instructorName,
              },
              conflictType: "date_day_mismatch",
              conflictInfo: {
                message: dateDayValidation.error,
                details: dateDayValidation.details || null,
              },
            });
            continue;
          }

          // 3. Kiểm tra conflict với database (sessions đã tồn tại)
          const conflictCheck = await this.checkSessionConflictInfo(
            preparedSession
          );

          if (conflictCheck.hasConflict) {
            conflicts.push({
              sessionIndex: i + 1,
              sessionData: {
                ...preparedSession,
                className: className,
                instructorName: instructorName,
              },
              conflictType: conflictCheck.conflictType,
              conflictInfo: conflictCheck.conflictInfo,
            });
            continue;
          }

          // Tạo Zoom occurrence nếu lớp có ZoomID
          if (classData[0]?.ZoomID) {
            try {
              const zoomUUID = await zoomService.createZoomOccurrence(
                preparedSession.ClassID,
                preparedSession.Date,
                preparedSession.TimeslotID
              );
              if (zoomUUID) {
                preparedSession.ZoomUUID = zoomUUID;
              }
            } catch (zoomError) {
              console.error(
                "[sessionService] Failed to create Zoom occurrence (bulk):",
                zoomError?.response?.data || zoomError.message
              );
            }
          }

          // Thêm vào danh sách sessions hợp lệ
          validSessions.push({
            index: i + 1,
            data: preparedSession,
            className: className,
            instructorName: instructorName,
          });
        } catch (error) {
          conflicts.push({
            sessionIndex: i + 1,
            sessionData: session,
            error: error.message,
          });
        }
      }

      // Kiểm tra conflict giữa các sessions trong cùng batch
      const batchConflicts = [];
      for (let i = 0; i < validSessions.length; i++) {
        for (let j = i + 1; j < validSessions.length; j++) {
          const s1 = validSessions[i].data;
          const s2 = validSessions[j].data;

          // Kiểm tra trùng Date + TimeslotID + InstructorID hoặc ClassID
          if (
            s1.Date === s2.Date &&
            s1.TimeslotID === s2.TimeslotID &&
            (s1.InstructorID === s2.InstructorID || s1.ClassID === s2.ClassID)
          ) {
            const conflictType =
              s1.InstructorID === s2.InstructorID ? "instructor" : "class";

            // Lấy thông tin session bị conflict (s1) để hiển thị
            const conflictSession1Data = await classRepository.findById(
              s1.ClassID
            );
            const conflictSession1Class =
              conflictSession1Data && conflictSession1Data.length > 0
                ? conflictSession1Data[0].Name ||
                  conflictSession1Data[0].ClassName
                : "N/A";

            // Lấy thông tin timeslot để có StartTime và EndTime
            const conflictTimeslot = await timeslotRepository.findById(
              s1.TimeslotID
            );
            const conflictStartTime = conflictTimeslot
              ? conflictTimeslot.StartTime
              : null;
            const conflictEndTime = conflictTimeslot
              ? conflictTimeslot.EndTime
              : null;

            // Di chuyển session thứ 2 vào conflicts
            batchConflicts.push({
              sessionIndex: validSessions[j].index,
              sessionData: {
                ...s2,
                className: validSessions[j].className || "N/A",
                instructorName: validSessions[j].instructorName || "N/A",
              },
              conflictType: conflictType,
              conflictInfo: {
                instructorName: validSessions[i].instructorName || "N/A",
                className: conflictSession1Class,
                sessionTitle: validSessions[i].data.Title,
                date: s1.Date,
                startTime: conflictStartTime,
                endTime: conflictEndTime,
                timeslotId: s1.TimeslotID,
                message: `Trùng với session ${validSessions[i].index} trong cùng batch`,
              },
            });
            validSessions.splice(j, 1);
            j--; // Điều chỉnh index sau khi remove
          }
        }
      }

      // Thêm batch conflicts vào conflicts list
      conflicts.push(...batchConflicts);

      // Tạo bulk sessions với các sessions hợp lệ
      let createdSessions = [];
      const classIdsToSync = new Set(); // Tập hợp ClassID cần đồng bộ

      if (validSessions.length > 0) {
        const sessionsToCreate = validSessions.map((s) => s.data);
        const result = await sessionRepository.createBulk(sessionsToCreate);

        // Lấy thông tin đầy đủ của các sessions vừa tạo
        const firstInsertId = result.insertId;
        const instructorAvailabilityService = require("./instructorAvailabilityService");

        for (let i = 0; i < sessionsToCreate.length; i++) {
          const session = await sessionRepository.findById(firstInsertId + i);
          if (session && session[0]) {
            createdSessions.push(session[0]);

            // Chuyển status từ AVAILABLE sang OTHER trong instructortimeslot
            try {
              await instructorAvailabilityService.markSlotAsBooked(
                session[0].InstructorID,
                session[0].TimeslotID,
                session[0].Date
              );
            } catch (error) {
              console.error("Error marking slot as booked:", error);
              // Không throw để không ảnh hưởng đến flow chính
            }
            classIdsToSync.add(session[0].ClassID);
          }
        }
      }

      // ========== SYNCHRONIZATION FUNCTION: Đồng bộ class.Opendate/Enddate ==========
      // Đồng bộ cho tất cả các lớp có session được tạo
      for (const classId of classIdsToSync) {
        await this.syncClassDates(classId);
      }

      const totalRequested = sessionsData.length;
      const totalCreated = createdSessions.length;
      const totalConflicts = conflicts.length;

      // Logic mới: nếu có bất kỳ conflict nào (không tạo đủ số buổi theo yêu cầu)
      // thì coi là lỗi business, trả 409 để FE hiển thị lỗi và không coi là tạo đủ lịch.
      if (totalConflicts > 0 || totalCreated < totalRequested) {
        throw new ServiceError(
          `Không thể tạo đủ buổi học. Đã tạo ${totalCreated}/${totalRequested} buổi, có ${totalConflicts} buổi bị xung đột.`,
          409
        );
      }

      return {
        success: createdSessions,
        conflicts: [],
        summary: {
          total: totalRequested,
          created: totalCreated,
          conflicts: 0,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy sessions theo khoảng ngày
  async getSessionsByDateRange(startDate, endDate, filters = {}) {
    try {
      const sessions = await sessionRepository.findByDateRange(
        startDate,
        endDate,
        filters
      );
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  // Lấy sessions theo TimeslotID
  async getSessionsByTimeslotId(timeslotId) {
    try {
      const sessions = await sessionRepository.findByTimeslotId(timeslotId);
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra conflict và trả về thông tin conflict (không throw error)
  // Return: { hasConflict: boolean, conflictType: string, conflictInfo: object }
  async checkSessionConflictInfo(
    sessionData,
    excludeSessionId = null,
    excludeClassId = null
  ) {
    try {
      const connectDB = require("../config/db");
      const db = await connectDB();
      const { ClassID, TimeslotID, InstructorID, Date } = sessionData;

      // Validate required fields for instructor check
      if (InstructorID === undefined || InstructorID === null) {
        throw new ServiceError(
          "Thiếu InstructorID cho kiểm tra trùng lịch",
          400
        );
      }
      if (TimeslotID === undefined || TimeslotID === null) {
        throw new ServiceError("Thiếu TimeslotID cho kiểm tra trùng lịch", 400);
      }
      if (Date === undefined || Date === null) {
        throw new ServiceError(
          "Thiếu ngày (Date) cho kiểm tra trùng lịch",
          400
        );
      }

      // 1. Kiểm tra instructor có bận không (trùng Date + TimeslotID + InstructorID)
      // Loại trừ các sessions của class hiện tại nếu có excludeClassId
      // (để tránh conflict với các sessions đã tạo khi "Lưu bản nháp")
      let instructorConflictQuery = `
        SELECT 
          s.SessionID,
          s.Title as sessionTitle,
          s.Date,
          c.Name as className,
          c.ClassID,
          i.FullName as instructorName,
          t.StartTime,
          t.EndTime
        FROM session s
        INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        INNER JOIN \`class\` c ON s.ClassID = c.ClassID
        INNER JOIN instructor i ON s.InstructorID = i.InstructorID
        WHERE s.InstructorID = ?
          AND s.Date = ?
          AND s.TimeslotID = ?
      `;

      const instructorParams = [InstructorID, Date, TimeslotID];
      if (excludeSessionId) {
        instructorConflictQuery += ` AND s.SessionID != ?`;
        instructorParams.push(excludeSessionId);
      }
      if (excludeClassId) {
        instructorConflictQuery += ` AND s.ClassID != ?`;
        instructorParams.push(excludeClassId);
      }

      const [instructorConflicts] = await db.execute(
        instructorConflictQuery,
        instructorParams
      );

      console.log(`[checkSessionConflictInfo] Instructor conflict check:`, {
        InstructorID,
        Date,
        TimeslotID,
        excludeClassId,
        foundConflicts: instructorConflicts.length,
        conflicts: instructorConflicts.map((c) => ({
          SessionID: c.SessionID,
          ClassID: c.ClassID,
          className: c.className,
          Date: c.Date,
        })),
      });

      if (instructorConflicts.length > 0) {
        const conflict = instructorConflicts[0];
        return {
          hasConflict: true,
          conflictType: "instructor",
          conflictInfo: {
            instructorName: conflict.instructorName,
            className: conflict.className,
            sessionTitle: conflict.sessionTitle,
            date: conflict.Date,
            startTime: conflict.StartTime,
            endTime: conflict.EndTime,
            timeslotId: TimeslotID,
            message: `Giảng viên "${conflict.instructorName}" đã có ca học tại lớp "${conflict.className}" vào ${conflict.Date} (${conflict.StartTime} - ${conflict.EndTime})`,
          },
        };
      }

      // 2. Kiểm tra class đã có session ở ca này chưa (trùng Date + TimeslotID + ClassID)
      // CHỈ chạy query này nếu ClassID được cung cấp (khi tạo session cho class cụ thể)
      // Trong findAvailableInstructorSlots, không có ClassID nên bỏ qua bước này
      if (ClassID !== undefined && ClassID !== null) {
        let classConflictQuery = `
        SELECT 
          s.SessionID,
          s.Title as sessionTitle,
          s.Date,
          c.Name as className,
          i.FullName as instructorName,
          t.StartTime,
          t.EndTime
        FROM session s
        INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        INNER JOIN \`class\` c ON s.ClassID = c.ClassID
        INNER JOIN instructor i ON s.InstructorID = i.InstructorID
        WHERE s.ClassID = ?
          AND s.Date = ?
          AND s.TimeslotID = ?
      `;

        const classParams = [ClassID, Date, TimeslotID];
        if (excludeSessionId) {
          classConflictQuery += ` AND s.SessionID != ?`;
          classParams.push(excludeSessionId);
        }

        const [classConflicts] = await db.execute(
          classConflictQuery,
          classParams
        );

        if (classConflicts.length > 0) {
          const conflict = classConflicts[0];
          return {
            hasConflict: true,
            conflictType: "class",
            conflictInfo: {
              instructorName: conflict.instructorName,
              className: conflict.className,
              sessionTitle: conflict.sessionTitle,
              date: conflict.Date,
              startTime: conflict.StartTime,
              endTime: conflict.EndTime,
              timeslotId: TimeslotID,
              message: `Lớp "${conflict.className}" đã có session "${conflict.sessionTitle}" vào ${conflict.Date} (${conflict.StartTime} - ${conflict.EndTime})`,
            },
          };
        }
      } else {
      }

      return { hasConflict: false };
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra conflict khi tạo session (throw error - dùng cho single create)
  // Kiểm tra:
  // 1. Trùng Date + TimeslotID + InstructorID (instructor bận)
  // 2. Trùng Date + TimeslotID + ClassID (class đã có session ở ca đó)
  // excludeSessionId: ID của session cần loại trừ khỏi kiểm tra (khi update)
  async checkSessionConflicts(
    sessionData,
    sessionIndex = null,
    excludeSessionId = null
  ) {
    try {
      const connectDB = require("../config/db");
      const db = await connectDB();
      const { ClassID, TimeslotID, InstructorID, Date } = sessionData;

      // 1. Kiểm tra instructor có bận không (trùng Date + TimeslotID + InstructorID)
      let instructorConflictQuery = `
        SELECT 
          s.SessionID,
          s.Title as sessionTitle,
          s.Date,
          c.Name as className,
          c.ClassID,
          t.StartTime,
          t.EndTime
        FROM session s
        INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        INNER JOIN \`class\` c ON s.ClassID = c.ClassID
        WHERE s.InstructorID = ?
          AND s.Date = ?
          AND s.TimeslotID = ?
      `;

      const instructorParams = [InstructorID, Date, TimeslotID];
      if (excludeSessionId) {
        instructorConflictQuery += ` AND s.SessionID != ?`;
        instructorParams.push(excludeSessionId);
      }

      const [instructorConflicts] = await db.execute(
        instructorConflictQuery,
        instructorParams
      );

      if (instructorConflicts.length > 0) {
        const conflict = instructorConflicts[0];
        const sessionInfo =
          sessionIndex !== null
            ? `Session ${sessionIndex}`
            : "Session bạn đang tạo";
        throw new ServiceError(
          `${sessionInfo}: Giảng viên đã có ca trùng. ` +
            `Lớp "${conflict.className}" đã có buổi "${conflict.sessionTitle}" ` +
            `vào ${conflict.Date} (${conflict.StartTime} - ${conflict.EndTime})`,
          409
        );
      }

      // 2. Kiểm tra class đã có session ở ca này chưa (trùng Date + TimeslotID + ClassID)
      let classConflictQuery = `
        SELECT 
          s.SessionID,
          s.Title as sessionTitle,
          s.Date,
          t.StartTime,
          t.EndTime
        FROM session s
        INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        WHERE s.ClassID = ?
          AND s.Date = ?
          AND s.TimeslotID = ?
      `;

      const classParams = [ClassID, Date, TimeslotID];
      if (excludeSessionId) {
        classConflictQuery += ` AND s.SessionID != ?`;
        classParams.push(excludeSessionId);
      }

      const [classConflicts] = await db.execute(
        classConflictQuery,
        classParams
      );

      if (classConflicts.length > 0) {
        const conflict = classConflicts[0];
        const sessionInfo =
          sessionIndex !== null
            ? `Session ${sessionIndex}`
            : "Session bạn đang tạo";
        throw new ServiceError(
          `${sessionInfo}: Lớp học đã có buổi trùng ca. ` +
            `Buổi "${conflict.sessionTitle}" đã được tạo ` +
            `vào ${conflict.Date} (${conflict.StartTime} - ${conflict.EndTime})`,
          409
        );
      }

      return true; // Không có conflict
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra conflict giữa các sessions trong cùng batch (bulk create)
  checkBatchConflicts(sessions) {
    try {
      for (let i = 0; i < sessions.length; i++) {
        const session1 = sessions[i];
        for (let j = i + 1; j < sessions.length; j++) {
          const session2 = sessions[j];

          // Kiểm tra trùng Date + TimeslotID + InstructorID
          if (
            session1.Date === session2.Date &&
            session1.TimeslotID === session2.TimeslotID &&
            session1.InstructorID === session2.InstructorID
          ) {
            throw new ServiceError(
              `Session ${i + 1} và Session ${
                j + 1
              } trùng lịch: Giảng viên đã có ca trùng (${
                session1.Date
              }, TimeslotID: ${session1.TimeslotID})`,
              409
            );
          }

          // Kiểm tra trùng Date + TimeslotID + ClassID
          if (
            session1.Date === session2.Date &&
            session1.TimeslotID === session2.TimeslotID &&
            session1.ClassID === session2.ClassID
          ) {
            throw new ServiceError(
              `Session ${i + 1} và Session ${
                j + 1
              } trùng ca: Lớp đã có buổi trùng (${session1.Date}, TimeslotID: ${
                session1.TimeslotID
              })`,
              409
            );
          }
        }
      }
      return true; // Không có conflict trong batch
    } catch (error) {
      throw error;
    }
  }

  // ========== SYNCHRONIZATION FUNCTION: Đồng bộ class.Opendate/Enddate với session ==========
  // Hàm này được gọi tự động sau mỗi lần INSERT, UPDATE, hoặc DELETE session
  // Đảm bảo class.Opendate = MIN(session.Date) và class.Enddate = MAX(session.Date)
  async syncClassDates(classId) {
    try {
      const connectDB = require("../config/db");
      const db = await connectDB();

      // Tính toán ngày thực tế sớm nhất và trễ nhất từ session
      const query = `
        SELECT 
          MIN(Date) as ActualStartDate,
          MAX(Date) as ActualEndDate
        FROM session
        WHERE ClassID = ?
      `;

      const [rows] = await db.execute(query, [classId]);

      if (
        rows.length === 0 ||
        (!rows[0].ActualStartDate && !rows[0].ActualEndDate)
      ) {
        // Nếu không có session nào, có thể set về null hoặc giữ nguyên
        // Tùy vào business logic, ở đây ta sẽ không cập nhật
        return;
      }

      const actualStartDate = rows[0].ActualStartDate;
      const actualEndDate = rows[0].ActualEndDate;

      // Cập nhật lại "bản sao" trong bảng class
      const updateQuery = `
        UPDATE \`class\`
        SET Opendate = ?, Enddate = ?
        WHERE ClassID = ?
      `;

      await db.execute(updateQuery, [actualStartDate, actualEndDate, classId]);
    } catch (error) {
      console.error(`Lỗi khi đồng bộ dates cho ClassID ${classId}:`, error);
      // Không throw error để không làm gián đoạn flow chính
      // Có thể log hoặc gửi notification
    }
  }
}

module.exports = new SessionService();
