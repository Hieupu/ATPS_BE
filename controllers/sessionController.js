const sessionService = require("../services/sessionService");
const classService = require("../services/classService");
const instructorService = require("../services/instructorService");

const sessionController = {
  // Tạo session mới
  // Validation đã được thực hiện ở route level (validateSession middleware)
  createSession: async (req, res) => {
    try {
      const sessionData = req.body;
      const result = await sessionService.createSession(sessionData);

      // Nếu có conflict, trả về conflict info để FE hiển thị modal
      if (result.conflict) {
        return res.status(200).json({
          success: false,
          message: "Session bị trùng lịch",
          data: null,
          conflict: result.conflict,
          conflicts: [result.conflict], // Thêm conflicts array để FE dễ xử lý
          hasConflict: true,
          hasConflicts: true, // Thêm hasConflicts (số nhiều) để match với FE
        });
      }

      // Kiểm tra xem session có được tạo thành công không (có SessionID)
      if (!result.success || !result.success.SessionID) {
        return res.status(500).json({
          success: false,
          message: "Không thể tạo session",
          data: null,
          conflicts: [],
          hasConflicts: false,
        });
      }

      // Tạo thành công - có SessionID
      res.status(201).json({
        success: true,
        message: "Tạo session thành công",
        data: result.success,
        SessionID: result.success.SessionID, // Thêm SessionID ở root level để FE dễ kiểm tra
        conflict: null,
        conflicts: [],
        hasConflict: false,
        hasConflicts: false,
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo session",
        error: error.message,
        conflicts: [],
        hasConflicts: false,
      });
    }
  },

  // Lấy tất cả sessions
  getAllSessions: async (req, res) => {
    try {
      const sessions = await sessionService.getAllSessions();

      res.json({
        success: true,
        message: "Lấy danh sách sessions thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions",
        error: error.message,
      });
    }
  },

  // Lấy session theo ID
  getSessionById: async (req, res) => {
    try {
      const sessionId = req.params.sessionId || req.params.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "SessionID là bắt buộc",
        });
      }

      const session = await sessionService.getSessionById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin session thành công",
        data: session,
      });
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin session",
        error: error.message,
      });
    }
  },

  // Lấy sessions theo class
  getSessionsByClassId: async (req, res) => {
    try {
      const classId = req.params.classId;
      const sessions = await sessionService.getSessionsByClassId(classId);

      res.json({
        success: true,
        message: "Lấy danh sách sessions theo class thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions by class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions theo class",
        error: error.message,
      });
    }
  },

  // Lấy sessions theo instructor
  getSessionsByInstructorId: async (req, res) => {
    try {
      const instructorId = req.params.instructorId;
      const sessions = await sessionService.getSessionsByInstructorId(
        instructorId
      );

      res.json({
        success: true,
        message: "Lấy danh sách sessions theo instructor thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions by instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions theo instructor",
        error: error.message,
      });
    }
  },

  // Lấy sessions theo khoảng ngày
  getSessionsByDateRange: async (req, res) => {
    try {
      const { startDate, endDate, classId, instructorId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate và endDate là bắt buộc",
        });
      }

      const filters = {};
      if (classId) filters.classId = classId;
      if (instructorId) filters.instructorId = instructorId;

      const sessions = await sessionService.getSessionsByDateRange(
        startDate,
        endDate,
        filters
      );

      res.json({
        success: true,
        message: "Lấy danh sách sessions theo khoảng ngày thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions by date range:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions theo khoảng ngày",
        error: error.message,
      });
    }
  },

  // Lấy sessions theo TimeslotID
  getSessionsByTimeslotId: async (req, res) => {
    try {
      const { timeslotId } = req.params;

      if (!timeslotId) {
        return res.status(400).json({
          success: false,
          message: "TimeslotID là bắt buộc",
        });
      }

      const sessions = await sessionService.getSessionsByTimeslotId(timeslotId);

      res.json({
        success: true,
        message: "Lấy danh sách sessions theo timeslot thành công",
        data: sessions,
      });
    } catch (error) {
      console.error("Error getting sessions by timeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions theo timeslot",
        error: error.message,
      });
    }
  },

  // Bulk create sessions
  // Validation đã được thực hiện ở route level (validateBulkSessions middleware)
  createBulkSessions: async (req, res) => {
    try {
      const { sessions } = req.body;
      
      // Validate sessions array
      if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "sessions phải là một array không rỗng",
          errors: {
            sessions: "sessions phải là một array không rỗng",
          },
        });
      }

      // Validate từng session
      const sessionErrors = {};
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        
        // Validate required fields
        if (!session.Date || !session.TimeslotID || !session.InstructorID || !session.ClassID) {
          const missingFields = [];
          if (!session.Date) missingFields.push("Date");
          if (!session.TimeslotID) missingFields.push("TimeslotID");
          if (!session.InstructorID) missingFields.push("InstructorID");
          if (!session.ClassID) missingFields.push("ClassID");
          
          sessionErrors[`session_${i}`] = `Session ${i + 1} thiếu: ${missingFields.join(", ")}`;
          continue;
        }

        // Validate Date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(session.Date)) {
          sessionErrors[`session_${i}_Date`] = `Session ${i + 1}: Date phải có format YYYY-MM-DD`;
          continue;
        }

        // Validate integer fields
        if (!Number.isInteger(Number(session.TimeslotID)) || Number(session.TimeslotID) <= 0) {
          sessionErrors[`session_${i}_TimeslotID`] = `Session ${i + 1}: TimeslotID phải là số nguyên dương`;
        }
        if (!Number.isInteger(Number(session.InstructorID)) || Number(session.InstructorID) <= 0) {
          sessionErrors[`session_${i}_InstructorID`] = `Session ${i + 1}: InstructorID phải là số nguyên dương`;
        }
        if (!Number.isInteger(Number(session.ClassID)) || Number(session.ClassID) <= 0) {
          sessionErrors[`session_${i}_ClassID`] = `Session ${i + 1}: ClassID phải là số nguyên dương`;
        }
      }

      // Nếu có lỗi validation, trả về lỗi
      if (Object.keys(sessionErrors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Có lỗi validation trong sessions",
          errors: sessionErrors,
        });
      }

      // Gọi service để tạo sessions
      const result = await sessionService.createBulkSessions(sessions);

      // Chuẩn bị response format nhất quán
      const createdCount = result.success ? result.success.length : 0;
      const conflictCount = result.conflicts ? result.conflicts.length : 0;
      const totalCount = sessions.length;

      // Format conflicts theo yêu cầu - cần lấy thông tin timeslot
      const timeslotRepository = require("../repositories/timeslotRepository");
      const formattedConflicts = await Promise.all(
        (result.conflicts || []).map(async (conflict) => {
          // Lấy thông tin timeslot để có startTime và endTime
          let startTime = conflict.conflictInfo?.startTime || null;
          let endTime = conflict.conflictInfo?.endTime || null;
          
          // Nếu chưa có startTime/endTime, lấy từ timeslot
          if (!startTime || !endTime) {
            try {
              const timeslotId = conflict.sessionData?.TimeslotID || conflict.conflictInfo?.timeslotId;
              if (timeslotId) {
                const timeslot = await timeslotRepository.findById(timeslotId);
                if (timeslot && timeslot.length > 0) {
                  startTime = startTime || timeslot[0].StartTime;
                  endTime = endTime || timeslot[0].EndTime;
                }
              }
            } catch (error) {
              console.error("Error getting timeslot for conflict:", error);
            }
          }

          const conflictInfo = {
            message: conflict.conflictInfo?.message || conflict.error || "Xung đột không xác định",
            className: conflict.sessionData?.className || conflict.conflictInfo?.className || "N/A",
            sessionTitle: conflict.sessionData?.Title || conflict.conflictInfo?.sessionTitle || "N/A",
            date: conflict.sessionData?.Date || conflict.conflictInfo?.date || "N/A",
            startTime: startTime,
            endTime: endTime,
          };

          // Thêm thông tin instructor nếu có
          if (conflict.conflictType === "instructor" || conflict.conflictType === "instructor_leave") {
            conflictInfo.instructorName = conflict.sessionData?.instructorName || conflict.conflictInfo?.instructorName || "N/A";
          }

          return {
            sessionIndex: conflict.sessionIndex,
            conflictType: conflict.conflictType || "unknown",
            conflictInfo: conflictInfo,
          };
        })
      );

      // Format summary
      const summary = {
        total: totalCount,
        created: createdCount,
        conflicts: conflictCount,
      };

      // Xác định success và hasConflicts
      const hasConflicts = conflictCount > 0;
      const isSuccess = createdCount > 0; // Có ít nhất 1 session được tạo

      // Response format nhất quán
      const response = {
        success: isSuccess && !hasConflicts, // true chỉ khi tất cả đều thành công
        hasConflicts: hasConflicts,
        data: {
          created: result.success || [],
          conflicts: formattedConflicts,
          summary: summary,
        },
      };

      // Status code
      if (hasConflicts) {
        // Có conflicts - trả về 200 với success: false
        return res.status(200).json({
          ...response,
          success: false, // Đảm bảo success: false khi có conflicts
          message: conflictCount === totalCount 
            ? `Tất cả ${totalCount} sessions đều bị xung đột`
            : `Tạo thành công ${createdCount} sessions, ${conflictCount} sessions bị xung đột`,
        });
      }

      // Tất cả thành công
      res.status(201).json({
        ...response,
        success: true,
        message: `Tạo thành công ${createdCount} sessions`,
      });
    } catch (error) {
      console.error("Error creating bulk sessions:", error);
      
      // Nếu là validation error, trả về 400
      if (error.message && (
        error.message.includes("validation") ||
        error.message.includes("format") ||
        error.message.includes("không khớp")
      )) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: {
            sessions: error.message,
          },
        });
      }
      
      // Server error
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo bulk sessions",
        error: error.message,
        hasConflicts: false,
        data: {
          created: [],
          conflicts: [],
          summary: {
            total: 0,
            created: 0,
            conflicts: 0,
          },
        },
      });
    }
  },

  // Cập nhật session
  updateSession: async (req, res) => {
    try {
      const sessionId = req.params.sessionId || req.params.id;
      const updateData = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "SessionID là bắt buộc",
        });
      }

      const updatedSession = await sessionService.updateSession(
        sessionId,
        updateData
      );

      if (!updatedSession) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật session thành công",
        data: updatedSession,
      });
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật session",
        error: error.message,
      });
    }
  },

  // Xóa session
  deleteSession: async (req, res) => {
    try {
      const sessionId = req.params.sessionId || req.params.id;

      console.log("Delete session request - params:", req.params);
      console.log("Delete session - sessionId:", sessionId);

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "SessionID là bắt buộc",
        });
      }

      const deleted = await sessionService.deleteSession(sessionId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy session",
        });
      }

      res.json({
        success: true,
        message: "Xóa session thành công",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa session",
        error: error.message,
      });
    }
  },

  // =====================================================
  // BƯỚC 2: GIẢNG VIÊN CHUẨN BỊ NỘI DUNG
  // =====================================================
  // Hàm createSession đã được định nghĩa ở đầu file (dòng 8)
  // Hàm này đã xử lý validation và conflict checking đầy đủ
  // =====================================================

  // Thêm tài liệu cá nhân vào session
  addMaterialToSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { materialId } = req.body;
      const instructorId = req.user.InstructorID;

      // Kiểm tra session thuộc về giảng viên
      const session = await sessionService.getSessionById(sessionId);
      if (!session || session.InstructorID !== instructorId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thêm tài liệu vào session này",
        });
      }

      // Kiểm tra tài liệu thuộc về giảng viên
      const material = await instructorMaterialService.getMaterialById(
        materialId
      );
      if (!material || material.InstructorID !== instructorId) {
        return res.status(400).json({
          success: false,
          message: "Tài liệu không tồn tại hoặc không thuộc về bạn",
        });
      }

      // Thêm mapping
      const result = await sessionService.addMaterialToSession(
        sessionId,
        materialId
      );

      res.json({
        success: true,
        message: "Thêm tài liệu vào session thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error adding material to session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm tài liệu",
        error: error.message,
      });
    }
  },

  // Thêm bài học chuẩn vào session
  addLessonToSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { lessonId, order } = req.body;
      const instructorId = req.user.InstructorID;

      // Kiểm tra session thuộc về giảng viên
      const session = await sessionService.getSessionById(sessionId);
      if (!session || session.InstructorID !== instructorId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thêm bài học vào session này",
        });
      }

      // Kiểm tra bài học tồn tại
      const lesson = await lessonService.getLessonById(lessonId);
      if (!lesson) {
        return res.status(400).json({
          success: false,
          message: "Bài học không tồn tại",
        });
      }

      // Thêm mapping
      const result = await sessionService.addLessonToSession(
        sessionId,
        lessonId,
        order
      );

      res.json({
        success: true,
        message: "Thêm bài học vào session thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error adding lesson to session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm bài học",
        error: error.message,
      });
    }
  },

  // Giảng viên submit để chờ duyệt
  submitForApproval: async (req, res) => {
    try {
      const { classId } = req.params;
      const instructorId = req.user.InstructorID;

      // Kiểm tra lớp thuộc về giảng viên
      const classData = await classService.getClassById(classId);
      if (!classData || classData.InstructorID !== instructorId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền submit lớp này",
        });
      }

      // Kiểm tra status hiện tại
      if (classData.Status !== "DRAFT") {
        return res.status(400).json({
          success: false,
          message: "Lớp học không ở trạng thái DRAFT",
        });
      }

      // Cập nhật status thành WAITING (admin gửi cho instructor)
      const updatedClass = await classService.updateClass(classId, {
        Status: "WAITING",
      });

      res.json({
        success: true,
        message: "Submit lớp để chờ duyệt thành công",
        data: updatedClass,
      });
    } catch (error) {
      console.error("Error submitting for approval:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi submit lớp",
        error: error.message,
      });
    }
  },
};

module.exports = sessionController;
