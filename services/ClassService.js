const ClassModel = require("../models/class");
const ClassRequest = require("../requests/ClassRequest");

/**
 * ClassService - Business logic layer cho Class management
 */
class ClassService {
  // Tạo lớp học mới
  static async createClass(data) {
    try {
      console.log("🏫 ClassService.createClass - Input data:", data);

      // Tạo ClassRequest object và validate
      const classRequest = new ClassRequest(data);
      const validation = classRequest.validateForCreate();

      if (!validation.isValid) {
        return {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        };
      }

      // Chuyển đổi thành database object
      const classData = classRequest.toDatabaseObject();
      console.log("🏫 ClassService.createClass - Database object:", classData);

      // Gọi model để tạo class
      const newClass = await ClassModel.create(classData);
      console.log("✅ ClassService.createClass - Result:", newClass);

      return {
        success: true,
        message: "Tạo lớp học thành công",
        data: newClass,
      };
    } catch (error) {
      console.error("❌ ClassService.createClass - Error:", error);
      return {
        success: false,
        message: "Lỗi khi tạo lớp học",
        error: error.message,
      };
    }
  }

  // Lấy danh sách lớp học
  static async getAllClasses(options = {}) {
    try {
      console.log("🏫 ClassService.getAllClasses - Options:", options);

      const result = await ClassModel.findAll(options);
      console.log("✅ ClassService.getAllClasses - Result:", result);

      // Thêm StartDate và EndDate cho mỗi class
      for (let classItem of result.data) {
        try {
          const dateRange = await ClassModel.getClassDateRange(
            classItem.ClassID
          );
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

      return {
        success: true,
        message: "Lấy danh sách lớp học thành công",
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("❌ ClassService.getAllClasses - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy danh sách lớp học",
        error: error.message,
      };
    }
  }

  // Lấy chi tiết lớp học
  static async getClassById(classId) {
    try {
      console.log("🏫 ClassService.getClassById - ClassID:", classId);

      const classData = await ClassModel.findByIdDetailed(classId);

      if (!classData) {
        return {
          success: false,
          message: "Không tìm thấy lớp học",
          data: null,
        };
      }

      console.log("✅ ClassService.getClassById - Result:", classData);

      return {
        success: true,
        message: "Lấy chi tiết lớp học thành công",
        data: classData,
      };
    } catch (error) {
      console.error("❌ ClassService.getClassById - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy chi tiết lớp học",
        error: error.message,
      };
    }
  }

  // Cập nhật lớp học
  static async updateClass(classId, data) {
    try {
      console.log(
        "🏫 ClassService.updateClass - ClassID:",
        classId,
        "Data:",
        data
      );

      // Tạo ClassRequest object và validate
      const classRequest = new ClassRequest(data);
      const validation = classRequest.validateForUpdate();

      if (!validation.isValid) {
        return {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        };
      }

      // Chuyển đổi thành database object
      const classData = classRequest.toDatabaseObject();
      console.log("🏫 ClassService.updateClass - Database object:", classData);

      // Gọi model để cập nhật class
      const updatedClass = await ClassModel.update(classId, classData);

      if (!updatedClass) {
        return {
          success: false,
          message: "Không tìm thấy lớp học để cập nhật",
          data: null,
        };
      }

      console.log("✅ ClassService.updateClass - Result:", updatedClass);

      return {
        success: true,
        message: "Cập nhật lớp học thành công",
        data: updatedClass,
      };
    } catch (error) {
      console.error("❌ ClassService.updateClass - Error:", error);
      return {
        success: false,
        message: "Lỗi khi cập nhật lớp học",
        error: error.message,
      };
    }
  }

  // Xóa lớp học
  static async deleteClass(classId) {
    try {
      console.log("🏫 ClassService.deleteClass - ClassID:", classId);

      const deleted = await ClassModel.delete(classId);

      if (!deleted) {
        return {
          success: false,
          message: "Không tìm thấy lớp học để xóa",
          data: null,
        };
      }

      console.log("✅ ClassService.deleteClass - Result:", deleted);

      return {
        success: true,
        message: "Xóa lớp học thành công",
        data: { ClassID: classId },
      };
    } catch (error) {
      console.error("❌ ClassService.deleteClass - Error:", error);
      return {
        success: false,
        message: "Lỗi khi xóa lớp học",
        error: error.message,
      };
    }
  }

  // Lấy thống kê lớp học
  static async getClassStatistics(classId) {
    try {
      console.log("🏫 ClassService.getClassStatistics - ClassID:", classId);

      const stats = await ClassModel.getStatistics(classId);
      console.log("✅ ClassService.getClassStatistics - Result:", stats);

      return {
        success: true,
        message: "Lấy thống kê lớp học thành công",
        data: stats,
      };
    } catch (error) {
      console.error("❌ ClassService.getClassStatistics - Error:", error);
      return {
        success: false,
        message: "Lỗi khi lấy thống kê lớp học",
        error: error.message,
      };
    }
  }

  // Lấy tất cả lớp học với lịch học (sessions)
  static async getAllClassesWithSchedules() {
    try {
      console.log("🏫 ClassService.getAllClassesWithSchedules - Starting...");

      const result = await ClassModel.findAllWithSchedules();
      console.log(
        "✅ ClassService.getAllClassesWithSchedules - Result:",
        result
      );

      return result;
    } catch (error) {
      console.error(
        "❌ ClassService.getAllClassesWithSchedules - Error:",
        error
      );
      throw error;
    }
  }

  // Tự động cập nhật trạng thái lớp học
  static async autoUpdateClassStatus() {
    try {
      console.log("🏫 ClassService.autoUpdateClassStatus - Starting...");

      const result = await ClassModel.autoUpdateStatus();
      console.log("✅ ClassService.autoUpdateClassStatus - Result:", result);

      return {
        success: true,
        message: "Tự động cập nhật trạng thái lớp học thành công",
        data: result,
      };
    } catch (error) {
      console.error("❌ ClassService.autoUpdateClassStatus - Error:", error);
      return {
        success: false,
        message: "Lỗi khi tự động cập nhật trạng thái lớp học",
        error: error.message,
      };
    }
  }
}

module.exports = ClassService;
