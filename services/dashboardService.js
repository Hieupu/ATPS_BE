const pool = require("../config/db");
const logService = require("./logService");

const SUCCESS_PAYMENT_STATUSES = [
  "completed",
  "success",
  "successful",
  "paid",
  "done",
];

const buildSuccessStatusCondition = () => {
  const placeholders = SUCCESS_PAYMENT_STATUSES.map(() => "?").join(",");
  return {
    clause: `LOWER(Status) IN (${placeholders})`,
    params: SUCCESS_PAYMENT_STATUSES,
  };
};

class DashboardService {
  // Lấy tổng quan thống kê
  async getDashboardStats(yearParam) {
    try {
      const selectedYear =
        parseInt(yearParam, 10) > 0
          ? parseInt(yearParam, 10)
          : new Date().getFullYear();

      // Tổng số lớp học
      const [classCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM \`class\``
      );

      // Tổng số lớp học theo trạng thái
      const [classByStatus] = await pool.execute(
        `SELECT Status, COUNT(*) as count FROM \`class\` GROUP BY Status`
      );

      // Tổng số học viên
      const [learnerCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM learner`
      );

      // Tổng số học viên mới trong tháng này (dựa trên enrollment đầu tiên)
      const [newLearnersThisMonth] = await pool.execute(
        `SELECT COUNT(DISTINCT e.LearnerID) as total 
         FROM enrollment e
         WHERE MONTH(e.EnrollmentDate) = MONTH(CURRENT_DATE()) 
         AND YEAR(e.EnrollmentDate) = YEAR(CURRENT_DATE())
         AND e.EnrollmentID = (
           SELECT MIN(e2.EnrollmentID) 
           FROM enrollment e2 
           WHERE e2.LearnerID = e.LearnerID
         )`
      );

      // Tổng số giảng viên
      const [instructorCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM instructor`
      );

      // Tổng số nhân viên
      const [staffCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM staff`
      );

      // Tổng số admin
      const [adminCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM admin`
      );

      const successStatusList = SUCCESS_PAYMENT_STATUSES.map((status) =>
        status.toLowerCase()
      );
      const { clause: successStatusCondition, params: successStatusParams } =
        buildSuccessStatusCondition();

      // Doanh thu tháng này
      const [monthlyRevenue] = await pool.execute(
        `SELECT COALESCE(SUM(Amount), 0) as total 
         FROM payment 
         WHERE ${successStatusCondition}
         AND MONTH(PaymentDate) = MONTH(CURRENT_DATE()) 
         AND YEAR(PaymentDate) = YEAR(CURRENT_DATE())`,
        successStatusParams
      );

      // Doanh thu tháng trước
      const [lastMonthRevenue] = await pool.execute(
        `SELECT COALESCE(SUM(Amount), 0) as total 
         FROM payment 
         WHERE ${successStatusCondition}
         AND MONTH(PaymentDate) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
         AND YEAR(PaymentDate) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`,
        successStatusParams
      );

      // Tổng doanh thu
      const [totalRevenue] = await pool.execute(
        `SELECT COALESCE(SUM(Amount), 0) as total 
         FROM payment 
         WHERE ${successStatusCondition}`,
        successStatusParams
      );

      // Hóa đơn theo trạng thái
      const [paymentStatusRows] = await pool.execute(
        `SELECT Status, COUNT(*) as count 
         FROM payment 
         GROUP BY Status`
      );
      const paymentStatusBreakdown = paymentStatusRows.map((row) => ({
        name: row.Status,
        value: Number(row.count) || 0,
      }));
      const successfulInvoices = paymentStatusBreakdown
        .filter((entry) =>
          successStatusList.includes(String(entry.name || "").toLowerCase())
        )
        .reduce((sum, entry) => sum + entry.value, 0);
      console.log(
        "[Dashboard] payment status breakdown:",
        paymentStatusBreakdown
      );

      // Số lượng đăng ký mới trong tháng này
      const [newEnrollmentsThisMonth] = await pool.execute(
        `SELECT COUNT(*) as total FROM enrollment 
         WHERE MONTH(EnrollmentDate) = MONTH(CURRENT_DATE()) 
         AND YEAR(EnrollmentDate) = YEAR(CURRENT_DATE())`
      );

      // Số lượng đăng ký tháng trước
      const [lastMonthEnrollments] = await pool.execute(
        `SELECT COUNT(*) as total FROM enrollment 
         WHERE MONTH(EnrollmentDate) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
         AND YEAR(EnrollmentDate) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`
      );

      // Tỷ lệ hoàn thành (lớp đã kết thúc / tổng số lớp)
      const [completedClasses] = await pool.execute(
        `SELECT COUNT(*) as total FROM \`class\` WHERE Status = 'CLOSE'`
      );

      // Tổng số lớp đã bắt đầu
      const [startedClasses] = await pool.execute(
        `SELECT COUNT(*) as total FROM \`class\` WHERE Status IN ('ON_GOING', 'CLOSE')`
      );

      // Tính phần trăm thay đổi
      const revenueChange =
        lastMonthRevenue[0].total > 0
          ? ((monthlyRevenue[0].total - lastMonthRevenue[0].total) /
              lastMonthRevenue[0].total) *
            100
          : 0;

      const enrollmentChange =
        lastMonthEnrollments[0].total > 0
          ? ((newEnrollmentsThisMonth[0].total -
              lastMonthEnrollments[0].total) /
              lastMonthEnrollments[0].total) *
            100
          : 0;

      const completionRate =
        startedClasses[0].total > 0
          ? (completedClasses[0].total / startedClasses[0].total) * 100
          : 0;

      // So sánh với tháng trước cho lớp học
      const [lastMonthClasses] = await pool.execute(
        `SELECT COUNT(*) as total FROM \`class\` 
         WHERE MONTH(OpendatePlan) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
         AND YEAR(OpendatePlan) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))`
      );

      const classChange =
        lastMonthClasses[0].total > 0
          ? ((classCount[0].total - lastMonthClasses[0].total) /
              lastMonthClasses[0].total) *
            100
          : 0;

      // Tổng số khóa học
      const [courseCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM course`
      );

      // Tổng số khóa học theo trạng thái
      const [courseByStatus] = await pool.execute(
        `SELECT Status, COUNT(*) as count FROM course GROUP BY Status`
      );

      // Tổng số tin tức
      const [newsCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM news`
      );

      // Tổng số tin tức theo trạng thái
      const [newsByStatus] = await pool.execute(
        `SELECT Status, COUNT(*) as count FROM news GROUP BY Status`
      );

      // Tổng số yêu cầu hoàn tiền
      const [refundCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM refundrequest`
      );

      // Tổng số yêu cầu hoàn tiền theo trạng thái
      const [refundByStatus] = await pool.execute(
        `SELECT Status, COUNT(*) as count FROM refundrequest GROUP BY Status`
      );

      // Tổng số promotion
      const [promotionCount] = await pool.execute(
        `SELECT COUNT(*) as total FROM promotion`
      );

      // Tổng số promotion đang hoạt động (trong khoảng thời gian và status = 'active')
      const [activePromotions] = await pool.execute(
        `SELECT COUNT(*) as total FROM promotion 
         WHERE Status = 'active' 
         AND (EndDate IS NULL OR EndDate >= CURRENT_DATE())
         AND StartDate <= CURRENT_DATE()`
      );

      // Số lượng lớp mới theo từng tháng của năm được chọn
      const [classByMonthRows] = await pool.execute(
        `SELECT MONTH(OpendatePlan) as monthNumber, COUNT(*) as total
         FROM \`class\`
         WHERE OpendatePlan IS NOT NULL
           AND YEAR(OpendatePlan) = ?
         GROUP BY MONTH(OpendatePlan)
         ORDER BY monthNumber ASC`,
        [selectedYear]
      );

      const monthTotals = classByMonthRows.reduce((acc, row) => {
        acc[row.monthNumber] = row.total;
        return acc;
      }, {});

      const classNewByMonth = Array.from({ length: 12 }, (_, idx) => ({
        month: `Th${idx + 1}`,
        value: monthTotals[idx + 1] || 0,
      }));

      // Báo cáo chi tiết lớp học (tối đa 10 lớp gần nhất)
      const [classDetailsRows] = await pool.execute(
        `SELECT 
            c.ClassID,
            c.Name,
            c.Status,
            c.OpendatePlan,
            COALESCE(MAX(c.Maxstudent), 0) AS Maxstudent,
            i.FullName AS InstructorName,
            COUNT(DISTINCT e.EnrollmentID) AS Learners,
            COALESCE(SUM(p.Amount), 0) AS Revenue
         FROM \`class\` c
         LEFT JOIN instructor i ON i.InstructorID = c.InstructorID
         LEFT JOIN enrollment e ON e.ClassID = c.ClassID
         LEFT JOIN payment p 
            ON p.EnrollmentID = e.EnrollmentID 
           AND p.Status = 'completed'
         GROUP BY c.ClassID
         ORDER BY c.OpendatePlan DESC
         LIMIT 50`
      );

      const classDetails = classDetailsRows.map((row) => ({
        id: row.ClassID,
        name: row.Name,
        status: row.Status,
        instructor: row.InstructorName,
        startDate: row.OpendatePlan,
        learners: Number(row.Learners) || 0,
        maxStudents: Number(row.Maxstudent) || 0,
        revenue: Number(row.Revenue) || 0,
      }));

      // Giảng viên thu nhập cao
      const [topInstructorRows] = await pool.execute(
        `SELECT base.InstructorID,
                base.FullName,
                base.Type,
                base.activeClasses,
                COALESCE(pay.totalIncome, 0) AS income
         FROM (
           SELECT i.InstructorID,
                  i.FullName,
                  i.Type,
                  COALESCE(SUM(
                    CASE 
                      WHEN c.Status IN ('ACTIVE','ON_GOING') THEN 1 
                      ELSE 0 
                    END
                  ), 0) AS activeClasses
           FROM instructor i
           LEFT JOIN \`class\` c ON c.InstructorID = i.InstructorID
           GROUP BY i.InstructorID
         ) base
         LEFT JOIN (
           SELECT i.InstructorID,
                  COALESCE(SUM(p.Amount), 0) AS totalIncome
           FROM instructor i
           LEFT JOIN \`class\` c ON c.InstructorID = i.InstructorID
           LEFT JOIN enrollment e ON e.ClassID = c.ClassID
           LEFT JOIN payment p 
             ON p.EnrollmentID = e.EnrollmentID 
            AND p.Status = 'completed'
           GROUP BY i.InstructorID
         ) pay ON pay.InstructorID = base.InstructorID
         ORDER BY income DESC
         LIMIT 5`
      );

      let eveningMap = {};
      if (topInstructorRows.length > 0) {
        const instructorIds = topInstructorRows.map((row) => row.InstructorID);
        const placeholders = instructorIds.map(() => "?").join(",");
        const [eveningRows] = await pool.execute(
          `
          SELECT s.InstructorID, COUNT(*) AS slots
          FROM session s
          JOIN timeslot t ON t.TimeslotID = s.TimeslotID
          WHERE t.StartTime >= '18:00:00'
            AND s.InstructorID IN (${placeholders})
          GROUP BY s.InstructorID
        `,
          instructorIds
        );

        eveningRows.forEach((row) => {
          eveningMap[row.InstructorID] = row.slots;
        });
      }

      const topInstructors = topInstructorRows.map((row) => ({
        id: row.InstructorID,
        name: row.FullName,
        type: row.Type,
        activeClasses: Number(row.activeClasses) || 0,
        income: Number(row.income) || 0,
        oneOnOneSlots: eveningMap[row.InstructorID] || 0,
      }));

      console.log(
        "[Dashboard] classNewByMonth (year=%s):",
        selectedYear,
        classNewByMonth
      );
      console.log("[Dashboard] classDetails count:", classDetails.length);
      console.log(
        "[Dashboard] topInstructors sample:",
        topInstructors.slice(0, 3)
      );

      // Tỷ lệ điểm danh giảng viên (dựa trên số session có chấm công)
      const [recentSessions] = await pool.execute(
        `SELECT COUNT(*) as total
         FROM session
         WHERE Date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
           AND CURRENT_DATE()`
      );

      const [sessionsWithAttendance] = await pool.execute(
        `SELECT COUNT(DISTINCT s.SessionID) as total
         FROM session s
         JOIN attendance a ON a.SessionID = s.SessionID
         WHERE s.Date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
           AND CURRENT_DATE()`
      );

      const instructorAttendanceRate =
        recentSessions[0].total > 0
          ? Number(
              (
                (sessionsWithAttendance[0].total / recentSessions[0].total) *
                100
              ).toFixed(1)
            )
          : 0;

      return {
        classes: {
          total: classCount[0].total,
          byStatus: classByStatus.reduce((acc, item) => {
            acc[item.Status] = item.count;
            return acc;
          }, {}),
          change: classChange.toFixed(1),
          newByMonth: classNewByMonth,
          details: classDetails,
          year: selectedYear,
        },
        learners: {
          total: learnerCount[0].total,
          newThisMonth: newLearnersThisMonth[0].total,
          change: enrollmentChange.toFixed(1),
        },
        instructors: {
          total: instructorCount[0].total,
          attendanceRate: instructorAttendanceRate,
          topEarners: topInstructors,
        },
        staff: {
          total: staffCount[0].total,
        },
        admins: {
          total: adminCount[0].total,
        },
        revenue: {
          monthly: monthlyRevenue[0].total,
          total: totalRevenue[0].total,
          change: revenueChange.toFixed(1),
          success: Number(successfulInvoices) || 0,
          statusBreakdown: paymentStatusBreakdown,
        },
        enrollments: {
          thisMonth: newEnrollmentsThisMonth[0].total,
          lastMonth: lastMonthEnrollments[0].total,
          change: enrollmentChange.toFixed(1),
        },
        completionRate: completionRate.toFixed(1),
        courses: {
          total: courseCount[0].total,
          byStatus: courseByStatus.reduce((acc, item) => {
            acc[item.Status] = item.count;
            return acc;
          }, {}),
        },
        news: {
          total: newsCount[0].total,
          byStatus: newsByStatus.reduce((acc, item) => {
            acc[item.Status] = item.count;
            return acc;
          }, {}),
        },
        refunds: {
          total: refundCount[0].total,
          byStatus: refundByStatus.reduce((acc, item) => {
            acc[item.Status] = item.count;
            return acc;
          }, {}),
        },
        promotions: {
          total: promotionCount[0].total,
          active: activePromotions[0].total,
        },
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  }

  // Helper: map một bản ghi log -> activity cho FE
  mapLogToActivity(logRow) {
    const { Action, Timestamp, Detail, Email, username } = logRow;

    const actor = username || Email || "N/A";
    const baseDescription = Detail || `Người thực hiện: ${actor}`;

    switch (Action) {
      case "CREATE_CLASS":
        return {
          type: "class_created",
          title: "Tạo lớp học mới",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "school",
          color: "#667eea",
        };
      case "SEND_CLASS_TO_INSTRUCTOR":
        return {
          type: "class_sent_to_instructor",
          title: "Gửi lớp cho giảng viên",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "school",
          color: "#3b82f6",
        };
      case "APPROVE_CLASS":
        return {
          type: "class_approved",
          title: "Duyệt lớp học",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "school",
          color: "#16a34a",
        };
      case "REJECT_CLASS":
        return {
          type: "class_rejected",
          title: "Từ chối lớp học",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "highlight_off",
          color: "#ef4444",
        };
      case "PUBLISH_CLASS":
        return {
          type: "class_published",
          title: "Xuất bản lớp học",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "publish",
          color: "#8b5cf6",
        };
      case "CREATE_COURSE":
        return {
          type: "course_created",
          title: "Tạo khóa học mới",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "menu_book",
          color: "#6366f1",
        };
      case "UPDATE_COURSE":
        return {
          type: "course_updated",
          title: "Cập nhật khóa học",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "edit",
          color: "#f97316",
        };
      case "DELETE_COURSE":
        return {
          type: "course_deleted",
          title: "Xóa khóa học",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "delete",
          color: "#dc2626",
        };
      case "APPROVE_COURSE":
        return {
          type: "course_approved",
          title: "Duyệt khóa học",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "check_circle",
          color: "#16a34a",
        };
      case "REJECT_COURSE":
        return {
          type: "course_rejected",
          title: "Từ chối khóa học",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "highlight_off",
          color: "#ef4444",
        };
      case "CREATE_NEWS":
        return {
          type: "news_created",
          title: "Tạo tin tức mới",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "article",
          color: "#0ea5e9",
        };
      case "UPDATE_NEWS":
        return {
          type: "news_updated",
          title: "Cập nhật tin tức",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "article",
          color: "#f59e0b",
        };
      case "DELETE_NEWS":
        return {
          type: "news_deleted",
          title: "Xóa tin tức",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "delete",
          color: "#dc2626",
        };
      case "APPROVE_NEWS":
        return {
          type: "news_approved",
          title: "Duyệt tin tức",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "check_circle",
          color: "#16a34a",
        };
      case "REJECT_NEWS":
        return {
          type: "news_rejected",
          title: "Từ chối tin tức",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "highlight_off",
          color: "#ef4444",
        };
      case "CREATE_REFUND_REQUEST":
        return {
          type: "refund_created",
          title: "Tạo yêu cầu hoàn tiền",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "reply",
          color: "#0ea5e9",
        };
      case "APPROVE_REFUND":
        return {
          type: "refund_approved",
          title: "Duyệt hoàn tiền",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "check_circle",
          color: "#16a34a",
        };
      case "REJECT_REFUND":
        return {
          type: "refund_rejected",
          title: "Từ chối hoàn tiền",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "highlight_off",
          color: "#ef4444",
        };
      case "CREATE_PROMOTION":
        return {
          type: "promotion_created",
          title: "Tạo khuyến mãi mới",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "local_offer",
          color: "#f97316",
        };
      case "UPDATE_PROMOTION":
        return {
          type: "promotion_updated",
          title: "Cập nhật khuyến mãi",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "local_offer",
          color: "#6366f1",
        };
      case "DELETE_PROMOTION":
        return {
          type: "promotion_deleted",
          title: "Xóa khuyến mãi",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "delete",
          color: "#dc2626",
        };
      case "CREATE_ENROLLMENT":
        return {
          type: "enrollment",
          title: "Đăng ký mới",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "people",
          color: "#10b981",
        };
      case "CANCEL_ENROLLMENT":
        return {
          type: "enrollment_cancelled",
          title: "Hủy đăng ký",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "cancel",
          color: "#ef4444",
        };
      case "CREATE_PAYMENT":
      case "PAYMENT_COMPLETED":
        return {
          type: "payment",
          title: "Thanh toán thành công",
          description: baseDescription,
          timestamp: Timestamp,
          icon: "attach_money",
          color: "#22c55e",
        };
      default:
        return {
          type: "other",
          title: Action,
          description: baseDescription,
          timestamp: Timestamp,
          icon: "check_circle",
          color: "#6b7280",
        };
    }
  }

  // Lấy hoạt động gần đây từ bảng log
  async getRecentActivities(limit = 10) {
    try {
      // Đảm bảo limit là số nguyên hợp lệ
      let validLimit = 10;
      if (limit !== undefined && limit !== null) {
        const parsed = parseInt(limit, 10);
        if (!isNaN(parsed) && parsed > 0) {
          validLimit = parsed;
        }
      }
      const safeLimit = Math.max(1, validLimit);

      // Lấy log gần đây từ logService (đã join account)
      const logs = await logService.getRecentLogs(safeLimit);

      const activities = logs
        .map((log) => this.mapLogToActivity(log))
        .filter(Boolean)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return activities.slice(0, safeLimit);
    } catch (error) {
      console.error("Error getting recent activities from log:", error);
      throw error;
    }
  }

  // Lấy thống kê theo khoảng thời gian
  async getStatsByDateRange(startDate, endDate) {
    try {
      const { clause: successStatusCondition, params: successStatusParams } =
        buildSuccessStatusCondition();
      const paymentParams = [...successStatusParams, startDate, endDate];
      const [revenue] = await pool.execute(
        `SELECT COALESCE(SUM(Amount), 0) as total 
         FROM payment 
         WHERE ${successStatusCondition}
           AND PaymentDate BETWEEN ? AND ?`,
        paymentParams
      );

      const [paymentStatusRows] = await pool.execute(
        `SELECT Status, COUNT(*) as count
         FROM payment 
         WHERE PaymentDate BETWEEN ? AND ?
         GROUP BY Status`,
        [startDate, endDate]
      );

      const paymentStatusBreakdown = paymentStatusRows.map((row) => ({
        name: row.Status,
        value: Number(row.count) || 0,
      }));

      const successfulInvoices = paymentStatusBreakdown
        .filter((entry) =>
          SUCCESS_PAYMENT_STATUSES.includes(
            String(entry.name || "").toLowerCase()
          )
        )
        .reduce((sum, entry) => sum + entry.value, 0);

      const [enrollments] = await pool.execute(
        `SELECT COUNT(*) as total FROM enrollment 
         WHERE EnrollmentDate BETWEEN ? AND ?`,
        [startDate, endDate]
      );

      const [classes] = await pool.execute(
        `SELECT COUNT(*) as total FROM \`class\` 
         WHERE OpendatePlan BETWEEN ? AND ?`,
        [startDate, endDate]
      );

      const [sessionTotal] = await pool.execute(
        `SELECT COUNT(*) as total
         FROM session
         WHERE Date BETWEEN ? AND ?`,
        [startDate, endDate]
      );

      const [sessionWithAttendance] = await pool.execute(
        `SELECT COUNT(DISTINCT s.SessionID) as total
         FROM session s
         JOIN attendance a ON a.SessionID = s.SessionID
         WHERE s.Date BETWEEN ? AND ?`,
        [startDate, endDate]
      );

      const instructorAttendance =
        sessionTotal[0].total > 0
          ? Number(
              (
                (sessionWithAttendance[0].total / sessionTotal[0].total) *
                100
              ).toFixed(1)
            )
          : 0;

      return {
        revenue: revenue[0].total,
        enrollments: enrollments[0].total,
        classes: classes[0].total,
        instructorAttendance,
        payments: {
          success: successfulInvoices,
          statusBreakdown: paymentStatusBreakdown,
        },
      };
    } catch (error) {
      console.error("Error getting stats by date range:", error);
      throw error;
    }
  }
}

module.exports = new DashboardService();
