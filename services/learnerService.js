const learnerRepository = require("../repositories/learnerRepository");
const enrollmentRepository = require("../repositories/enrollmentRepository");

class LearnerService {
  async createLearner(data) {
    try {
      // Validate required fields
      if (!data.AccID) {
        throw new Error("AccID is required");
      }

      // Create learner
      const newLearner = await learnerRepository.create(data);
      return newLearner;
    } catch (error) {
      throw error;
    }
  }

  async getAllLearners() {
    try {
      const learners = await learnerRepository.findAll();
      return learners;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerById(id) {
    try {
      const learner = await learnerRepository.findById(id);
      if (!learner) {
        throw new Error("Learner not found");
      }
      return learner;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerByAccountId(accountId) {
    try {
      const learner = await learnerRepository.findByAccountId(accountId);
      if (!learner) {
        throw new Error("Learner not found");
      }
      return learner;
    } catch (error) {
      throw error;
    }
  }

  async updateLearner(id, data) {
    try {
      // Check if learner exists
      const existingLearner = await learnerRepository.findById(id);
      if (!existingLearner) {
        throw new Error("Learner not found");
      }

      // Update learner
      const updatedLearner = await learnerRepository.update(id, data);
      return updatedLearner;
    } catch (error) {
      throw error;
    }
  }

  async deleteLearner(id) {
    try {
      // Check if learner exists
      const existingLearner = await learnerRepository.findById(id);
      if (!existingLearner) {
        throw new Error("Learner not found");
      }

      // Delete learner
      const deleted = await learnerRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getLearnersWithEnrollmentCount() {
    try {
      const learners = await learnerRepository.getLearnersWithEnrollmentCount();
      return learners;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerEnrollments(learnerId) {
    try {
      const enrollments = await enrollmentRepository.findByLearnerId(learnerId);
      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerWithClasses(learnerId) {
    try {
      const learner = await learnerRepository.findById(learnerId);
      if (!learner) {
        throw new Error("Learner not found");
      }
      const enrollments = await enrollmentRepository.findByLearnerId(learnerId);
      return { ...learner, enrollments };
    } catch (error) {
      throw error;
    }
  }

  async getLearnerSchedule(learnerId, startDate = null, endDate = null) {
    try {
      // Lấy danh sách lớp học mà learner đã đăng ký
      const enrollments = await enrollmentRepository.findByLearnerId(learnerId);
      
      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // Lấy danh sách ClassIDs
      const classIds = enrollments.map(e => e.ClassID).filter(id => id);

      if (classIds.length === 0) {
        return [];
      }

      // Nếu không có date range, lấy tất cả sessions
      const sessionRepository = require("../repositories/sessionRepository");
      
      if (!startDate || !endDate) {
        // Lấy tất cả sessions từ các lớp học (không filter theo date)
        const allSessions = [];
        for (const classId of classIds) {
          const sessions = await sessionRepository.findByClassId(classId);
          allSessions.push(...sessions);
        }
        // Sort by date and time
        return allSessions.sort((a, b) => {
          if (a.Date !== b.Date) {
            return new Date(a.Date) - new Date(b.Date);
          }
          return (a.StartTime || '').localeCompare(b.StartTime || '');
        });
      }

      // Lấy sessions từ các lớp học với date range
      const sessions = await sessionRepository.findByDateRange(startDate, endDate, {
        classIds: classIds
      });

      return sessions;
    } catch (error) {
      throw error;
    }
  }

  async getLearnerStatistics(learnerId) {
    try {
      const enrollments = await enrollmentRepository.findByLearnerId(learnerId);
      
      // Đếm số lớp học
      const totalClasses = enrollments.length;
      const activeClasses = enrollments.filter(e => e.Status === "active" || e.Status === "enrolled").length;
      const completedClasses = enrollments.filter(e => e.Status === "completed").length;
      const pendingClasses = enrollments.filter(e => e.Status === "pending").length;

      // Lấy thống kê điểm danh
      const attendanceRepository = require("../repositories/attendanceRepository");
      const attendanceStats = await attendanceRepository.getStatisticsByLearner(learnerId);

      return {
        totalClasses,
        activeClasses,
        completedClasses,
        pendingClasses,
        totalSessions: attendanceStats?.totalSessions || 0,
        presentCount: attendanceStats?.presentCount || 0,
        absentCount: attendanceStats?.absentCount || 0,
        lateCount: attendanceStats?.lateCount || 0,
        attendanceRate: attendanceStats?.attendanceRate || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  async getLearnerAttendance(learnerId, classId = null) {
    try {
      const attendanceRepository = require("../repositories/attendanceRepository");
      const attendance = await attendanceRepository.findByLearnerId(learnerId, classId);
      return attendance;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LearnerService();
