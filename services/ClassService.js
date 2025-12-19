const classRepository = require("../repositories/classRepository");
const courseRepository = require("../repositories/courseRepository");
const instructorRepository = require("../repositories/instructorRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const sessionRepository = require("../repositories/sessionRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const attendanceRepository = require("../repositories/attendanceRepository");
const paymentRepository = require("../repositories/paymentRepository");
const refundRepository = require("../repositories/refundRepository");
const { generateSessions } = require("../utils/scheduleUtils");
const connectDB = require("../config/db");
const zoomService = require("./zoomService");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class ClassService {
  async createClass(data) {
    try {
      // Validate required fields (CourseID is optional)
      const className = data.Name || data.ClassName; // Support both old and new field names
      if (!className || !data.InstructorID) {
        throw new ServiceError(
          "Thiếu tên lớp (Name/ClassName) hoặc InstructorID",
          400
        );
      }
      const { CLASS_STATUS } = require("../constants/classStatus");
      const classData = {
        Name: className,
        CourseID: data.CourseID || null,
        InstructorID: data.InstructorID,
        Status: data.Status || CLASS_STATUS.DRAFT,
        ZoomID: data.ZoomID || null,
        Zoompass: data.Zoompass || null,
        Fee: data.Fee || null,
        OpendatePlan: data.OpendatePlan || null,
        EnddatePlan: data.EnddatePlan || null,
        Numofsession: data.Numofsession || 0,
        Maxstudent: data.Maxstudent || 0,
        CreatedByStaffID: data.CreatedByStaffID || null,
      };

      if (!classData.ZoomID) {
        try {
          const zoomMeeting = await zoomService.createZoomMeeting({
            topic: className,
          });
          if (zoomMeeting && zoomMeeting.id) {
            classData.ZoomID = zoomMeeting.id;
            classData.Zoompass = zoomMeeting.password || null;
          } else {
            // fallback chuỗi rỗng để không vi phạm NOT NULL
            classData.ZoomID = "";
            classData.Zoompass = "";
          }
        } catch (zoomError) {
          console.error(
            "[ClassService] Failed to auto-create Zoom meeting:",
            zoomError?.response?.data || zoomError.message
          );
          classData.ZoomID = "";
          classData.Zoompass = "";
        }
      }

      if (classData.CourseID) {
        const course = await courseRepository.findById(classData.CourseID);
        if (!course) {
          throw new ServiceError("Khóa học không tồn tại", 404);
        }

        const duration = Number(course.Duration);
        if (!Number.isNaN(duration) && duration > 0) {
          const raw = duration / 2;
          const computedNum = Math.max(1, Math.ceil(raw));
          classData.Numofsession = computedNum;
        } else if (!classData.Numofsession || classData.Numofsession <= 0) {
          // Fallback an toàn: nếu Duration không hợp lệ và không có Numofsession từ payload
          classData.Numofsession = 1;
        }
      } else if (!classData.Numofsession || classData.Numofsession <= 0) {
        // Trường hợp không có CourseID: giữ lại Numofsession từ payload hoặc fallback = 1
        classData.Numofsession = 1;
      }

      // Check if instructor exists
      const instructor = await instructorRepository.findById(
        classData.InstructorID
      );
      if (!instructor) {
        throw new ServiceError("Giảng viên không tồn tại", 404);
      }

      // Create class
      const newClass = await classRepository.create(classData);
      const classId = newClass.insertId;

      // Auto-generate sessions if schedule is provided
      if (data.schedule) {
        const { OpendatePlan, EnddatePlan, DaysOfWeek, TimeslotID } =
          data.schedule;

        // Generate sessions array
        const className =
          classData.Name || classData.ClassName || `Class ${classId}`;
        const sessions = generateSessions({
          classId,
          instructorId: classData.InstructorID,
          startDate: OpendatePlan,
          endDate: EnddatePlan,
          daysOfWeek: DaysOfWeek,
          timeslotId: TimeslotID,
          className: className,
        });

        // Create each session
        const hasZoomMeeting = Boolean(classData.ZoomID);
        for (const session of sessions) {
          let zoomUUID = null;
          if (hasZoomMeeting) {
            try {
              zoomUUID = await zoomService.createZoomOccurrence(
                classId,
                session.Date,
                session.TimeslotID
              );
            } catch (zoomError) {
              console.error(
                "[ClassService] Failed to create Zoom occurrence:",
                zoomError?.response?.data || zoomError.message
              );
            }
          }

          await sessionRepository.create({
            ...session,
            ZoomUUID: zoomUUID || null,
          });
        }

        console.log(
          `Auto-generated ${sessions.length} sessions for class ${classId}`
        );
      }

      // Return full class data
      const fullClassData = await classRepository.findById(classId);
      return fullClassData[0];
    } catch (error) {
      console.error("Error creating class:", error);
      throw error;
    }
  }

  async getAllClasses(options = {}) {
    try {
      // options có thể chứa: { userRole, staffID }
      const classes = await classRepository.findAll(options);
      return classes;
    } catch (error) {
      throw error;
    }
  }

  async getClassById(id) {
    try {
      if (!id) {
        throw new ServiceError("Thiếu ClassID", 400);
      }

      const classData = await classRepository.findById(id);
      if (!classData || classData.length === 0) {
        console.log(`Class with ID ${id} not found`);
        return null; // Return null instead of throwing error
      }
      return classData[0]; // Return first element of array
    } catch (error) {
      console.error("Error in getClassById:", error);
      throw error;
    }
  }

  /**
   * Cập nhật metadata của lớp học (không ảnh hưởng đến sessions)
   *
   * Lưu ý: Các trường ảnh hưởng đến schedule (OpendatePlan, EnddatePlan, Numofsession, InstructorID)
   * không được phép cập nhật qua endpoint này. Phải sử dụng updateClassSchedule().
   *
   * @param {number} id - ClassID
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Object} Class đã được cập nhật
   * @throws {ServiceError} Nếu có trường schedule-affecting fields
   */
  async updateClass(id, data) {
    try {
      // Check if class exists
      const existingClass = await classRepository.findById(id);
      if (!existingClass || existingClass.length === 0) {
        throw new ServiceError("Lớp học không tồn tại", 404);
      }

      // Các trường ảnh hưởng đến sessions - KHÔNG cho phép sửa qua updateClass()
      // Phải dùng updateClassSchedule() để xử lý
      const scheduleAffectingFields = [
        "OpendatePlan",
        "EnddatePlan",
        "Numofsession",
        "InstructorID",
      ];

      // Kiểm tra nếu có trường ảnh hưởng sessions
      const hasScheduleAffectingFields = scheduleAffectingFields.some(
        (field) => data[field] !== undefined && data[field] !== null
      );

      if (hasScheduleAffectingFields) {
        const foundFields = scheduleAffectingFields.filter(
          (field) => data[field] !== undefined && data[field] !== null
        );
        throw new ServiceError(
          `Không thể cập nhật các trường ảnh hưởng đến lịch học (${foundFields.join(
            ", "
          )}) qua endpoint này. ` +
            `Vui lòng sử dụng endpoint /classes/${id}/schedule/update để cập nhật lịch học.`,
          400
        );
      }

      // Các trường được phép sửa (metadata không ảnh hưởng sessions)
      const allowedFields = [
        "Name",
        "CourseID",
        "Status",
        "ZoomID",
        "Zoompass",
        "Fee",
        "Maxstudent",

        "Opendate",
        "Enddate",
      ];

      const filteredData = {};
      Object.keys(data).forEach((key) => {
        if (allowedFields.includes(key)) {
          filteredData[key] = data[key];
        }
      });

      // Update class
      const updatedClass = await classRepository.update(id, filteredData);
      return updatedClass;
    } catch (error) {
      throw error;
    }
  }

  async deleteClass(id) {
    try {
      // Check if class exists
      const existingClass = await classRepository.findById(id);
      if (!existingClass || existingClass.length === 0) {
        throw new ServiceError("Lớp học không tồn tại", 404);
      }

      // Get all sessions for this class
      const sessions = await sessionRepository.findByClassId(id);

      // Delete related records in correct order (cascade delete)
      // 1. Delete payments first (they reference enrollment)
      await paymentRepository.deleteByClassId(id);

      // 2. Delete enrollments (they reference class)
      await enrollmentRepository.deleteByClassId(id);

      // 3. Delete sessions and related records
      for (const session of sessions) {
        // Delete attendance records first (they reference SessionID)
        await attendanceRepository.deleteBySessionId(session.SessionID);

        // Delete session
        await sessionRepository.delete(session.SessionID);
      }

      // 4. Finally delete the class
      const deleted = await classRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getClassesByCourseId(courseId) {
    try {
      const classes = await classRepository.findByCourseId(courseId);
      return classes;
    } catch (error) {
      throw error;
    }
  }

  async getClassesByInstructorId(instructorId) {
    try {
      const classes = await classRepository.findByInstructorId(instructorId);
      return classes;
    } catch (error) {
      throw error;
    }
  }

  async updateStudentCount(classId) {
    try {
      const updated = await classRepository.updateStudentCount(classId);
      return updated;
    } catch (error) {
      throw error;
    }
  }

  async autoUpdateClassStatus() {
    try {
      // Tích hợp với classScheduleService để tự động đóng lớp
      const classScheduleService = require("./classScheduleService");
      const closedClasses = await classScheduleService.autoCloseClasses();

      // Tự động kích hoạt các lớp từ APPROVED sang ACTIVE
      const activatedClasses = await this.autoActivateClasses();

      // Tự động chuyển các lớp từ ACTIVE sang ONGOING khi đến ngày bắt đầu dự kiến (OpendatePlan)
      const startedClasses = await this.autoStartClass();

      return {
        activatedClasses: activatedClasses,
        startedClasses: startedClasses,
        closedClasses: closedClasses,
        message: `Đã kích hoạt ${activatedClasses.length} lớp từ APPROVED sang ACTIVE, chuyển ${startedClasses.length} lớp từ ACTIVE sang ONGOING, đóng ${closedClasses.length} lớp học`,
      };
    } catch (error) {
      throw error;
    }
  }

  // ========== ClassService  ==========

  async createClassSession(classId, sessionData) {
    try {
      const { title, description, timeslots, options = {} } = sessionData;

      // Lấy thông tin class để lấy InstructorID
      const classInfo = await classRepository.findById(classId);
      if (!classInfo || classInfo.length === 0) {
        throw new ServiceError("Lớp học không tồn tại", 404);
      }

      console.log(
        `Creating session for class ${classId}, instructor ${classInfo[0].InstructorID}`
      );

      // Mỗi phần tử trong timeslots sẽ tạo một session riêng
      const createdSessions = [];

      // Kiểm tra conflict timeslot trước khi tạo với options
      await this.checkTimeslotConflicts(
        classInfo[0].InstructorID,
        timeslots,
        options
      );

      // Tạo sessions cho mỗi timeslot
      for (const timeslotData of timeslots) {
        // Tìm hoặc tạo timeslot với StartTime và EndTime (không có Date)
        // TODO: Nên check xem timeslot đã tồn tại chưa để tránh duplicate
        const timeslot = await timeslotRepository.create({
          StartTime: timeslotData.startTime,
          EndTime: timeslotData.endTime,
        });

        // Tạo session với TimeslotID và Date
        let zoomUUID = null;
        if (classInfo[0]?.ZoomID) {
          try {
            zoomUUID = await zoomService.createZoomOccurrence(
              classId,
              timeslotData.date,
              timeslot.TimeslotID
            );
          } catch (zoomError) {
            console.error(
              "[ClassService] Failed to create Zoom occurrence (createClassSession):",
              zoomError?.response?.data || zoomError.message
            );
          }
        }

        const sessionResult = await sessionRepository.create({
          Title: title,
          Description: description,
          ClassID: classId,
          InstructorID: classInfo[0].InstructorID,
          TimeslotID: timeslot.TimeslotID,
          Date: timeslotData.date,
          ZoomUUID: zoomUUID || null,
        });

        createdSessions.push(sessionResult);
      }

      // Lấy lại sessions với timeslots
      const createdSession = await this.getClassSessions(classId);
      return createdSession;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra conflict timeslot cho instructor với options
  async checkTimeslotConflicts(instructorId, newTimeslots, options = {}) {
    try {
      const { allowOverlap = false, maxOverlapMinutes = 0 } = options;

      for (const newTimeslot of newTimeslots) {
        // Kiểm tra trùng ca học của instructor ở các lớp khác (dbver5 schema)
        // dbver5: session trực tiếp có TimeslotID và Date, không cần sessiontimeslot
        const conflictQuery = `
          SELECT DISTINCT
            s.SessionID,
            s.Title as sessionTitle,
            c.Name as ClassName,
            c.ClassID,
            s.Date,
            t.StartTime,
            t.EndTime
          FROM session s
          INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
          INNER JOIN \`class\` c ON s.ClassID = c.ClassID
          WHERE s.InstructorID = ?
            AND s.Date = ?
            AND (
              (t.StartTime <= ? AND t.EndTime > ?) OR
              (t.StartTime < ? AND t.EndTime >= ?) OR
              (t.StartTime >= ? AND t.EndTime <= ?)
            )
        `;

        const pool = await connectDB();
        const [conflicts] = await pool.execute(conflictQuery, [
          instructorId,
          newTimeslot.date,
          newTimeslot.startTime,
          newTimeslot.startTime,
          newTimeslot.endTime,
          newTimeslot.endTime,
          newTimeslot.startTime,
          newTimeslot.endTime,
        ]);

        if (conflicts.length > 0) {
          if (allowOverlap && maxOverlapMinutes > 0) {
            // Check if overlap is within allowed limit
            const overlapMinutes = this.calculateOverlapMinutes(
              conflicts[0],
              newTimeslot
            );
            if (overlapMinutes <= maxOverlapMinutes) {
              console.log(
                `Overlap allowed: ${overlapMinutes} minutes <= ${maxOverlapMinutes} minutes`
              );
              continue; // Allow small overlap
            }
          }

          const conflict = conflicts[0];
          throw new ServiceError(
            `Giảng viên đã có ca trùng: ${conflict.ClassName} - ${conflict.sessionTitle} (${conflict.Date} ${conflict.StartTime}-${conflict.EndTime})`,
            409
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  // Tính toán số phút overlap giữa 2 timeslots
  calculateOverlapMinutes(existingTimeslot, newTimeslot) {
    const existingStart = this.timeToMinutes(existingTimeslot.StartTime);
    const existingEnd = this.timeToMinutes(existingTimeslot.EndTime);
    const newStart = this.timeToMinutes(newTimeslot.startTime);
    const newEnd = this.timeToMinutes(newTimeslot.endTime);

    const overlapStart = Math.max(existingStart, newStart);
    const overlapEnd = Math.min(existingEnd, newEnd);

    if (overlapStart < overlapEnd) {
      return overlapEnd - overlapStart;
    }

    return 0;
  }

  // Chuyển đổi time string thành minutes
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  async getClassSessions(classId) {
    try {
      // Sử dụng method đã có trong timeslotRepository
      const timeslotService = require("./TimeslotService");
      const sessions = await timeslotService.getClassSessionsForFrontend(
        classId
      );
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  async updateClassSession(sessionId, sessionData) {
    try {
      // dbver5: Session chỉ có một TimeslotID và một Date
      // Nếu timeslots là mảng, chỉ lấy phần tử đầu tiên
      const { title, description, timeslots } = sessionData;

      let updateData = {
        Title: title,
        Description: description,
      };

      // Nếu có timeslot, cập nhật TimeslotID và Date
      if (timeslots && timeslots.length > 0) {
        const timeslotData = timeslots[0]; // Chỉ lấy phần tử đầu tiên

        // Tìm hoặc tạo timeslot với StartTime và EndTime
        // TODO: Nên check xem timeslot đã tồn tại chưa để tránh duplicate
        const timeslot = await timeslotRepository.create({
          StartTime: timeslotData.startTime,
          EndTime: timeslotData.endTime,
        });

        updateData.TimeslotID = timeslot.TimeslotID;
        updateData.Date = timeslotData.date;
      }

      // Cập nhật session
      const updatedSession = await sessionRepository.update(
        sessionId,
        updateData
      );

      return updatedSession;
    } catch (error) {
      throw error;
    }
  }

  async deleteClassSession(sessionId) {
    try {
      // Xóa session (không cần xóa sessiontimeslot nữa)
      const deleted = await sessionRepository.delete(sessionId);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // WORKFLOW 4 BƯỚC - CLASS MANAGEMENT
  // =====================================================

  // Lấy danh sách lớp theo status
  async getClassesByStatus(status, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const classes = await classRepository.findByStatus(status, {
        limit,
        offset,
      });

      const total = await classRepository.countByStatus(status);

      return {
        classes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM ĐẾM HỌC VIÊN ==========
  /**
   * Hàm Đếm Học viên: Trả lời câu hỏi "đã có bao nhiêu học viên tham gia lớp"
   * @param {number} classId - ID của lớp
   * @returns {number} - Số lượng học viên đã đăng ký
   */
  async getEnrollmentCount(classId) {
    try {
      const pool = await connectDB();
      const query = `
        SELECT COUNT(*) as count
        FROM enrollment
        WHERE ClassID = ? AND Status = 'active'
      `;

      const [rows] = await pool.execute(query, [classId]);
      return rows[0]?.count || 0;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM KIỂM TRA ĐẦY LỚP ==========
  /**
   * Hàm Kiểm tra Đầy lớp: Kiểm tra xem lớp đã đầy chưa
   * @param {number} classId - ID của lớp
   * @returns {boolean} - true nếu lớp đã đầy
   */
  async isClassFull(classId) {
    try {
      const classData = await classRepository.findById(classId);
      if (!classData || classData.length === 0) {
        throw new ServiceError("Lớp học không tồn tại", 404);
      }

      const enrollmentCount = await this.getEnrollmentCount(classId);
      const maxLearners = classData[0].Maxstudent || 0;

      return enrollmentCount >= maxLearners;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM TỰ ĐỘNG ĐÓNG ĐĂNG KÝ ==========
  /**
   * Hàm Tự động Đóng đăng ký: Tự động đóng lớp khi đủ học viên
   * @param {number} classId - ID của lớp
   * @returns {boolean} - true nếu đã đóng đăng ký
   */
  async autoCloseEnrollment(classId) {
    try {
      const isFull = await this.isClassFull(classId);
      if (isFull) {
        // Có thể set flag hoặc chuyển status tùy business logic
        // Ở đây ta chỉ log, không tự động đóng (để admin quyết định)
        console.log(
          `Lớp ${classId} đã đầy (${await this.getEnrollmentCount(
            classId
          )} học viên)`
        );
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM TỰ ĐỘNG KẾT THÚC ==========
  /**
   * Hàm Tự động Kết thúc: Tự động chuyển Status sang CLOSE/DONE khi Enddate < NOW()
   * Nên chạy hàng đêm (cron job)
   * @returns {Array} - Danh sách các lớp đã được đóng
   */
  async autoCloseClass() {
    try {
      const pool = await connectDB();
      const { CLASS_STATUS } = require("../constants/classStatus");

      // Tìm các lớp đã kết thúc nhưng chưa đóng
      const query = `
        SELECT ClassID, Name, Enddate
        FROM \`class\`
        WHERE Status IN (?, ?, ?)
          AND Enddate IS NOT NULL
          AND Enddate < CURDATE()
      `;

      const [classes] = await pool.execute(query, [
        CLASS_STATUS.ONGOING,
        CLASS_STATUS.ACTIVE,
      ]);

      const closedClasses = [];

      for (const classItem of classes) {
        await classRepository.update(classItem.ClassID, {
          Status: CLASS_STATUS.CLOSE,
        });

        closedClasses.push({
          ClassID: classItem.ClassID,
          Name: classItem.Name,
          Enddate: classItem.Enddate,
        });
      }

      console.log(`Đã tự động đóng ${closedClasses.length} lớp học`);
      return closedClasses;
    } catch (error) {
      throw error;
    }
  }

  // ========== HÀM TỰ ĐỘNG CHUYỂN TỪ APPROVED SANG ACTIVE ==========
  /**
   * Hàm Tự động Kích hoạt: Tự động chuyển status từ APPROVED sang ACTIVE
   * Khi: Số học sinh = maxStudent VÀ đã đến ngày dự kiến mở lớp (OpendatePlan <= NOW())
   * Nên chạy hàng ngày (cron job)
   * @returns {Array} - Danh sách các lớp đã được chuyển sang ACTIVE
   */
  async autoActivateClasses() {
    try {
      const pool = await connectDB();
      const { CLASS_STATUS } = require("../constants/classStatus");

      // Tìm các lớp APPROVED đã đủ điều kiện:
      // 1. Đã đến ngày dự kiến mở lớp (OpendatePlan <= NOW())
      // 2. Số học sinh đã đăng ký = Maxstudent
      const query = `
        SELECT 
          c.ClassID,
          c.Name,
          c.OpendatePlan,
          c.Maxstudent,
          COUNT(e.EnrollmentID) as CurrentEnrollment
        FROM \`class\` c
        LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'active'
        WHERE c.Status = ?
          AND c.OpendatePlan IS NOT NULL
          AND c.OpendatePlan <= CURDATE()
          AND c.Maxstudent > 0
        GROUP BY c.ClassID, c.Name, c.OpendatePlan, c.Maxstudent
        HAVING CurrentEnrollment >= c.Maxstudent
      `;

      const [classes] = await pool.execute(query, [CLASS_STATUS.APPROVED]);

      const activatedClasses = [];

      for (const classItem of classes) {
        await classRepository.update(classItem.ClassID, {
          Status: CLASS_STATUS.ACTIVE,
        });

        activatedClasses.push({
          ClassID: classItem.ClassID,
          Name: classItem.Name,
          OpendatePlan: classItem.OpendatePlan,
          Maxstudent: classItem.Maxstudent,
          CurrentEnrollment: classItem.CurrentEnrollment,
        });
      }

      console.log(
        `Đã tự động kích hoạt ${activatedClasses.length} lớp từ APPROVED sang ACTIVE`
      );
      return activatedClasses;
    } catch (error) {
      console.error("Error in autoActivateClasses:", error);
      throw error;
    }
  }

  // ========== HÀM TỰ ĐỘNG CHUYỂN TỪ ACTIVE SANG ON_GOING ==========
  /**
   * Hàm Tự động Chuyển từ ACTIVE sang ONGOING: Tự động chuyển status từ ACTIVE sang ONGOING
   * khi đến ngày bắt đầu dự kiến (OpendatePlan <= CURDATE())
   * Nên chạy hàng ngày (cron job)
   * @returns {Array} - Danh sách các lớp đã được chuyển từ ACTIVE sang ONGOING
   */
  async autoStartClass() {
    try {
      const pool = await connectDB();
      const { CLASS_STATUS } = require("../constants/classStatus");

      // Tìm các lớp có status ACTIVE và đã đến ngày bắt đầu dự kiến (OpendatePlan)
      const query = `
        SELECT ClassID, Name, OpendatePlan
        FROM \`class\`
        WHERE Status = ?
          AND OpendatePlan IS NOT NULL
          AND OpendatePlan <= CURDATE()
      `;

      const [classes] = await pool.execute(query, [CLASS_STATUS.ACTIVE]);

      const startedClasses = [];

      for (const classItem of classes) {
        await classRepository.update(classItem.ClassID, {
          Status: CLASS_STATUS.ONGOING,
        });

        startedClasses.push({
          ClassID: classItem.ClassID,
          Name: classItem.Name,
          OpendatePlan: classItem.OpendatePlan,
        });
      }

      console.log(
        `Đã tự động chuyển ${startedClasses.length} lớp từ ACTIVE sang ONGOING`
      );
      return startedClasses;
    } catch (error) {
      console.error("Error in autoStartClass:", error);
      throw error;
    }
  }

  // Lấy danh sách lớp có thể đăng ký (PUBLISHED)
  async getAvailableClasses(options = {}) {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const offset = (page - 1) * limit;

      const classes = await classRepository.findAvailableClasses({
        limit,
        offset,
        search,
      });

      const total = await classRepository.countAvailableClasses(search);

      return {
        classes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelClass(classId) {
    const pool = await connectDB();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lấy thông tin lớp
      const classData = await classRepository.findById(classId);
      if (!classData || classData.length === 0) {
        throw new ServiceError("Lớp học không tồn tại", 404);
      }
      const classInfo = classData[0];

      // 2. Lấy datetime hiện tại
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS

      // 3. Lấy tất cả sessions của lớp có Date và StartTime sau datetime hiện tại
      const query = `
        SELECT 
          s.SessionID,
          s.Date,
          s.TimeslotID,
          s.InstructorID,
          t.StartTime,
          t.EndTime
        FROM session s
        LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        WHERE s.ClassID = ?
          AND (
            s.Date > ? 
            OR (s.Date = ? AND t.StartTime > ?)
          )
        ORDER BY s.Date ASC, t.StartTime ASC
      `;

      const [sessionsToDelete] = await connection.execute(query, [
        classId,
        currentDate,
        currentDate,
        currentTime,
      ]);
      // 4. Xóa các sessions và chuyển instructortimeslot từ OTHER về AVAILABLE
      const deletedSessionIds = [];
      for (const session of sessionsToDelete) {
        // Xóa attendance trước (cascade)
        await attendanceRepository.deleteBySessionId(session.SessionID);

        // Xóa session
        await sessionRepository.delete(session.SessionID);
        deletedSessionIds.push(session.SessionID);

        const findInstructorTimeslotQuery = `
          SELECT InstructortimeslotID, Status
          FROM instructortimeslot
          WHERE InstructorID = ?
            AND TimeslotID = ?
            AND Date = ?
            AND Status = 'OTHER'
        `;

        const [instructorTimeslots] = await connection.execute(
          findInstructorTimeslotQuery,
          [session.InstructorID, session.TimeslotID, session.Date]
        );

        // Chuyển từ OTHER về AVAILABLE
        for (const it of instructorTimeslots) {
          const updateQuery = `
            UPDATE instructortimeslot
            SET Status = 'AVAILABLE'
            WHERE InstructortimeslotID = ?
          `;
          await connection.execute(updateQuery, [it.InstructortimeslotID]);
          console.log(
            `[cancelClass] Chuyển instructortimeslot ${it.InstructortimeslotID} từ OTHER về AVAILABLE`
          );
        }
      }

      // 5. Lấy tất cả enrollments của lớp
      const enrollments = await enrollmentRepository.findByClassId(classId);

      // 6. Tạo refundrequest cho các học sinh
      const refundRequests = [];
      for (const enrollment of enrollments) {
        // Kiểm tra xem đã có refundrequest cho enrollment này chưa
        const existingRefunds = await refundRepository.findByEnrollmentId(
          enrollment.EnrollmentID
        );

        // Chỉ tạo refundrequest mới nếu chưa có
        if (!existingRefunds || existingRefunds.length === 0) {
          const refundData = {
            RequestDate: currentDate,
            Reason: `Lớp học ${classInfo.Name} (ClassID: ${classId}) đã bị hủy`,
            Status: "pending",
            EnrollmentID: enrollment.EnrollmentID,
          };

          const refund = await refundRepository.create(refundData);
          refundRequests.push(refund);
        }
      }

      // 7. Cập nhật status của lớp thành CANCEL
      const updatedClass = await classRepository.update(classId, {
        Status: "CANCEL",
      });

      await connection.commit();

      // 8. Gửi email thông báo cho các học viên (không block transaction)
      try {
        const {
          notifyClassCancelled,
        } = require("../utils/emailNotificationHelper");
        await notifyClassCancelled(
          classId,
          `Lớp học ${classInfo.Name} đã bị hủy`
        );
      } catch (emailError) {
        console.error(
          "[cancelClass] Error sending email notifications:",
          emailError
        );
      }

      return {
        success: true,
        deletedSessions: deletedSessionIds.length,
        refundRequests: refundRequests.length,
        class: updatedClass,
      };
    } catch (error) {
      await connection.rollback();
      console.error("[cancelClass] Error:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new ClassService();
