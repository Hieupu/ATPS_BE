const payrollRepository = require("../repositories/payrollRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class PayrollService {
  async getInstructorPayroll(startDate, endDate, instructorId = null) {
    try {
      if (!startDate || !endDate) {
        throw new ServiceError("Thiếu StartDate hoặc EndDate", 400);
      }

      const payrollData = await payrollRepository.getInstructorPayroll(
        startDate,
        endDate,
        instructorId
      );

      // Format dữ liệu
      const formattedData = payrollData.map((row) => {
        const baseSalary = Number(row.InstructorFee) || 0; // Lương theo giờ
        const totalSessionsPlanned = Number(row.TotalSessionsPlanned) || 0;
        const totalHoursPlanned = Number(row.TotalHoursPlanned) || 0;
        const totalSessionsActual = Number(row.TotalSessionsActual) || 0;
        const totalHoursActual = Number(row.TotalHoursActual) || 0;
        const totalSalaryPlanned = Number(row.TotalSalaryPlanned) || 0;
        const totalSalaryActual = Number(row.TotalSalaryActual) || 0;
        const expectedTeachingSalary = totalSalaryPlanned; // Lương giảng dạy dự kiến = Tổng lương dự kiến

        return {
          InstructorID: row.InstructorID,
          FullName: row.FullName,
          BaseSalary: baseSalary, // Lương cơ bản (theo giờ)
          ExpectedTeachingSalary: expectedTeachingSalary, // Lương giảng dạy dự kiến
          TotalSalaryActual: totalSalaryActual, // Tổng lương thực tế
          TotalSessionsActual: totalSessionsActual, // Tổng buổi dạy thực tế
          TotalHoursActual: totalHoursActual, // Tổng giờ dạy thực tế
          TotalSalaryPlanned: totalSalaryPlanned, // Tổng lương dự kiến
          TotalSessionsPlanned: totalSessionsPlanned, // Tổng buổi dạy dự kiến
          TotalHoursPlanned: totalHoursPlanned, // Tổng giờ dạy dự kiến
        };
      });

      return formattedData;
    } catch (error) {
      console.error("Error in getInstructorPayroll service:", error);
      throw error;
    }
  }

  async getAllInstructors() {
    try {
      return await payrollRepository.getAllInstructors();
    } catch (error) {
      console.error("Error in getAllInstructors service:", error);
      throw error;
    }
  }
}

module.exports = new PayrollService();
