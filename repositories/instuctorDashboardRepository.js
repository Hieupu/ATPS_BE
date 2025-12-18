const connectDB = require("../config/db");

class InstructorDashboardRepository {
  async getCoursesByInstructorId(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
          CourseID,
          Title
       FROM course 
       WHERE InstructorID = ? AND Status = 'PUBLISHED'`,
      [instructorId]
    );
    return rows.map((row) => ({
      courseId: row.CourseID,
      courseName: row.Title,
      status: row.Status,
    }));
  }

  // 2. GET CLASSES (Theo InstructorID)
  async getClassesByInstructorId(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
          ClassID,
          Name,
          CourseID,
          Status
       FROM class 
       WHERE InstructorID = ?`,
      [instructorId]
    );

    return rows.map((row) => ({
      classId: row.ClassID,
      className: row.Name,
      courseId: row.CourseID,
      status: row.Status,
    }));
  }

  // 3. GET LEARNERS
  async getLearnersByInstructorId(instructorId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT DISTINCT 
          l.LearnerID,
          l.FullName,
          a.Email
       FROM learner l
       JOIN account a ON l.AccID = a.AccID
       JOIN enrollment e ON l.LearnerID = e.LearnerID
       JOIN class c ON e.ClassID = c.ClassID
       WHERE c.InstructorID = ?`,
      [instructorId]
    );

    return rows.map((row) => ({
      learnerId: row.LearnerID,
      fullName: row.FullName,
      email: row.Email,
    }));
  }

  // 4. GET ENROLLMENTS (Học viên đăng ký vào các lớp của Instructor này)
  async getEnrollmentsByInstructorId(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
          e.ClassID,
          e.LearnerID
       FROM enrollment e
       JOIN class c ON e.ClassID = c.ClassID
       WHERE c.InstructorID = ?`,
      [instructorId]
    );

    return rows.map((row) => ({
      classId: row.ClassID,
      learnerId: row.LearnerID,
    }));
  }

  // 5. GET SESSIONS (Các buổi học do Instructor này dạy)
  async getSessionsByInstructorId(
    instructorId,
    startDate = null,
    endDate = null,
    limit = null
  ) {
    const db = await connectDB();

    let sql = `SELECT 
          s.SessionID, s.ClassID, s.Title,
          DATE_FORMAT(s.Date, '%Y-%m-%d') as SessionDate, 
          TIME_FORMAT(t.StartTime, '%H:%i') as StartTime, 
          TIME_FORMAT(t.EndTime, '%H:%i') as EndTime     
        FROM session s
        JOIN timeslot t ON s.TimeslotID = t.TimeslotID
        WHERE s.InstructorID = ?`;

    const params = [instructorId];

    if (startDate && endDate) {
      sql += ` AND s.Date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    sql += ` ORDER BY s.Date ASC`;

    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
    }

    const [rows] = await db.query(sql, params);

    return rows.map((row) => ({
      sessionId: row.SessionID,
      classId: row.ClassID,
      sessionTitle: row.Title,
      sessionDate: row.SessionDate,
      startTime: row.StartTime,
      endTime: row.EndTime,
    }));
  }

  // 6. GET ATTENDANCE (Tính tỷ lệ tham gia của học viên trong các lớp của Instructor)
  async getAttendanceByInstructorId(instructorId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT 
          a.LearnerID,
          s.ClassID,
          ROUND((SUM(CASE WHEN a.Status = 'PRESENT' THEN 1 ELSE 0 END) / COUNT(*)) * 100) as AttendanceRate
       FROM attendance a
       JOIN session s ON a.SessionID = s.SessionID
       WHERE s.InstructorID = ?
       GROUP BY a.LearnerID, s.ClassID`,
      [instructorId]
    );

    return rows.map((row) => ({
      learnerId: row.LearnerID,
      classId: row.ClassID,
      attendanceRate: Number(row.AttendanceRate),
    }));
  }

  // 7. GET EXAMS/ASSIGNMENTS (Bài tập/Kiểm tra của Instructor này)
  async getExamsByInstructorId(instructorId, limit) {
    const db = await connectDB();

    let sql = `
  SELECT
    e.ExamID,
    e.Title,
    e.Type,
    c.ClassID,
    c.Name AS ClassName,
    (SELECT COUNT(*) FROM enrollment en WHERE en.ClassID = c.ClassID) AS TotalLearners,

    (SELECT COUNT(DISTINCT LearnerID) FROM (
        SELECT LearnerID, ExamID FROM submission
        UNION
        SELECT LearnerID, ExamID FROM examresult
    ) AS attempts WHERE attempts.ExamID = e.ExamID) AS SubmittedCount,

    (SELECT COUNT(DISTINCT er.LearnerID) FROM examresult er WHERE er.ExamID = e.ExamID) AS GradedCount,
    DATE_FORMAT(ei.EndTime, '%Y-%m-%d') AS DueDate
  FROM exam e
  JOIN exam_instances ei ON e.ExamID = ei.ExamId
  JOIN class c ON ei.ClassId = c.ClassID
  WHERE e.InstructorID = ?
  GROUP BY e.ExamID, e.Title, e.Type, c.ClassID, c.Name, ei.EndTime
  ORDER BY ei.EndTime ASC
`;

    const params = [instructorId];
    if (Number.isInteger(limit)) {
      sql += ` LIMIT ?`;
      params.push(limit);
    }

    const [rows] = await db.query(sql, params);

    return rows.map((row) => {
      const total = Number(row.TotalLearners) || 0;
      const graded = Number(row.GradedCount) || 0;
      const submitted = Number(row.SubmittedCount) || 0;

      return {
        examId: row.ExamID,
        title: row.Title,
        type: row.Type?.toUpperCase() || "EXAM",
        classId: row.ClassID,
        className: row.ClassName,
        dueDate: row.DueDate,
        totalLearners: total,
        submittedCount: submitted,
        gradedCount: graded,

        ungradedCount: Math.max(0, submitted - graded),
        progress: total > 0 ? Math.round((graded / total) * 100) : 0,
        status: submitted > 0 && submitted === graded ? "Đã chấm" : "Chưa chấm",
      };
    });
  }

  // 8. GET SUBMISSIONS
  async getSubmissionsByInstructorId(instructorId, limit = null) {
    const db = await connectDB();

    let sql = `SELECT 
        s.SubmissionID, s.ExamID, s.LearnerID,
        DATE_FORMAT(s.SubmissionDate, '%Y-%m-%d') as SubmittedAt,
        er.Score
      FROM submission s
      JOIN exam e ON s.ExamID = e.ExamID
      LEFT JOIN examresult er ON s.ExamID = er.ExamID AND s.LearnerID = er.LearnerID
      WHERE e.InstructorID = ?
      ORDER BY s.SubmissionDate DESC`;

    const params = [instructorId];

    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
    }

    const [rows] = await db.query(sql, params);

    return rows.map((row) => ({
      submissionId: row.SubmissionID,
      examId: row.ExamID,
      learnerId: row.LearnerID,
      submittedAt: row.SubmittedAt,
      score: row.Score !== null ? Number(row.Score) : null,
    }));
  }

  // 9. GET EXAM RESULTS
  async getExamResultsByInstructorId(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      `SELECT 
        er.ExamID as examId,
        er.LearnerID as learnerId,
        er.Score as averageScore,
        DATE_FORMAT(er.SubmissionDate, '%Y-%m-%d') as submittedAt
     FROM examresult er
     JOIN exam e ON er.ExamID = e.ExamID
     WHERE e.InstructorID = ?
     ORDER BY er.SubmissionDate ASC`,
      [instructorId]
    );

    return rows.map((row) => ({
      examId: row.examId,
      learnerId: row.learnerId,
      averageScore: Number(row.averageScore),
      submittedAt: row.submittedAt,
    }));
  }

  // 10. GET NOTIFICATIONS (Thông báo gửi đến tài khoản của Instructor)
  async getNotificationsByInstructorId(instructorId, limit = null) {
    const db = await connectDB();

    let sql = `SELECT 
          n.NotificationID, n.Type, n.Content, n.Status
        FROM notification n
        JOIN instructor i ON n.AccID = i.AccID
        WHERE i.InstructorID = ?
        ORDER BY n.NotificationID DESC`;

    const params = [instructorId];

    if (limit) {
      sql += ` LIMIT ?`;
      params.push(limit);
    }

    const [rows] = await db.query(sql, params);

    return rows.map((row) => ({
      notificationId: row.NotificationID,
      title: row.Type,
      content: row.Content,
      isRead: row.Status, // Lưu ý: FE có thể cần boolean, ở đây trả về string gốc
    }));
  }

  // 11. GET SESSION CHANGE REQUESTS (Yêu cầu đổi lịch dạy của Instructor)
  async getSessionChangeRequestsByInstructorId(instructorId, limit) {
    const db = await connectDB();

    let sql = `
    SELECT 
      scr.RequestID,
      c.Name AS ClassName,
      scr.NewDate,
      scr.Reason,
      scr.Status
    FROM session_change_request scr
    JOIN session s ON scr.SessionID = s.SessionID
    JOIN class c ON s.ClassID = c.ClassID
    WHERE scr.InstructorID = ?
    ORDER BY scr.RequestID DESC
    LIMIT ?
  `;

    const [rows] = await db.query(sql, [instructorId, limit]);

    return rows.map((row) => ({
      requestId: row.RequestID,
      className: row.ClassName,
      sessionDate: new Date(row.NewDate).toISOString().split("T")[0],
      reason: row.Reason,
      status: row.Status,
    }));
  }

  async getMissedAttendanceAlerts(instructorId) {
    const db = await connectDB();

    const [rows] = await db.query(
      `SELECT 
          s.SessionID,
          c.Name AS ClassName,
          s.Date,
          ts.StartTime,
          ts.EndTime
       FROM session s
       JOIN class c ON s.ClassID = c.ClassID
       JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
       WHERE s.InstructorID = ?
       AND NOT EXISTS (
           SELECT 1 
           FROM attendance a 
           WHERE a.SessionID = s.SessionID
       )
       AND (
         (s.Date = CURDATE() AND HOUR(NOW()) >= 15)
         OR
         (s.Date = SUBDATE(CURDATE(), 1))
       )`,
      [instructorId]
    );

    return rows.map((row) => {
      const dateStr = new Date(row.Date).toLocaleDateString("vi-VN");

      const timeStr = `${row.StartTime.slice(0, 5)} - ${row.EndTime.slice(
        0,
        5
      )}`;

      return {
        type: "attendance_warning",
        sessionId: row.SessionID,
        className: row.ClassName,
        date: new Date(row.Date).toISOString().split("T")[0],
        displayDate: dateStr,
        slotTime: timeStr,
        message: `Cảnh báo: Lớp ${row.ClassName} (${timeStr} ngày ${dateStr}) chưa được điểm danh.`,
      };
    });
  }
}
module.exports = new InstructorDashboardRepository();
