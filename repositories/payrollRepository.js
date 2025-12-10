const connectDB = require("../config/db");

class PayrollRepository {
  async getInstructorPayroll(startDate, endDate, instructorId = null) {
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

      const [rows] = await db.query(
        `SELECT 
          i.InstructorID,
          i.FullName,
          i.InstructorFee,
          -- Tổng buổi dạy dự kiến (tất cả sessions trong khoảng thời gian)
          COUNT(DISTINCT s.SessionID) as TotalSessionsPlanned,
          -- Tổng giờ dạy dự kiến (mỗi ca 2 tiếng)
          (COUNT(DISTINCT s.SessionID) * ${HOURS_PER_SESSION}) as TotalHoursPlanned,
          -- Tổng buổi dạy thực tế (sessions có attendance Present)
          COUNT(DISTINCT CASE 
            WHEN a.Status IN ('Present', 'PRESENT') THEN s.SessionID 
            ELSE NULL 
          END) as TotalSessionsActual,
          -- Tổng giờ dạy thực tế (mỗi ca 2 tiếng)
          (COUNT(DISTINCT CASE 
            WHEN a.Status IN ('Present', 'PRESENT') THEN s.SessionID 
            ELSE NULL 
          END) * ${HOURS_PER_SESSION}) as TotalHoursActual,
          -- Lương dự kiến = Tổng giờ dạy dự kiến * InstructorFee (theo giờ)
          ((COUNT(DISTINCT s.SessionID) * ${HOURS_PER_SESSION}) * COALESCE(i.InstructorFee, 0)) as TotalSalaryPlanned,
          -- Lương thực tế = Tổng giờ dạy thực tế * InstructorFee (theo giờ)
          ((COUNT(DISTINCT CASE 
            WHEN a.Status IN ('Present', 'PRESENT') THEN s.SessionID 
            ELSE NULL 
          END) * ${HOURS_PER_SESSION}) * COALESCE(i.InstructorFee, 0)) as TotalSalaryActual
        FROM instructor i
        LEFT JOIN session s ON i.InstructorID = s.InstructorID
          AND s.Date >= ? 
          AND s.Date <= ?
        LEFT JOIN attendance a ON s.SessionID = a.SessionID
        WHERE 1=1 ${instructorFilter}
        GROUP BY i.InstructorID, i.FullName, i.InstructorFee
        HAVING COUNT(DISTINCT s.SessionID) > 0 OR i.InstructorFee > 0
        ORDER BY i.FullName ASC`,
        params
      );
      return rows;
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
