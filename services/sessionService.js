const sessionRepository = require("../repositories/sessionRepository");
const classRepository = require("../repositories/classRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const lessonRepository = require("../repositories/lessonRepository");
const {
  validateSessionData,
  validateInstructorLeave,
  validateDateDayConsistency,
} = require("../utils/sessionValidation");

class SessionService {
  // Tạo session mới (Single Create)
  // Return: { success: session, conflict: null } hoặc { success: null, conflict: conflictInfo }
  async createSession(sessionData) {
    try {
      // Kiểm tra lớp tồn tại và lấy thông tin
      const classData = await classRepository.findById(sessionData.ClassID);
      if (!classData || classData.length === 0) {
        throw new Error("Lớp học không tồn tại");
      }

      // InstructorID từ request được ưu tiên (đã validate bắt buộc ở controller)
      // Fallback lấy từ Class chỉ là biện pháp phòng thủ
      const instructorId =
        sessionData.InstructorID || classData[0].InstructorID;
      if (!instructorId) {
        throw new Error(
          `Không tìm thấy InstructorID cho ClassID ${sessionData.ClassID}`
        );
      }

      // Kiểm tra timeslot tồn tại
      const timeslot = await timeslotRepository.findById(
        sessionData.TimeslotID
      );
      if (!timeslot || timeslot.length === 0) {
        throw new Error("Timeslot không tồn tại");
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
      const leaveValidation = await validateInstructorLeave(preparedSessionData);
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

      // Tạo session
      const newSession = await sessionRepository.create(preparedSessionData);

      // ========== SYNCHRONIZATION FUNCTION: Đồng bộ class.Opendate/Enddate ==========
      await this.syncClassDates(preparedSessionData.ClassID);

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

      const pool = require("../config/db");
      const [rows] = await pool.execute(query, [instructorId]);
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
        throw new Error("Session không tồn tại");
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
          throw new Error(dateDayValidation.error);
        }

        // 2. Validate instructor leave
        const leaveValidation = await validateInstructorLeave(sessionDataToCheck);
        if (leaveValidation.hasConflict) {
          throw new Error(leaveValidation.conflictInfo.message);
        }

        // 3. Kiểm tra conflict với session khác, nhưng loại trừ session hiện tại
        await this.checkSessionConflicts(sessionDataToCheck, null, sessionId);
      }

      // Cập nhật session
      const updated = await sessionRepository.update(sessionId, updateData);
      if (updated.affectedRows === 0) {
        throw new Error("Session không tồn tại");
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
  async rescheduleSession(sessionId, newDate, newTimeslotID) {
    try {
      // Validate trạng thái lớp
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error("Session không tồn tại");
      }

      const classData = await classRepository.findById(session.ClassID);
      if (classData && classData.length > 0) {
        const { validateClassStatusForEdit } = require("../utils/classValidation");
        validateClassStatusForEdit(classData[0].Status);
      }

      // Validate reschedule
      const validation = await this.validateReschedule(
        sessionId,
        newDate,
        newTimeslotID
      );
      if (!validation.isValid) {
        throw new Error(
          validation.errors[0]?.message ||
            validation.conflicts[0]?.conflictInfo?.message ||
            "Validation failed"
        );
      }

      // Update session
      return await this.updateSession(sessionId, {
        Date: newDate,
        TimeslotID: newTimeslotID,
      });
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
        throw new Error("Session không tồn tại");
      }

      const classData = await classRepository.findById(session.ClassID);
      if (classData && classData.length > 0) {
        const { validateClassStatusForEdit } = require("../utils/classValidation");
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
        throw new Error("Lớp học không tồn tại");
      }

      const { validateClassStatusForEdit } = require("../utils/classValidation");
      validateClassStatusForEdit(classData[0].Status);

      // Lấy InstructorID từ class
      const instructorId =
        sessionData.InstructorID || classData[0].InstructorID;

      // Chuẩn bị session data
      const preparedSessionData = {
        Title: sessionData.Title || "Buổi học bù",
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
        throw new Error(leaveValidation.conflictInfo.message);
      }

      const dateDayValidation = await validateDateDayConsistency(
        preparedSessionData
      );
      if (!dateDayValidation.isValid) {
        throw new Error(dateDayValidation.error);
      }

      const conflictCheck = await this.checkSessionConflictInfo(
        preparedSessionData
      );
      if (conflictCheck.hasConflict) {
        throw new Error(conflictCheck.conflictInfo.message);
      }

      // Tạo session
      const result = await this.createSession(preparedSessionData);
      if (result.conflict) {
        throw new Error(result.conflict.conflictInfo.message);
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
        throw new Error("Session không tồn tại");
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
        throw new Error("Không có dữ liệu sessions để tạo");
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
          const preparedSession = {
            Title: session.Title,
            Description: session.Description || "", // Mặc định rỗng nếu không có
            ClassID: session.ClassID,
            TimeslotID: session.TimeslotID,
            InstructorID: instructorId, // Ưu tiên từ request, fallback từ Class
            Date: session.Date,
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
          const leaveValidation = await validateInstructorLeave(preparedSession);
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
        for (let i = 0; i < sessionsToCreate.length; i++) {
          const session = await sessionRepository.findById(firstInsertId + i);
          if (session && session[0]) {
            createdSessions.push(session[0]);
            classIdsToSync.add(session[0].ClassID);
          }
        }
      }

      // ========== SYNCHRONIZATION FUNCTION: Đồng bộ class.Opendate/Enddate ==========
      // Đồng bộ cho tất cả các lớp có session được tạo
      for (const classId of classIdsToSync) {
        await this.syncClassDates(classId);
      }

      return {
        success: createdSessions,
        conflicts: conflicts,
        summary: {
          total: sessionsData.length,
          created: createdSessions.length, // Đổi từ "success" sang "created" để match với yêu cầu
          conflicts: conflicts.length,
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
  async checkSessionConflictInfo(sessionData, excludeSessionId = null, excludeClassId = null) {
    try {
      const pool = require("../config/db");
      const { ClassID, TimeslotID, InstructorID, Date } = sessionData;

      // Log để debug
      console.log("[checkSessionConflictInfo] sessionData:", {
        ClassID,
        TimeslotID,
        InstructorID,
        Date,
        excludeSessionId,
        excludeClassId,
        ClassID_type: typeof ClassID,
        TimeslotID_type: typeof TimeslotID,
        InstructorID_type: typeof InstructorID,
        Date_type: typeof Date,
        ClassID_undefined: ClassID === undefined,
        TimeslotID_undefined: TimeslotID === undefined,
        InstructorID_undefined: InstructorID === undefined,
        Date_undefined: Date === undefined,
      });

      // Validate required fields for instructor check
      if (InstructorID === undefined || InstructorID === null) {
        throw new Error("InstructorID is required but was undefined/null");
      }
      if (TimeslotID === undefined || TimeslotID === null) {
        throw new Error("TimeslotID is required but was undefined/null");
      }
      if (Date === undefined || Date === null) {
        throw new Error("Date is required but was undefined/null");
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

      console.log("[checkSessionConflictInfo] Query 1 SQL:", instructorConflictQuery);
      console.log("[checkSessionConflictInfo] Query 1 - instructorParams:", instructorParams);

      const [instructorConflicts] = await pool.execute(
        instructorConflictQuery,
        instructorParams
      );

      console.log(
        `[checkSessionConflictInfo] Query 1 kết quả: ${instructorConflicts.length} conflicts`
      );
      if (instructorConflicts.length > 0) {
        console.log(
          `[checkSessionConflictInfo] Conflict đầu tiên:`,
          instructorConflicts[0]
        );
      }

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

        console.log("[checkSessionConflictInfo] Query 2 - classParams:", classParams);

        const [classConflicts] = await pool.execute(
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
        console.log("[checkSessionConflictInfo] Bỏ qua query class conflict vì ClassID không có");
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
      const pool = require("../config/db");
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

      const [instructorConflicts] = await pool.execute(
        instructorConflictQuery,
        instructorParams
      );

      if (instructorConflicts.length > 0) {
        const conflict = instructorConflicts[0];
        const sessionInfo =
          sessionIndex !== null
            ? `Session ${sessionIndex}`
            : "Session bạn đang tạo";
        throw new Error(
          `${sessionInfo}: Instructor đã có ca học trùng thời gian. ` +
            `Lớp "${conflict.className}" đã có session "${conflict.sessionTitle}" ` +
            `vào ${conflict.Date} (${conflict.StartTime} - ${conflict.EndTime})`
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

      const [classConflicts] = await pool.execute(
        classConflictQuery,
        classParams
      );

      if (classConflicts.length > 0) {
        const conflict = classConflicts[0];
        const sessionInfo =
          sessionIndex !== null
            ? `Session ${sessionIndex}`
            : "Session bạn đang tạo";
        throw new Error(
          `${sessionInfo}: Lớp học đã có session trùng ca học. ` +
            `Session "${conflict.sessionTitle}" đã được tạo ` +
            `vào ${conflict.Date} (${conflict.StartTime} - ${conflict.EndTime})`
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
            throw new Error(
              `Session ${i + 1} và Session ${
                j + 1
              } trùng lịch: Instructor đã có ca học trùng thời gian ` +
                `(${session1.Date}, TimeslotID: ${session1.TimeslotID})`
            );
          }

          // Kiểm tra trùng Date + TimeslotID + ClassID
          if (
            session1.Date === session2.Date &&
            session1.TimeslotID === session2.TimeslotID &&
            session1.ClassID === session2.ClassID
          ) {
            throw new Error(
              `Session ${i + 1} và Session ${
                j + 1
              } trùng ca học: Lớp học đã có session trùng ca học ` +
                `(${session1.Date}, TimeslotID: ${session1.TimeslotID})`
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
      const pool = require("../config/db");

      // Tính toán ngày thực tế sớm nhất và trễ nhất từ session
      const query = `
        SELECT 
          MIN(Date) as ActualStartDate,
          MAX(Date) as ActualEndDate
        FROM session
        WHERE ClassID = ?
      `;

      const [rows] = await pool.execute(query, [classId]);

      if (rows.length === 0 || (!rows[0].ActualStartDate && !rows[0].ActualEndDate)) {
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

      await pool.execute(updateQuery, [actualStartDate, actualEndDate, classId]);

      console.log(
        `Đã đồng bộ dates cho ClassID ${classId}: Opendate=${actualStartDate}, Enddate=${actualEndDate}`
      );
    } catch (error) {
      console.error(`Lỗi khi đồng bộ dates cho ClassID ${classId}:`, error);
      // Không throw error để không làm gián đoạn flow chính
      // Có thể log hoặc gửi notification
    }
  }
}

module.exports = new SessionService();
