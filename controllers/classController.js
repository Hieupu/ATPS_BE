const ClassService = require("../services/ClassService");
const Class = require("../models/class");
const Timeslot = require("../models/timeslot");
const Enrollment = require("../models/enrollment");
const Session = require("../models/session");
const SessionTimeslot = require("../models/sessiontimeslot");

const classController = {
  // Lấy danh sách lớp học với thông tin đầy đủ (Admin API)
  getClassesDetails: async (req, res) => {
    try {
      console.log(" Getting classes details with query:", req.query);
      const {
        page = 1,
        limit = 10,
        status = "",
        instructorId = "",
      } = req.query;

      console.log(" Calling Class.findAll with options:", {
        page,
        limit,
        status,
        instructorId,
      });
      const result = await ClassService.getAllClasses({
        page,
        limit,
        status,
        instructorId,
      });
      console.log(" Class.findAll result:", result);

      // Thêm StartDate và EndDate cho mỗi class
      for (let classItem of result.data) {
        try {
          const dateRange = await Class.getClassDateRange(classItem.ClassID);
          classItem.StartDate = dateRange.StartDate;
          classItem.EndDate = dateRange.EndDate;
        } catch (error) {
          console.warn(
            `Warning: Could not get date range for class ${classItem.ClassID}:`,
            error.message
          );
          classItem.StartDate = null;
          classItem.EndDate = null;
        }
      }

      res.json({
        success: true,
        message: "Lấy danh sách lớp học thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error getting classes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp học",
        error: error.message,
      });
    }
  },

  // Lấy danh sách lớp học có sẵn để đăng ký (Learner API)
  getAvailableClasses: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        courseId = "",
        instructorId = "",
      } = req.query;

      const result = await Class.findAll({
        page,
        limit,
        status: "Sắp khai giảng", // Chỉ lấy lớp sắp khai giảng
        instructorId,
        courseId,
      });

      // Thêm StartDate và EndDate cho mỗi class
      for (let classItem of result.data) {
        try {
          const dateRange = await Class.getClassDateRange(classItem.ClassID);
          classItem.StartDate = dateRange.StartDate;
          classItem.EndDate = dateRange.EndDate;
        } catch (error) {
          console.warn(
            `Warning: Could not get date range for class ${classItem.ClassID}:`,
            error.message
          );
          classItem.StartDate = null;
          classItem.EndDate = null;
        }
      }

      res.json({
        success: true,
        message: "Lấy danh sách lớp học có sẵn thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error getting available classes:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách lớp học có sẵn",
        error: error.message,
      });
    }
  },

  // Tạo lớp học mới
  createClass: async (req, res) => {
    try {

      const result = await ClassService.createClass(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo lớp học",
        error: error.message,
      });
    }
  },

  // Lấy chi tiết lớp học theo ID
  getClassById: async (req, res) => {
    try {
     

      const result = await ClassService.getClassById(req.params.classId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy chi tiết lớp học",
        error: error.message,
      });
    }
  },

  // Cập nhật lớp học
  updateClass: async (req, res) => {
    try {
      console.log(
        "🏫 ClassController.updateClass - ClassID:",
        req.params.classId,
        "Data:",
        req.body
      );

      const result = await ClassService.updateClass(
        req.params.classId,
        req.body
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật lớp học",
        error: error.message,
      });
    }
  },

  // Xóa lớp học
  deleteClass: async (req, res) => {
    try {
  

      const result = await ClassService.deleteClass(req.params.classId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa lớp học",
        error: error.message,
      });
    }
  },

  // Lấy thống kê lớp học
  getClassStatistics: async (req, res) => {
    try {
    

      const result = await ClassService.getClassStatistics(req.params.classId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê lớp học",
        error: error.message,
      });
    }
  },

  // Tự động cập nhật trạng thái lớp học
  autoUpdateClassStatus: async (req, res) => {
    try {

      const classes = await ClassService.getAllClassesWithSchedules();
      let updatedCount = 0;

      for (const classItem of classes) {
        const correctStatus = calculateClassStatusFromSessions(classItem);

        if (correctStatus !== classItem.Status) {
          await ClassService.updateClass(classItem.ClassID, {
            Status: correctStatus,
          });
          updatedCount++;
          
        }
      }

      res.json({
        success: true,
        message: "Tự động cập nhật trạng thái lớp học thành công",
        data: updatedCount,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tự động cập nhật trạng thái lớp học",
        error: error.message,
      });
    }
  },

  // Lấy lịch học của lớp (Instructor API)
  getClassSchedule: async (req, res) => {
    try {
      const { classId } = req.params;

      // Lấy thông tin lớp học
      const classInfo = await Class.findByIdDetailed(classId);
      if (!classInfo) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lớp học",
        });
      }

      // Lấy sessions của lớp
      const sessions = await Session.findByClassId(classId);

      // Lấy timeslots cho mỗi session
      const sessionsWithTimeslots = [];
      for (let session of sessions) {
        const sessionTimeslots = await SessionTimeslot.findBySessionId(
          session.SessionID
        );
        const timeslots = [];

        for (let st of sessionTimeslots) {
          const timeslot = await Timeslot.findById(st.TimeslotID);
          timeslots.push({
            SessionTimeslotID: st.SessionTimeslotID,
            Date: timeslot.Date,
            StartTime: timeslot.StartTime,
            EndTime: timeslot.EndTime,
            Location: timeslot.Location,
          });
        }

        sessionsWithTimeslots.push({
          SessionID: session.SessionID,
          Title: session.Title,
          Description: session.Description,
          Timeslots: timeslots,
        });
      }

      // Tính StartDate và EndDate
      const dateRange = await Class.getClassDateRange(classId);

      res.json({
        success: true,
        message: "Lấy lịch học lớp thành công",
        data: {
          ClassID: classInfo.ClassID,
          StartDate: dateRange.StartDate,
          EndDate: dateRange.EndDate,
          Sessions: sessionsWithTimeslots,
        },
      });
    } catch (error) {
      console.error("Error getting class schedule:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch học lớp",
        error: error.message,
      });
    }
  },

  // Đăng ký học viên vào lớp (Admin API)
  enrollLearnerInClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.body;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const enrollment = await Enrollment.create({
        LearnerID: learnerId,
        ClassID: classId,
        Status: "Paid",
      });

      res.status(201).json({
        success: true,
        message: "Đăng ký học viên vào lớp thành công",
        data: enrollment,
      });
    } catch (error) {
      console.error("Error enrolling learner in class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đăng ký học viên vào lớp",
        error: error.message,
      });
    }
  },

  // Hủy đăng ký học viên khỏi lớp (Admin API)
  unenrollLearnerFromClass: async (req, res) => {
    try {
      const { enrollmentId } = req.params;

      const deleted = await Enrollment.delete(enrollmentId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đăng ký",
        });
      }

      res.json({
        success: true,
        message: "Hủy đăng ký thành công",
      });
    } catch (error) {
      console.error("Error unenrolling learner:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi hủy đăng ký",
        error: error.message,
      });
    }
  },

  // Tham gia lớp học (Learner API)
  joinClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.body;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const enrollment = await Enrollment.create({
        LearnerID: learnerId,
        ClassID: classId,
        Status: "Paid",
      });

      res.status(201).json({
        success: true,
        message: "Tham gia lớp học thành công",
        data: enrollment,
      });
    } catch (error) {
      console.error("Error joining class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tham gia lớp học",
        error: error.message,
      });
    }
  },

  // Rời khỏi lớp học (Learner API)
  leaveClass: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.body;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const canceled = await Enrollment.cancelEnrollment(learnerId, classId);

      if (!canceled) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đăng ký hoặc đã hủy rồi",
        });
      }

      res.json({
        success: true,
        message: "Rời khỏi lớp học thành công",
      });
    } catch (error) {
      console.error("Error leaving class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi rời khỏi lớp học",
        error: error.message,
      });
    }
  },

  // Lấy danh sách đăng ký của lớp (Admin API)
  getClassEnrollments: async (req, res) => {
    try {
      const { classId } = req.params;

      const enrollments = await Enrollment.findByClassId(classId);

      res.json({
        success: true,
        message: "Lấy danh sách đăng ký thành công",
        data: enrollments,
      });
    } catch (error) {
      console.error("Error getting class enrollments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy nội dung khóa học cho học viên (Learner API)
  getClassContent: async (req, res) => {
    try {
      const { classId } = req.params;
      const { learnerId } = req.query;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      // Kiểm tra học viên có đăng ký lớp này không
      const enrollments = await Enrollment.findByLearnerId(learnerId);
      const isEnrolled = enrollments.some(
        (enrollment) => enrollment.ClassID == classId
      );

      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          message: "Bạn chưa đăng ký lớp học này",
        });
      }

      // Lấy thông tin lớp học
      const classInfo = await Class.findByIdDetailed(classId);
      if (!classInfo) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lớp học",
        });
      }

      // Lấy sessions của lớp
      const sessions = await Session.findByClassId(classId);

      // Lấy timeslots cho mỗi session
      const sessionsWithTimeslots = [];
      for (let session of sessions) {
        const sessionTimeslots = await SessionTimeslot.findBySessionId(
          session.SessionID
        );
        const timeslots = [];

        for (let st of sessionTimeslots) {
          const timeslot = await Timeslot.findById(st.TimeslotID);
          timeslots.push({
            SessionTimeslotID: st.SessionTimeslotID,
            Date: timeslot.Date,
            StartTime: timeslot.StartTime,
            EndTime: timeslot.EndTime,
            Location: timeslot.Location,
          });
        }

        sessionsWithTimeslots.push({
          SessionID: session.SessionID,
          Title: session.Title,
          Description: session.Description,
          Timeslots: timeslots,
        });
      }

      // Tính StartDate và EndDate
      const dateRange = await Class.getClassDateRange(classId);

      res.json({
        success: true,
        message: "Lấy nội dung khóa học thành công",
        data: {
          ClassID: classInfo.ClassID,
          Course: classInfo.Course,
          Instructor: classInfo.Instructor,
          StartDate: dateRange.StartDate,
          EndDate: dateRange.EndDate,
          Sessions: sessionsWithTimeslots,
        },
      });
    } catch (error) {
      console.error("Error getting class content:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy nội dung khóa học",
        error: error.message,
      });
    }
  },

  // Lấy sessions của class (Admin API)
  getClassSessions: async (req, res) => {
    try {
      const { classId } = req.params;

      // Lấy sessions của lớp
      const sessions = await Session.findByClassId(classId);

      // Lấy timeslots cho mỗi session
      const sessionsWithTimeslots = [];
      for (let session of sessions) {
        const sessionTimeslots = await SessionTimeslot.findBySessionId(
          session.SessionID
        );
        const timeslots = [];

        for (let st of sessionTimeslots) {
          const timeslot = await Timeslot.findById(st.TimeslotID);
          timeslots.push({
            SessionTimeslotID: st.SessionTimeslotID,
            TimeslotID: timeslot.TimeslotID,
            Date: timeslot.Date,
            StartTime: timeslot.StartTime,
            EndTime: timeslot.EndTime,
            Location: timeslot.Location,
          });
        }

        sessionsWithTimeslots.push({
          SessionID: session.SessionID,
          Title: session.Title,
          Description: session.Description,
          Timeslots: timeslots,
        });
      }

      res.json({
        success: true,
        message: "Lấy danh sách sessions thành công",
        data: sessionsWithTimeslots,
      });
    } catch (error) {
      console.error("Error getting class sessions:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách sessions",
        error: error.message,
      });
    }
  },

  // Tạo session cho class (Admin API)
  createClassSession: async (req, res) => {
    try {
      const { classId } = req.params;
      const { title, description, timeslots } = req.body;

      if (!title || !timeslots || timeslots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Title và timeslots là bắt buộc",
        });
      }

      // Lấy thông tin class để lấy InstructorID
      const classInfo = await Class.findById(classId);
      if (!classInfo) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lớp học",
        });
      }

      // Tạo session
      const sessionData = {
        ClassID: classId,
        Title: title,
        Description: description || "",
        InstructorID: req.body.instructorId || classInfo.InstructorID,
      };

      const newSession = await Session.create(sessionData);

      // Tạo timeslots và gán cho session
      const createdTimeslots = [];
      for (let timeslotData of timeslots) {
        // Tạo timeslot
        const timeslot = await Timeslot.create({
          Date: timeslotData.date,
          StartTime: timeslotData.startTime,
          EndTime: timeslotData.endTime,
          Location: timeslotData.location || null,
        });

        // Gán timeslot cho session
        await SessionTimeslot.create({
          SessionID: newSession.SessionID,
          TimeslotID: timeslot.TimeslotID,
        });

        createdTimeslots.push({
          TimeslotID: timeslot.TimeslotID,
          Date: timeslot.Date,
          StartTime: timeslot.StartTime,
          EndTime: timeslot.EndTime,
          Location: timeslot.Location,
        });
      }

      res.status(201).json({
        success: true,
        message: "Tạo session thành công",
        data: {
          SessionID: newSession.SessionID,
          Title: newSession.Title,
          Description: newSession.Description,
          Timeslots: createdTimeslots,
        },
      });
    } catch (error) {
      console.error("Error creating class session:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo session",
        error: error.message,
      });
    }
  },
};

// Helper function để tính trạng thái lớp học dựa trên sessions
const calculateClassStatusFromSessions = (classItem) => {
  if (!classItem.schedule || classItem.schedule.length === 0) {
    return classItem.Status || "Sắp khai giảng";
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day

  const hasFuture = classItem.schedule.some((session) => {
    const sessionDate = new Date(session.Date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= now;
  });

  const hasPast = classItem.schedule.some((session) => {
    const sessionDate = new Date(session.Date);
    sessionDate.setHours(23, 59, 59, 999); // End of day
    return sessionDate < now;
  });

  if (hasFuture && hasPast) return "Đang hoạt động";
  if (hasFuture && !hasPast) return "Sắp khai giảng";
  if (!hasFuture && hasPast) return "Đã kết thúc";
  return "Sắp khai giảng";
};

module.exports = classController;
