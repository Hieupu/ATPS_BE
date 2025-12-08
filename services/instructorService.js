const instructorRepository = require("../repositories/instructorRepository");
const courseRepository = require("../repositories/courseRepository");

class InstructorService {
  async listInstructors() {
    // getAllInstructors đã có đầy đủ TotalCourses, TotalStudents, InstructorFee, Certificates
    // Không cần enrich thêm vì query đã đúng
    const instructors = await instructorRepository.getAllInstructors();
    // enrich with stats
    const enriched = await Promise.all(
      instructors.map(async (i) => ({
        ...i,
        ...(await courseRepository
          .getInstructorStats(i.InstructorID)
          .catch(() => ({
            TotalCourses: 0,
            TotalStudents: 0,
          }))),
      }))
    );
    return enriched;
  }

  async getInstructor(instructorId) {
    const instructor = await instructorRepository.getInstructorById(
      instructorId
    );
    if (!instructor) return null;

    const stats = await courseRepository
      .getInstructorStats(instructor.InstructorID)
      .catch(() => ({ TotalCourses: 0, TotalStudents: 0 }));

    const reviews = await instructorRepository.getInstructorReviews(
      instructor.InstructorID,
      20
    );

    return { ...instructor, ...stats, Reviews: reviews };
  }

  // Hàm riêng cho admin - có Status và Gender từ account table
  async getAllInstructorsAdmin() {
    try {
      return await instructorRepository.getAllInstructorsAdmin();
    } catch (error) {
      console.error("Error in getAllInstructorsAdmin service:", error);
      throw error;
    }
  }

  async getInstructorByIdAdmin(instructorId) {
    try {
      const instructor = await instructorRepository.getInstructorByIdAdmin(
        instructorId
      );
      if (!instructor) return null;

      const stats = await courseRepository
        .getInstructorStats(instructor.InstructorID)
        .catch(() => ({ TotalCourses: 0, TotalStudents: 0 }));

      const reviews = await instructorRepository.getInstructorReviews(
        instructor.InstructorID,
        20
      );

      return { ...instructor, ...stats, Reviews: reviews };
    } catch (error) {
      console.error("Error in getInstructorByIdAdmin service:", error);
      throw error;
    }
  }

  async searchInstructors(params) {
    return await instructorRepository.searchInstructors(params);
  }

  async getInstructorIdByAccountId(accountId) {
    try {
      const instructorId =
        await instructorRepository.getInstructorIdByAccountId(accountId);
      return instructorId;
    } catch (error) {
      console.error("Error in getInstructorIdByAccountId service:", error);
      throw error;
    }
  }

  async getFeaturedInstructors(limit = 4) {
    try {
      const instructors = await instructorRepository.getFeaturedInstructors(
        limit
      );
      return instructors;
    } catch (error) {
      console.error("Error in getFeaturedInstructors service:", error);
      throw error;
    }
  }
  async createInstructor(data) {
    try {
      // Validate required fields
      if (!data.AccID || !data.FullName) {
        throw new Error("AccID and FullName are required");
      }

      // Create instructor
      const newInstructor = await instructorRepository.create(data);
      return newInstructor;
    } catch (error) {
      throw error;
    }
  }

  async getAllInstructors() {
    try {
      const instructors = await instructorRepository.findAll();
      return instructors;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorById(id) {
    try {
      const instructor = await instructorRepository.findById(id);
      if (!instructor) {
        throw new Error("Instructor not found");
      }
      return instructor;
    } catch (error) {
      console.error("Error in getInstructorById:", error);
      throw error;
    }
  }

  async getInstructorByAccountId(accountId) {
    try {
      const instructor = await instructorRepository.findByAccountId(accountId);
      if (!instructor) {
        throw new Error("Instructor not found");
      }
      return instructor;
    } catch (error) {
      throw error;
    }
  }

  async updateInstructor(id, data) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(id);
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      // Update instructor
      const updatedInstructor = await instructorRepository.update(id, data);
      return updatedInstructor;
    } catch (error) {
      throw error;
    }
  }

