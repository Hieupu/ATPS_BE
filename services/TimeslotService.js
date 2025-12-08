const timeslotRepository = require("../repositories/timeslotRepository");

class TimeslotService {
  async createTimeslot(data) {
    try {
      // Validate required fields
      if (!data.StartTime || !data.EndTime) {
        throw new Error("StartTime and EndTime are required");
      }

      // Create timeslot (only StartTime and EndTime, no Date)
      const newTimeslot = await timeslotRepository.create(data);
      return newTimeslot;
    } catch (error) {
      throw error;
    }
  }

  async getAllTimeslots(options = {}) {
    try {
      const result = await timeslotRepository.findAll(options);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getTimeslotById(id) {
    try {
      const timeslot = await timeslotRepository.findById(id);
      if (!timeslot) {
        throw new Error("Timeslot not found");
      }
      return timeslot;
    } catch (error) {
      throw error;
    }
  }

  async updateTimeslot(id, data) {
    try {
      // Check if timeslot exists
      const existingTimeslot = await timeslotRepository.findById(id);
      if (!existingTimeslot) {
        throw new Error("Timeslot not found");
      }

      // Update timeslot
      const updatedTimeslot = await timeslotRepository.update(id, data);
      return updatedTimeslot;
    } catch (error) {
      throw error;
    }
  }

  async deleteTimeslot(id) {
    try {
      // Check if timeslot exists
      const existingTimeslot = await timeslotRepository.findById(id);
      if (!existingTimeslot) {
        throw new Error("Timeslot not found");
      }

      // Delete timeslot
      const deleted = await timeslotRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getTimeslotsByDateRange(startDate, endDate) {
    try {
      const timeslots = await timeslotRepository.findByDateRange(
        startDate,
        endDate
      );
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  async getTimeslotsByLocation(location) {
    try {
      const timeslots = await timeslotRepository.findByLocation(location);
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  async getTotalCount() {
    try {
      const total = await timeslotRepository.getTotalCount();
      return total;
    } catch (error) {
      throw error;
    }
  }

  // Lấy timeslots theo ClassID
  async getTimeslotsByClassId(classId) {
    try {
      const timeslots = await timeslotRepository.findByClassId(classId);
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  // Lấy timeslots theo CourseID
  async getTimeslotsByCourseId(courseId) {
    try {
      const timeslots = await timeslotRepository.findByCourseId(courseId);
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch học của học viên
  async getLearnerSchedule(learnerId) {
    try {
      const schedule = await timeslotRepository.getLearnerSchedule(learnerId);
      return schedule;
    } catch (error) {
      throw error;
    }
  }

  // Lấy session đầu tiên và cuối cùng của một lớp
  async getClassSessionTimeRange(classId) {
    try {
      const result = await timeslotRepository.getClassSessionTimeRange(classId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Lấy session đầu tiên và cuối cùng của một khóa học
  async getCourseSessionTimeRange(courseId) {
    try {
      const result = await timeslotRepository.getCourseSessionTimeRange(
        courseId
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả timeslots với thông tin session đầu tiên và cuối cùng
  async getTimeslotsWithSessionRange(classId = null, courseId = null) {
    try {
      const timeslots = await timeslotRepository.getTimeslotsWithSessionRange(
        classId,
        courseId
      );
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê chi tiết về timeslots và sessions
  async getSessionStatistics(classId = null, courseId = null) {
    try {
      const statistics = await timeslotRepository.getSessionStatistics(
        classId,
        courseId
      );
      return statistics;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách lớp với thông tin thời gian session
  async getClassesWithTimeInfo() {
    try {
      const classes = await timeslotRepository.getClassesWithTimeInfo();
      return classes;
    } catch (error) {
      throw error;
    }
  }

  // Lấy ca học đã có sẵn trong DB của một lớp cụ thể
  async getExistingTimeslotsForClass(classId) {
    try {
      const timeslots = await timeslotRepository.getExistingTimeslotsForClass(
        classId
      );
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả ca học đã có sẵn trong DB với thông tin lớp
  async getAllExistingTimeslotsWithClassInfo() {
    try {
      const timeslots =
        await timeslotRepository.getAllExistingTimeslotsWithClassInfo();
      return timeslots;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê ca học cho classlist
  async getClassListWithTimeStats() {
    try {
      const classes = await timeslotRepository.getClassListWithTimeStats();
      return classes;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách học sinh đã enroll vào lớp
  async getEnrolledLearners(classId) {
    try {
      const learners = await timeslotRepository.getEnrolledLearners(classId);
      return learners;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách học sinh đã enroll với thông tin lớp
  async getAllEnrolledLearnersWithClassInfo() {
    try {
      const learners =
        await timeslotRepository.getAllEnrolledLearnersWithClassInfo();
      return learners;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê enrollment cho classlist
  async getClassEnrollmentStats() {
    try {
      const stats = await timeslotRepository.getClassEnrollmentStats();
      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Lấy class sessions theo format frontend cần (cho ClassService.getClassSessions)
  async getClassSessionsForFrontend(classId) {
    try {
      const sessions = await timeslotRepository.getClassSessionsForFrontend(
        classId
      );
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách distinct StartTime và EndTime
  async getDistinctTimeRanges() {
    try {
      const timeRanges = await timeslotRepository.getDistinctTimeRanges();
      return timeRanges;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TimeslotService();
