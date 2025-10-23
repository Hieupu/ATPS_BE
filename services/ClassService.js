const classRepository = require("../repositories/classRepository");
const courseRepository = require("../repositories/courseRepository");
const instructorRepository = require("../repositories/instructorRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const sessionRepository = require("../repositories/sessionRepository");
const timeslotRepository = require("../repositories/timeslotRepository");
const sessiontimeslotRepository = require("../repositories/sessiontimeslotRepository");
const attendanceRepository = require("../repositories/attendanceRepository");
const paymentRepository = require("../repositories/paymentRepository");
const pool = require("../config/db");

class ClassService {
  async createClass(data) {
    try {
      // Validate required fields (CourseID is optional)
      if (!data.ClassName || !data.InstructorID) {
        throw new Error("ClassName and InstructorID are required");
      }

      // Check if course exists (only if CourseID is provided)
      if (data.CourseID) {
        const course = await courseRepository.findById(data.CourseID);
        if (!course) {
          throw new Error("Course not found");
        }
      }

      // Check if instructor exists
      const instructor = await instructorRepository.findById(data.InstructorID);
      if (!instructor) {
        throw new Error("Instructor not found");
      }

      // Create class
      const newClass = await classRepository.create(data);
      return newClass;
    } catch (error) {
      throw error;
    }
  }

  async getAllClasses() {
    try {
      const classes = await classRepository.findAll();
      return classes;
    } catch (error) {
      throw error;
    }
  }

  async getClassById(id) {
    try {
      if (!id) {
        throw new Error("Class ID is required");
      }

      const classData = await classRepository.findById(id);
      if (!classData) {
        console.log(`Class with ID ${id} not found`);
        return null; // Return null instead of throwing error
      }
      return classData;
    } catch (error) {
      console.error("Error in getClassById:", error);
      throw error;
    }
  }

  async updateClass(id, data) {
    try {
      // Check if class exists
      const existingClass = await classRepository.findById(id);
      if (!existingClass) {
        throw new Error("Class not found");
      }

      // Update class
      const updatedClass = await classRepository.update(id, data);
      return updatedClass;
    } catch (error) {
      throw error;
    }
  }

  async deleteClass(id) {
    try {
      // Check if class exists
      const existingClass = await classRepository.findById(id);
      if (!existingClass) {
        throw new Error("Class not found");
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
        // Delete attendance records first (they reference sessiontimeslot)
        await attendanceRepository.deleteBySessionId(session.SessionID);

        // Delete sessiontimeslots
        await sessiontimeslotRepository.deleteBySessionId(session.SessionID);

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
      // Logic để auto update status của classes dựa trên schedule
      const classes = await classRepository.findAll();

      // Có thể implement logic phức tạp hơn ở đây
      // Hiện tại chỉ return classes
      return classes;
    } catch (error) {
      throw error;
    }
  }

  // ========== ClassService APIs theo API_TIME_MANAGEMENT_GUIDE.md ==========

  async createClassSession(classId, sessionData) {
    try {
      const { title, description, timeslots, options = {} } = sessionData;

      // Lấy thông tin class để lấy InstructorID
      const classInfo = await classRepository.findById(classId);
      if (!classInfo) {
        throw new Error("Class not found");
      }

      console.log(
        `Creating session for class ${classId}, instructor ${classInfo.InstructorID}`
      );

      // Kiểm tra conflict timeslot trước khi tạo với options
      await this.checkTimeslotConflicts(classInfo.InstructorID, timeslots, options);

      // Tạo session
      const session = await sessionRepository.create({
        Title: title,
        Description: description,
        ClassID: classId,
        InstructorID: classInfo.InstructorID,
      });

      // Tạo timeslots cho session
      for (const timeslotData of timeslots) {
        const timeslot = await timeslotRepository.create({
          StartTime: timeslotData.startTime,
          EndTime: timeslotData.endTime,
          Date: timeslotData.date,
        });

        // Liên kết session với timeslot
        await sessiontimeslotRepository.create({
          SessionID: session.SessionID,
          TimeslotID: timeslot.TimeslotID,
        });
      }

      // Lấy lại session với timeslots
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
        // Kiểm tra trùng ca học của instructor ở các lớp khác
        const conflictQuery = `
          SELECT DISTINCT
            s.SessionID,
            s.Title as sessionTitle,
            c.ClassName,
            c.ClassID,
            t.Date,
            t.StartTime,
            t.EndTime
          FROM session s
          INNER JOIN sessiontimeslot st ON s.SessionID = st.SessionID
          INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
          INNER JOIN \`class\` c ON s.ClassID = c.ClassID
          WHERE s.InstructorID = ?
            AND t.Date = ?
            AND (
              (t.StartTime <= ? AND t.EndTime > ?) OR
              (t.StartTime < ? AND t.EndTime >= ?) OR
              (t.StartTime >= ? AND t.EndTime <= ?)
            )
        `;

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
          throw new Error(
            `Instructor đã có ca học trùng thời gian: ${conflict.ClassName} - ${conflict.sessionTitle} ` +
              `(${conflict.Date} ${conflict.StartTime}-${conflict.EndTime})`
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
      const timeslotService = require("./timeslotService");
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
      const { title, description, timeslots } = sessionData;

      // Cập nhật session
      const updatedSession = await sessionRepository.update(sessionId, {
        Title: title,
        Description: description,
      });

      // Xóa timeslots cũ
      await sessiontimeslotRepository.deleteBySessionId(sessionId);

      // Tạo timeslots mới
      for (const timeslotData of timeslots) {
        const timeslot = await timeslotRepository.create({
          StartTime: timeslotData.startTime,
          EndTime: timeslotData.endTime,
          Date: timeslotData.date,
        });

        // Liên kết session với timeslot
        await sessiontimeslotRepository.create({
          SessionID: sessionId,
          TimeslotID: timeslot.TimeslotID,
        });
      }

      return updatedSession;
    } catch (error) {
      throw error;
    }
  }

  async deleteClassSession(sessionId) {
    try {
      // Xóa sessiontimeslot trước
      await sessiontimeslotRepository.deleteBySessionId(sessionId);

      // Xóa session
      const deleted = await sessionRepository.delete(sessionId);
      return deleted;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ClassService();