  async deleteInstructor(id) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(id);
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      // Delete instructor
      const deleted = await instructorRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorsByMajor(major) {
    try {
      const instructors = await instructorRepository.findByMajor(major);
      return instructors;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorWithCourses(instructorId) {
    try {
      const instructor = await instructorRepository.findByIdWithCourses(
        instructorId
      );
      if (!instructor) {
        throw new Error("Instructor not found");
      }
      return instructor;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorSchedule(instructorId, startDate = null, endDate = null) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(
        instructorId
      );
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      // Lấy Type và truyền vào getSchedule
      const instructorType = existingInstructor.Type || "parttime";
      const schedule = await instructorRepository.getSchedule(
        instructorId,
        startDate,
        endDate,
        instructorType
      );

      // Trả về schedule kèm Type để frontend biết
      return {
        schedule,
        instructorType,
        instructor: {
          id: existingInstructor.InstructorID,
          name: existingInstructor.FullName,
          type: instructorType,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getInstructorStatistics(instructorId) {
    try {
      // Check if instructor exists
      const existingInstructor = await instructorRepository.findById(
        instructorId
      );
      if (!existingInstructor) {
        throw new Error("Instructor not found");
      }

      const statistics = await instructorRepository.getStatistics(instructorId);
      return statistics;
    } catch (error) {
      throw error;
    }
  }

  // Check timeslot availability theo logic trong Logicforavailableslot.md
  async checkTimeslotAvailability(params) {
    const {
      InstructorID,
      dayOfWeek,
      timeslotId,
      startDate,
      endDatePlan,
      instructorType,
    } = params;

    if (
      !InstructorID ||
      dayOfWeek === undefined ||
      !timeslotId ||
      !startDate ||
      !endDatePlan
    ) {
      throw new Error("Thiếu tham số bắt buộc");
    }

    const sessionRepository = require("../repositories/sessionRepository");
    const instructorTimeslotRepository = require("../repositories/instructorTimeslotRepository");

    // Lấy sessions trong khoảng thời gian
    const sessions = await sessionRepository.findByInstructorAndDateRange(
      InstructorID,
      startDate,
      endDatePlan
    );

    // Lấy blocks (InstructorTimeslot) trong khoảng thời gian
    const blocks = await instructorTimeslotRepository.findByDateRange(
      startDate,
      endDatePlan,
      InstructorID
    );

    const reasons = [];
    let isLocked = false;

    // Helper function để format date
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    let current = new Date(startDate);
    const end = new Date(endDatePlan);

    while (current <= end) {
      const dateStr = formatDate(current);
      const dow = current.getDay();

      // Chỉ check các ngày có dayOfWeek khớp
      if (dow !== dayOfWeek) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      const block = blocks.find(
        (x) => x.Date === dateStr && x.TimeslotID === timeslotId
      );

      // HOLIDAY → khóa cứng (áp dụng cho cả fulltime và parttime)
      if (block && block.Status === "Holiday") {
        isLocked = true;
        reasons.push({
          type: "holiday",
          message: `Ngày ${dateStr} là ngày nghỉ (HOLIDAY) - không thể dạy.`,
        });
        break;
      }

      // Kiểm tra session trùng timeslot
      const hasSession = sessions.some(
        (s) => s.Date === dateStr && s.TimeslotID === timeslotId
      );

      // FULLTIME logic
      if (instructorType === "fulltime") {
        // FULLTIME logic đặc biệt cho chủ nhật
        if (dow === 0) {
          // Chủ nhật: phải AVAILABLE
          if (block?.Status !== "Available") {
            isLocked = true;
            reasons.push({
              type: "invalid_sunday",
              message: `Chủ nhật ${dateStr} không có trạng thái AVAILABLE.`,
            });
            break;
          }

          if (hasSession) {
            isLocked = true;
            reasons.push({
              type: "session_conflict",
              message: `Chủ nhật ${dateStr} giảng viên đã có lớp dạy.`,
            });
            break;
          }
        } else {
          // Ngày thường: chỉ cần không trùng session
          if (hasSession) {
            isLocked = true;
            reasons.push({
              type: "session_conflict",
              message: `Ngày ${dateStr} giảng viên đã có lớp ở ca này.`,
            });
            break;
          }
        }
      }
      // PARTTIME logic
      else if (instructorType === "parttime") {
        // AVAILABLE là bắt buộc cho PARTTIME
        if (!block || block.Status !== "Available") {
          isLocked = true;
          reasons.push({
            type: "not_available",
            message: `Ngày ${dateStr} không có trạng thái AVAILABLE.`,
          });
          break;
        }

        // Trùng session
        if (hasSession) {
          isLocked = true;
          reasons.push({
            type: "session_conflict",
            message: `Ngày ${dateStr} giảng viên đã có lớp học.`,
          });
          break;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return { isLocked, reasons, available: !isLocked };
  }
}

module.exports = new InstructorService();
