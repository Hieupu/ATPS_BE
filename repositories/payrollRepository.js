const connectDB = require("../config/db");

class PayrollRepository {
  async getInstructorPayroll(
    startDate,
    endDate,
    instructorId = null,
    page = 1,
    limit = 10
  ) {
    try {
      const db = await connectDB();

      // Mỗi ca 2 tiếng
      const HOURS_PER_SESSION = 2;

      let instructorFilter = "";
      const params = [startDate, endDate];

      if (instructorId) {
        instructorFilter = "AND i.InstructorID = ?";
        params.push(instructorId);
      }

      // Tính offset cho pagination
      const offset = (page - 1) * limit;

      // Query để lấy dữ liệu với pagination
      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.InstructorFee,
          COUNT(DISTINCT s.SessionID) as TotalSessionsPlanned,
          (COUNT(DISTINCT s.SessionID) * ${HOURS_PER_SESSION}) as TotalHoursPlanned,
          COUNT(DISTINCT CASE 
            WHEN a.Status IN ('Present', 'PRESENT') THEN s.SessionID 
            ELSE NULL 
          END) as TotalSessionsActual,
          (COUNT(DISTINCT CASE 
            WHEN a.Status IN ('Present', 'PRESENT') THEN s.SessionID 
            ELSE NULL 
          END) * ${HOURS_PER_SESSION}) as TotalHoursActual,
          -- Lương dự kiến = Tổng buổi dạy dự kiến * InstructorFee 
          (COUNT(DISTINCT s.SessionID) * COALESCE(i.InstructorFee, 0)) as TotalSalaryPlanned,
          -- Lương thực tế = Tổng buổi dạy thực tế * InstructorFee 
          (COUNT(DISTINCT CASE 
            WHEN a.Status IN ('Present', 'PRESENT') THEN s.SessionID 
            ELSE NULL 
          END) * COALESCE(i.InstructorFee, 0)) as TotalSalaryActual
        FROM instructor i
        LEFT JOIN session s ON i.InstructorID = s.InstructorID
          AND s.Date >= ? 
          AND s.Date <= ?
        LEFT JOIN attendance a ON s.SessionID = a.SessionID
        WHERE 1=1 ${instructorFilter}
        GROUP BY i.InstructorID, i.FullName, i.InstructorFee
        HAVING COUNT(DISTINCT s.SessionID) > 0 OR i.InstructorFee > 0
        ORDER BY i.FullName ASC
        LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      // Query để đếm tổng số records (không có LIMIT/OFFSET)
      const [countRows] = await db.query(
        `SELECT COUNT(*) as total
        FROM (
          SELECT i.InstructorID
          FROM instructor i
          LEFT JOIN session s ON i.InstructorID = s.InstructorID
            AND s.Date >= ? 
            AND s.Date <= ?
          LEFT JOIN attendance a ON s.SessionID = a.SessionID
          WHERE 1=1 ${instructorFilter}
          GROUP BY i.InstructorID, i.FullName, i.InstructorFee
          HAVING COUNT(DISTINCT s.SessionID) > 0 OR i.InstructorFee > 0
        ) as subquery`,
        params
      );

      const total = countRows[0]?.total || 0;

      // Query để tính grand totals (tổng của toàn bộ dữ liệu, không phân trang)
      // Sử dụng subquery để tính tổng từ tất cả các giảng viên
      const [grandTotalsRows] = await db.query(
        `SELECT 
          SUM(total_sessions_planned * instructor_fee) as GrandTotalSalaryPlanned,
          SUM(total_sessions_actual * instructor_fee) as GrandTotalSalaryActual,
          SUM(total_sessions_planned) as GrandTotalSessionsPlanned,
          SUM(total_sessions_actual) as GrandTotalSessionsActual,
          SUM(total_sessions_planned * ${HOURS_PER_SESSION}) as GrandTotalHoursPlanned,
          SUM(total_sessions_actual * ${HOURS_PER_SESSION}) as GrandTotalHoursActual,
          SUM(instructor_fee / 2) as GrandTotalBaseSalary,
          SUM(total_sessions_planned * instructor_fee) as GrandExpectedTeachingSalary
        FROM (
          SELECT 
            i.InstructorID,
            i.InstructorFee as instructor_fee,
            COUNT(DISTINCT s.SessionID) as total_sessions_planned,
            COUNT(DISTINCT CASE 
              WHEN a.Status IN ('Present', 'PRESENT') THEN s.SessionID 
              ELSE NULL 
            END) as total_sessions_actual
          FROM instructor i
          LEFT JOIN session s ON i.InstructorID = s.InstructorID
            AND s.Date >= ? 
            AND s.Date <= ?
          LEFT JOIN attendance a ON s.SessionID = a.SessionID
          WHERE 1=1 ${instructorFilter}
          GROUP BY i.InstructorID, i.FullName, i.InstructorFee
          HAVING COUNT(DISTINCT s.SessionID) > 0 OR i.InstructorFee > 0
        ) as instructor_totals`,
        params
      );

      const grandTotals = grandTotalsRows[0] || {};
      const grandTotalSalaryPlanned =
        Number(grandTotals.GrandTotalSalaryPlanned) || 0;
      const grandTotalSalaryActual =
        Number(grandTotals.GrandTotalSalaryActual) || 0;
      const grandTotalSessionsPlanned =
        Number(grandTotals.GrandTotalSessionsPlanned) || 0;
      const grandTotalSessionsActual =
        Number(grandTotals.GrandTotalSessionsActual) || 0;
      const grandTotalHoursPlanned =
        Number(grandTotals.GrandTotalHoursPlanned) || 0;
      const grandTotalHoursActual =
        Number(grandTotals.GrandTotalHoursActual) || 0;
      const grandTotalBaseSalary =
        Number(grandTotals.GrandTotalBaseSalary) || 0;
      const grandExpectedTeachingSalary =
        Number(grandTotals.GrandExpectedTeachingSalary) || 0;

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit),
        },
        grandTotals: {
          baseSalary: grandTotalBaseSalary, // Tổng lương cơ bản (tổng của tất cả InstructorFee/2)
          expectedTeachingSalary: grandExpectedTeachingSalary,
          totalSalaryActual: grandTotalSalaryActual,
          totalSessionsActual: grandTotalSessionsActual,
          totalHoursActual: grandTotalHoursActual,
          totalSalaryPlanned: grandTotalSalaryPlanned,
          totalSessionsPlanned: grandTotalSessionsPlanned,
          totalHoursPlanned: grandTotalHoursPlanned,
        },
      };
    } catch (error) {
      console.error("Database error in getInstructorPayroll:", error);
      throw error;
    }
  }

  async getAllInstructors() {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT InstructorID, FullName 
         FROM instructor 
         ORDER BY FullName ASC`
      );
      return rows;
    } catch (error) {
      console.error("Database error in getAllInstructors:", error);
      throw error;
    }
  }
}

module.exports = new PayrollRepository();
