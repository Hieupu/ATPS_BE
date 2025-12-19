const payrollRepository = require("../repositories/payrollRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class PayrollService {
  async getInstructorPayroll(
    startDate,
    endDate,
    instructorId = null,
    page = 1,
    limit = 10
  ) {
    try {
      if (!startDate || !endDate) {
        throw new ServiceError("Thiếu StartDate hoặc EndDate", 400);
      }

      // Validate và chuẩn hóa page và limit
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Tối đa 100 records/page

      const result = await payrollRepository.getInstructorPayroll(
        startDate,
        endDate,
        instructorId,
        pageNum,
        limitNum
      );

      const payrollData = result.data;

      // Format dữ liệu
      const formattedData = payrollData.map((row) => {
        const instructorFeePerSession = Number(row.InstructorFee) || 0; // Lương theo buổi
        const baseSalaryPerHour = instructorFeePerSession / 2; // Lương theo giờ (mỗi buổi = 2 giờ)
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
          BaseSalary: baseSalaryPerHour, // Lương cơ bản (theo giờ) = InstructorFee / 2
          ExpectedTeachingSalary: expectedTeachingSalary, // Lương giảng dạy dự kiến (theo buổi)
          TotalSalaryActual: totalSalaryActual, // Tổng lương thực tế (theo buổi)
          TotalSessionsActual: totalSessionsActual, // Tổng buổi dạy thực tế
          TotalHoursActual: totalHoursActual, // Tổng giờ dạy thực tế (buổi * 2)
          TotalSalaryPlanned: totalSalaryPlanned, // Tổng lương dự kiến (theo buổi)
          TotalSessionsPlanned: totalSessionsPlanned, // Tổng buổi dạy dự kiến
          TotalHoursPlanned: totalHoursPlanned, // Tổng giờ dạy dự kiến (buổi * 2)
        };
      });

      return {
        data: formattedData,
        pagination: result.pagination,
        grandTotals: result.grandTotals || {
          baseSalary: 0,
          expectedTeachingSalary: 0,
          totalSalaryActual: 0,
          totalSessionsActual: 0,
          totalHoursActual: 0,
          totalSalaryPlanned: 0,
          totalSessionsPlanned: 0,
          totalHoursPlanned: 0,
        },
      };
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
