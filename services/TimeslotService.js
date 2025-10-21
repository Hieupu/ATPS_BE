const TimeslotModel = require("../models/timeslot");
const TimeslotRequest = require("../requests/TimeslotRequest");

/**
 * TimeslotService - Business logic layer cho Timeslot management
 */
class TimeslotService {
  // Tạo timeslot mới
  static async createTimeslot(data) {
    try {
      console.log("📅 TimeslotService.createTimeslot - Input data:", data);

      // Tạo TimeslotRequest object và validate
      const timeslotRequest = new TimeslotRequest(data);
      const validation = timeslotRequest.validateForCreate();

      if (!validation.isValid) {
        return {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        };
      }

      // Chuyển đổi thành database object
      const timeslotData = timeslotRequest.toDatabaseObject();
      console.log(
        "📅 TimeslotService.createTimeslot - Database object:",
        timeslotData
      );

      // Gọi model để tạo timeslot
      const newTimeslot = await TimeslotModel.create(timeslotData);
      console.log("✅ TimeslotService.createTimeslot - Result:", newTimeslot);

      return {
        success: true,
        message: "Tạo timeslot thành công",
        data: newTimeslot,
      };
    } catch (error) {
      console.error("❌ TimeslotService.createTimeslot - Error:", error);
      return {
        success: false,
        message: "Lỗi khi tạo timeslot",
        error: error.message,
      };
    }
  }

  // Lấy danh sách timeslots
  static async getAllTimeslots(options = {}) {
    try {
      console.log("📅 TimeslotService.getAllTimeslots - Options:", options);

      const result = await TimeslotModel.findAll(options);
      console.log("✅ TimeslotService.getAllTimeslots - Result:", result);

      return {
        success: true,
        message: "Lấy danh sách timeslots thành công",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("❌ TimeslotService.getAllTimeslots - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy danh sách timeslots",
        error: error.message,
      };
    }
  }

  // Lấy timeslot theo ID
  static async getTimeslotById(timeslotId) {
    try {
      console.log(
        "📅 TimeslotService.getTimeslotById - TimeslotID:",
        timeslotId
      );

      const timeslot = await TimeslotModel.findById(timeslotId);

      if (!timeslot) {
        return {
          success: false,
          message: "Không tìm thấy timeslot",
          data: null,
        };
      }

      console.log("✅ TimeslotService.getTimeslotById - Result:", timeslot);

      return {
        success: true,
        message: "Lấy chi tiết timeslot thành công",
        data: timeslot,
      };
    } catch (error) {
      console.error("❌ TimeslotService.getTimeslotById - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy chi tiết timeslot",
        error: error.message,
      };
    }
  }

  // Cập nhật timeslot
  static async updateTimeslot(timeslotId, data) {
    try {
      console.log(
        "📅 TimeslotService.updateTimeslot - TimeslotID:",
        timeslotId,
        "Data:",
        data
      );

      // Tạo TimeslotRequest object và validate
      const timeslotRequest = new TimeslotRequest(data);
      const validation = timeslotRequest.validateForUpdate();

      if (!validation.isValid) {
        return {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        };
      }

      // Chuyển đổi thành database object
      const timeslotData = timeslotRequest.toDatabaseObject();
      console.log(
        "📅 TimeslotService.updateTimeslot - Database object:",
        timeslotData
      );

      // Gọi model để cập nhật timeslot
      const updatedTimeslot = await TimeslotModel.update(
        timeslotId,
        timeslotData
      );

      if (!updatedTimeslot) {
        return {
          success: false,
          message: "Không tìm thấy timeslot để cập nhật",
          data: null,
        };
      }

      console.log(
        "✅ TimeslotService.updateTimeslot - Result:",
        updatedTimeslot
      );

      return {
        success: true,
        message: "Cập nhật timeslot thành công",
        data: updatedTimeslot,
      };
    } catch (error) {
      console.error("❌ TimeslotService.updateTimeslot - Error:", error);
      return {
        success: false,
        message: "Lỗi khi cập nhật timeslot",
        error: error.message,
      };
    }
  }

  // Xóa timeslot
  static async deleteTimeslot(timeslotId) {
    try {
      console.log(
        "📅 TimeslotService.deleteTimeslot - TimeslotID:",
        timeslotId
      );

      const deleted = await TimeslotModel.delete(timeslotId);

      if (!deleted) {
        return {
          success: false,
          message: "Không tìm thấy timeslot để xóa",
          data: null,
        };
      }

      console.log("✅ TimeslotService.deleteTimeslot - Result:", deleted);

      return {
        success: true,
        message: "Xóa timeslot thành công",
        data: { TimeslotID: timeslotId },
      };
    } catch (error) {
      console.error("❌ TimeslotService.deleteTimeslot - Error:", error);
      return {
        success: false,
        message: "Lỗi khi xóa timeslot",
        error: error.message,
      };
    }
  }

  // Lấy timeslots theo ClassID
  static async getTimeslotsByClassId(classId) {
    try {
      console.log(
        "📅 TimeslotService.getTimeslotsByClassId - ClassID:",
        classId
      );

      const timeslots = await TimeslotModel.findByClassId(classId);
      console.log(
        "✅ TimeslotService.getTimeslotsByClassId - Result:",
        timeslots
      );

      return {
        success: true,
        message: "Lấy timeslots của lớp thành công",
        data: timeslots,
      };
    } catch (error) {
      console.error("❌ TimeslotService.getTimeslotsByClassId - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy timeslots của lớp",
        error: error.message,
      };
    }
  }

  // Lấy lịch học của học viên
  static async getLearnerSchedule(learnerId) {
    try {
      console.log(
        "📅 TimeslotService.getLearnerSchedule - LearnerID:",
        learnerId
      );

      const schedule = await TimeslotModel.getLearnerSchedule(learnerId);
      console.log("✅ TimeslotService.getLearnerSchedule - Result:", schedule);

      return {
        success: true,
        message: "Lấy lịch học của học viên thành công",
        data: schedule,
      };
    } catch (error) {
      console.error("❌ TimeslotService.getLearnerSchedule - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy lịch học của học viên",
        error: error.message,
      };
    }
  }
}

module.exports = TimeslotService;



