const connectDB = require("../config/db");

class ProgressRepository {
  async getLearnerProgress(learnerId, courseId = null) {
    try {
      const db = await connectDB();
      
      let query = `
        SELECT 
          GROUP_CONCAT(DISTINCT e.EnrollmentID ORDER BY e.EnrollmentDate) as EnrollmentIDs,
          MIN(e.EnrollmentDate) as FirstEnrollmentDate,
          MAX(e.EnrollmentDate) as LatestEnrollmentDate,
          GROUP_CONCAT(DISTINCT e.Status ORDER BY e.EnrollmentDate SEPARATOR '|') as EnrollmentStatuses,
          GROUP_CONCAT(DISTINCT e.ClassID ORDER BY e.ClassID) as ClassIDs,
          GROUP_CONCAT(DISTINCT cl.Name ORDER BY cl.Name SEPARATOR ' | ') as ClassNames,
          SUM(DISTINCT cl.Fee) as TotalClassFees,
          MIN(cl.Opendate) as EarliestClassStart,
          MAX(cl.Enddate) as LatestClassEnd,
          
          c.CourseID,
          c.Title as CourseTitle,
          c.Description as CourseDescription,
          c.Image as CourseImage,
          c.Duration as CourseDuration,
          c.Level as CourseLevel,
          
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar,
          
          -- Thống kê chi tiết từng lớp (JSON)
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'ClassID', e2.ClassID,
                'ClassName', cl2.Name,
                'EnrollmentStatus', e2.Status,
                'EnrollmentDate', e2.EnrollmentDate,
                'ClassStart', cl2.Opendate,
                'ClassEnd', cl2.Enddate,
                'TotalAssignments', (
                  SELECT COUNT(DISTINCT ei.InstanceId)
                  FROM exam_instances ei
                  INNER JOIN exam ex ON ei.ExamId = ex.ExamID
                  WHERE ei.ClassId = e2.ClassID
                  AND ex.Type = 'Assignment'
                  AND ex.Status = 'Published'
                  AND (ei.UnitId IS NULL OR ei.UnitId IN (
                    SELECT UnitID FROM unit WHERE CourseID = c.CourseID
                  ))
                ),
                'CompletedAssignments', (
                  SELECT COUNT(DISTINCT s.SubmissionID)
                  FROM submission s
                  INNER JOIN exam_instances ei ON s.ExamID = ei.ExamId
                  INNER JOIN exam ex ON ei.ExamId = ex.ExamID
                  WHERE ei.ClassId = e2.ClassID
                  AND ex.Type = 'Assignment'
                  AND s.LearnerID = e2.LearnerID
                  AND s.Status IN ('submitted', 'late')
                  AND (ei.UnitId IS NULL OR ei.UnitId IN (
                    SELECT UnitID FROM unit WHERE CourseID = c.CourseID
                  ))
                ),
                'AvgScore', (
                  SELECT COALESCE(AVG(s.Score), 0)
                  FROM submission s
                  INNER JOIN exam_instances ei ON s.ExamID = ei.ExamId
                  INNER JOIN exam ex ON ei.ExamId = ex.ExamID
                  WHERE ei.ClassId = e2.ClassID
                  AND ex.Type = 'Assignment'
                  AND s.LearnerID = e2.LearnerID
                  AND s.Score IS NOT NULL
                  AND (ei.UnitId IS NULL OR ei.UnitId IN (
                    SELECT UnitID FROM unit WHERE CourseID = c.CourseID
                  ))
                ),
                'TotalSessions', (
                  SELECT COUNT(*)
                  FROM session se
                  WHERE se.ClassID = e2.ClassID
                ),
                'AttendedSessions', (
                  SELECT COUNT(*)
                  FROM attendance a
                  INNER JOIN session se ON a.SessionID = se.SessionID
                  WHERE se.ClassID = e2.ClassID
                  AND a.LearnerID = e2.LearnerID
                  AND a.Status = 'present'
                ),
                'AbsentSessions', (
                  SELECT COUNT(*)
                  FROM attendance a
                  INNER JOIN session se ON a.SessionID = se.SessionID
                  WHERE se.ClassID = e2.ClassID
                  AND a.LearnerID = e2.LearnerID
                  AND a.Status = 'absent'
                ),
                'TotalStudyMinutes', (
                  SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ts.StartTime, ts.EndTime)), 0)
                  FROM attendance a
                  INNER JOIN session se ON a.SessionID = se.SessionID
                  INNER JOIN timeslot ts ON se.TimeslotID = ts.TimeslotID
                  WHERE se.ClassID = e2.ClassID
                  AND a.LearnerID = e2.LearnerID
                  AND a.Status = 'present'
                ),
                'AttendanceRate', (
                  SELECT CASE 
                    WHEN COUNT(*) > 0 
                    THEN ROUND((SUM(CASE WHEN a.Status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100)
                    ELSE 0 
                  END
                  FROM attendance a
                  INNER JOIN session se ON a.SessionID = se.SessionID
                  WHERE se.ClassID = e2.ClassID
                  AND a.LearnerID = e2.LearnerID
                ),
                'ClassProgress', (
                  SELECT CASE
                    WHEN (
                      SELECT COUNT(DISTINCT ei.InstanceId)
                      FROM exam_instances ei
                      INNER JOIN exam ex ON ei.ExamId = ex.ExamID
                      WHERE ei.ClassId = e2.ClassID
                      AND ex.Type = 'Assignment'
                      AND ex.Status = 'Published'
                      AND (ei.UnitId IS NULL OR ei.UnitId IN (
                        SELECT UnitID FROM unit WHERE CourseID = c.CourseID
                      ))
                    ) > 0
                    THEN ROUND((
                      SELECT COUNT(DISTINCT s.SubmissionID)
                      FROM submission s
                      INNER JOIN exam_instances ei ON s.ExamID = ei.ExamId
                      INNER JOIN exam ex ON ei.ExamId = ex.ExamID
                      WHERE ei.ClassId = e2.ClassID
                      AND ex.Type = 'Assignment'
                      AND s.LearnerID = e2.LearnerID
                      AND s.Status IN ('submitted', 'late')
                      AND (ei.UnitId IS NULL OR ei.UnitId IN (
                        SELECT UnitID FROM unit WHERE CourseID = c.CourseID
                      ))
                    ) / (
                      SELECT COUNT(DISTINCT ei.InstanceId)
                      FROM exam_instances ei
                      INNER JOIN exam ex ON ei.ExamId = ex.ExamID
                      WHERE ei.ClassId = e2.ClassID
                      AND ex.Type = 'Assignment'
                      AND ex.Status = 'Published'
                      AND (ei.UnitId IS NULL OR ei.UnitId IN (
                        SELECT UnitID FROM unit WHERE CourseID = c.CourseID
                      ))
                    ) * 100)
                    ELSE 0
                  END
                )
              )
            )
            FROM enrollment e2
            INNER JOIN class cl2 ON e2.ClassID = cl2.ClassID
            WHERE e2.LearnerID = e.LearnerID
            AND cl2.CourseID = c.CourseID
            AND e2.Status IN ('Enrolled', 'enrolled', 'ACTIVE', 'active')
          ) as ClassesDetailJSON,
          
          -- Đếm tổng số units
          (SELECT COUNT(*) 
           FROM unit u 
           WHERE u.CourseID = c.CourseID 
           AND u.Status = 'VISIBLE') as TotalUnits,
          
          -- Đếm tổng số lessons
          (SELECT COUNT(*) 
           FROM lesson l 
           INNER JOIN unit u ON l.UnitID = u.UnitID
           WHERE u.CourseID = c.CourseID 
           AND l.Status = 'VISIBLE'
           AND u.Status = 'VISIBLE') as TotalLessons,
          
          -- Tính tổng thời lượng lessons (phút)
          (SELECT COALESCE(SUM(l.Duration), 0)
           FROM lesson l 
           INNER JOIN unit u ON l.UnitID = u.UnitID
           WHERE u.CourseID = c.CourseID 
           AND l.Status = 'VISIBLE'
           AND u.Status = 'VISIBLE') as TotalLessonDuration,
          
          -- Đếm tổng số assignments cho khóa học này
          (SELECT COUNT(DISTINCT ei.InstanceId)
           FROM exam_instances ei
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ei.ClassId IN (
             SELECT e3.ClassID 
             FROM enrollment e3
             INNER JOIN class cl3 ON e3.ClassID = cl3.ClassID
             WHERE e3.LearnerID = e.LearnerID
             AND cl3.CourseID = c.CourseID
           )
           AND ex.Type = 'Assignment'
           AND ex.Status = 'Published'
           AND (ei.UnitId IS NULL OR ei.UnitId IN (
             SELECT UnitID FROM unit WHERE CourseID = c.CourseID
           ))) as TotalAssignments,
          
          -- Đếm số assignments đã hoàn thành
          (SELECT COUNT(DISTINCT s.SubmissionID)
           FROM submission s
           INNER JOIN exam_instances ei ON s.ExamID = ei.ExamId
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ex.Type = 'Assignment'
           AND s.LearnerID = e.LearnerID
           AND s.Status IN ('submitted', 'late', 'graded')
           AND ei.ClassId IN (
             SELECT e3.ClassID 
             FROM enrollment e3
             INNER JOIN class cl3 ON e3.ClassID = cl3.ClassID
             WHERE e3.LearnerID = e.LearnerID
             AND cl3.CourseID = c.CourseID
           )
           AND (ei.UnitId IS NULL OR ei.UnitId IN (
             SELECT UnitID FROM unit WHERE CourseID = c.CourseID
           ))) as CompletedAssignments,
          
          -- Điểm trung bình assignments
          (SELECT COALESCE(AVG(s.Score), 0)
           FROM submission s
           INNER JOIN exam_instances ei ON s.ExamID = ei.ExamId
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ex.Type = 'Assignment'
           AND s.LearnerID = e.LearnerID
           AND s.Score IS NOT NULL
           AND ei.ClassId IN (
             SELECT e3.ClassID 
             FROM enrollment e3
             INNER JOIN class cl3 ON e3.ClassID = cl3.ClassID
             WHERE e3.LearnerID = e.LearnerID
             AND cl3.CourseID = c.CourseID
           )
           AND (ei.UnitId IS NULL OR ei.UnitId IN (
             SELECT UnitID FROM unit WHERE CourseID = c.CourseID
           ))) as AvgAssignmentScore,
          
          -- Đếm tổng số sessions (tất cả classes)
          (SELECT COUNT(*) 
           FROM session se 
           INNER JOIN class cl2 ON se.ClassID = cl2.ClassID
           WHERE cl2.CourseID = c.CourseID
           AND cl2.ClassID IN (
             SELECT ClassID FROM enrollment WHERE LearnerID = e.LearnerID
           )) as TotalSessions,
          
          -- Đếm số sessions đã tham gia (tất cả classes)
          (SELECT COUNT(DISTINCT a.SessionID)
           FROM attendance a
           INNER JOIN session se ON a.SessionID = se.SessionID
           INNER JOIN class cl2 ON se.ClassID = cl2.ClassID
           WHERE cl2.CourseID = c.CourseID
           AND a.LearnerID = e.LearnerID
           AND a.Status = 'present') as AttendedSessions,
          
          -- Đếm số sessions vắng mặt (tất cả classes)
          (SELECT COUNT(DISTINCT a.SessionID)
           FROM attendance a
           INNER JOIN session se ON a.SessionID = se.SessionID
           INNER JOIN class cl2 ON se.ClassID = cl2.ClassID
           WHERE cl2.CourseID = c.CourseID
           AND a.LearnerID = e.LearnerID
           AND a.Status = 'absent') as AbsentSessions,
          
          -- Tính tổng thời gian đã học (tất cả classes)
          (SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ts.StartTime, ts.EndTime)), 0)
           FROM attendance a
           INNER JOIN session se ON a.SessionID = se.SessionID
           INNER JOIN timeslot ts ON se.TimeslotID = ts.TimeslotID
           INNER JOIN class cl2 ON se.ClassID = cl2.ClassID
           WHERE cl2.CourseID = c.CourseID
           AND a.LearnerID = e.LearnerID
           AND a.Status = 'present') as TotalStudyMinutes,
          
          -- Đếm số exams (Type = 'Exam')
          (SELECT COUNT(DISTINCT ei.InstanceId)
           FROM exam_instances ei
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ei.ClassId IN (
             SELECT e3.ClassID 
             FROM enrollment e3
             INNER JOIN class cl3 ON e3.ClassID = cl3.ClassID
             WHERE e3.LearnerID = e.LearnerID
             AND cl3.CourseID = c.CourseID
           )
           AND ex.Type = 'Exam'
           AND ex.Status = 'Published'
           AND (ei.UnitId IS NULL OR ei.UnitId IN (
             SELECT UnitID FROM unit WHERE CourseID = c.CourseID
           ))) as TotalExams,
          
          -- Đếm số exams đã hoàn thành
          (SELECT COUNT(DISTINCT er.ResultID)
           FROM examresult er
           INNER JOIN exam_instances ei ON er.ExamID = ei.ExamId
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ex.Type = 'Exam'
           AND ex.Status = 'Published'
           AND er.LearnerID = e.LearnerID
           AND ei.ClassId IN (
             SELECT e3.ClassID 
             FROM enrollment e3
             INNER JOIN class cl3 ON e3.ClassID = cl3.ClassID
             WHERE e3.LearnerID = e.LearnerID
             AND cl3.CourseID = c.CourseID
           )
           AND (ei.UnitId IS NULL OR ei.UnitId IN (
             SELECT UnitID FROM unit WHERE CourseID = c.CourseID
           ))) as CompletedExams,
          
          -- Điểm trung bình exams
          (SELECT COALESCE(AVG(er.Score), 0)
           FROM examresult er
           INNER JOIN exam_instances ei ON er.ExamID = ei.ExamId
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ex.Type = 'Exam'
           AND ex.Status = 'Published'
           AND er.LearnerID = e.LearnerID
           AND ei.ClassId IN (
             SELECT e3.ClassID 
             FROM enrollment e3
             INNER JOIN class cl3 ON e3.ClassID = cl3.ClassID
             WHERE e3.LearnerID = e.LearnerID
             AND cl3.CourseID = c.CourseID
           )
           AND (ei.UnitId IS NULL OR ei.UnitId IN (
             SELECT UnitID FROM unit WHERE CourseID = c.CourseID
           ))) as AvgExamScore,
          
          -- Thông tin payment (tổng từ tất cả enrollments)
          (SELECT SUM(p.Amount)
           FROM payment p 
           INNER JOIN enrollment e2 ON p.EnrollmentID = e2.EnrollmentID
           WHERE e2.LearnerID = e.LearnerID
           AND e2.ClassID IN (
             SELECT cl3.ClassID 
             FROM class cl3 
             WHERE cl3.CourseID = c.CourseID
           )
           AND p.Status = 'completed') as TotalPaidAmount,
          
          (SELECT MIN(p.PaymentDate)
           FROM payment p 
           INNER JOIN enrollment e2 ON p.EnrollmentID = e2.EnrollmentID
           WHERE e2.LearnerID = e.LearnerID
           AND e2.ClassID IN (
             SELECT cl3.ClassID 
             FROM class cl3 
             WHERE cl3.CourseID = c.CourseID
           )
           AND p.Status = 'completed') as FirstPaymentDate,
          
          -- Đếm số classes đã enroll
          COUNT(DISTINCT e.ClassID) as TotalEnrolledClasses
          
        FROM enrollment e
        INNER JOIN class cl ON e.ClassID = cl.ClassID
        INNER JOIN course c ON cl.CourseID = c.CourseID
        INNER JOIN instructor i ON cl.InstructorID = i.InstructorID
        WHERE e.LearnerID = ? 
        AND e.Status IN ('Enrolled', 'enrolled', 'ACTIVE', 'active')
      `;

      const params = [learnerId];

      if (courseId) {
        query += ` AND c.CourseID = ?`;
        params.push(courseId);
      }

      query += ` 
        GROUP BY c.CourseID, c.Title, c.Description, c.Image, c.Duration, c.Level,
                 i.InstructorID, i.FullName, i.ProfilePicture
        ORDER BY LatestEnrollmentDate DESC`;

      const [rows] = await db.query(query, params);

      // Tính toán tiến độ chi tiết
      const results = rows.map((row) => {
        // Tính % hoàn thành lessons (40% trọng số)
        const lessonProgress = row.TotalLessons > 0 && row.TotalSessions > 0
          ? (row.AttendedSessions / row.TotalSessions) * 100 * 0.4
          : 0;

        // Tính % hoàn thành assignments (35% trọng số)
        const assignmentProgress = row.TotalAssignments > 0
          ? (row.CompletedAssignments / row.TotalAssignments) * 100 * 0.35
          : 0;

        // Tính % tham dự sessions (25% trọng số)
        const attendanceProgress = row.TotalSessions > 0
          ? (row.AttendedSessions / row.TotalSessions) * 100 * 0.25
          : 0;

        // Tổng tiến độ
        const totalProgress = Math.min(
          Math.round(lessonProgress + assignmentProgress + attendanceProgress),
          100
        );

        // Tính attendance rate
        const attendanceRate = row.TotalSessions > 0
          ? Math.round((row.AttendedSessions / row.TotalSessions) * 100)
          : 0;

        // Tính completion status
        const isCompleted = totalProgress >= 100 && 
                           row.CompletedAssignments >= row.TotalAssignments &&
                           row.AttendedSessions >= row.TotalSessions * 0.8;

        return {
          ...row,
          ProgressPercentage: totalProgress,
          AttendanceRate: attendanceRate,
          CompletionRate: {
            lessons: row.TotalLessons > 0 && row.TotalSessions > 0 
              ? Math.round((row.AttendedSessions / row.TotalSessions) * 100) 
              : 0,
            assignments: row.TotalAssignments > 0 
              ? Math.round((row.CompletedAssignments / row.TotalAssignments) * 100) 
              : 0,
            exams: row.TotalExams > 0 
              ? Math.round((row.CompletedExams / row.TotalExams) * 100) 
              : 0,
          },
          TotalStudyHours: Math.round((row.TotalStudyMinutes / 60) * 10) / 10,
          TotalLessonHours: Math.round((row.TotalLessonDuration / 60) * 10) / 10,
          IsCompleted: isCompleted,
          RemainingAssignments: Math.max(0, row.TotalAssignments - row.CompletedAssignments),
          RemainingExams: Math.max(0, row.TotalExams - row.CompletedExams),
          AvgScore: row.AvgAssignmentScore > 0 && row.AvgExamScore > 0 
            ? Math.round(((row.AvgAssignmentScore + row.AvgExamScore) / 2) * 10) / 10
            : row.AvgAssignmentScore > 0 
              ? Math.round(row.AvgAssignmentScore * 10) / 10
              : row.AvgExamScore > 0 
                ? Math.round(row.AvgExamScore * 10) / 10
                : 0,
        };
      });

      return results;
    } catch (error) {
      console.error("Database error in getLearnerProgress:", error);
      throw error;
    }
  }

  async getCourseDetailProgress(learnerId, courseId) {
    try {
      const db = await connectDB();
      
      const query = `
        SELECT 
          u.UnitID,
          u.Title as UnitTitle,
          u.Description as UnitDescription,
          u.Duration as UnitDuration,
          u.OrderIndex as UnitOrder,
          
          COUNT(DISTINCT l.LessonID) as TotalLessons,
          COALESCE(SUM(l.Duration), 0) as TotalLessonDuration,
          
          -- Đếm assignments trong unit
          (SELECT COUNT(DISTINCT ei.InstanceId)
           FROM exam_instances ei
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ei.UnitId = u.UnitID
           AND ex.Type = 'Assignment'
           AND ex.Status = 'Published'
           AND ei.ClassId IN (
             SELECT e.ClassID 
             FROM enrollment e
             INNER JOIN class cl ON e.ClassID = cl.ClassID
             WHERE cl.CourseID = u.CourseID
             AND e.LearnerID = ?
           )) as TotalAssignments,
          
          (SELECT COUNT(DISTINCT s.SubmissionID)
           FROM submission s
           INNER JOIN exam_instances ei ON s.ExamID = ei.ExamId
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ei.UnitId = u.UnitID
           AND ex.Type = 'Assignment'
           AND ex.Status = 'Published'
           AND s.LearnerID = ?
           AND s.Status IN ('submitted', 'late')
           AND ei.ClassId IN (
             SELECT e.ClassID 
             FROM enrollment e
             INNER JOIN class cl ON e.ClassID = cl.ClassID
             WHERE cl.CourseID = u.CourseID
             AND e.LearnerID = ?
           )) as CompletedAssignments,
          
          (SELECT COALESCE(AVG(s.Score), 0)
           FROM submission s
           INNER JOIN exam_instances ei ON s.ExamID = ei.ExamId
           INNER JOIN exam ex ON ei.ExamId = ex.ExamID
           WHERE ei.UnitId = u.UnitID
           AND ex.Type = 'Assignment'
           AND ex.Status = 'Published'
           AND s.LearnerID = ?
           AND s.Score IS NOT NULL
           AND ei.ClassId IN (
             SELECT e.ClassID 
             FROM enrollment e
             INNER JOIN class cl ON e.ClassID = cl.ClassID
             WHERE cl.CourseID = u.CourseID
             AND e.LearnerID = ?
           )) as AvgUnitScore
          
        FROM unit u
        LEFT JOIN lesson l ON u.UnitID = l.UnitID AND l.Status = 'VISIBLE'
        WHERE u.CourseID = ?
        AND u.Status = 'VISIBLE'
        GROUP BY u.UnitID, u.Title, u.Description, u.Duration, u.OrderIndex, u.CourseID
        ORDER BY u.OrderIndex ASC
      `;

      const [rows] = await db.query(query, [
        learnerId, learnerId, learnerId, learnerId, learnerId, courseId
      ]);

      const results = rows.map((row) => {
        const unitProgress = row.TotalAssignments > 0
          ? Math.round((row.CompletedAssignments / row.TotalAssignments) * 100)
          : (row.TotalLessons > 0 ? 0 : 100);

        return {
          ...row,
          UnitProgress: unitProgress,
          IsCompleted: unitProgress >= 100,
          TotalLessonHours: Math.round((row.TotalLessonDuration / 60) * 10) / 10,
        };
      });

      return results;
    } catch (error) {
      console.error("Database error in getCourseDetailProgress:", error);
      throw error;
    }
  }

  async getOverallStatistics(learnerId) {
    try {
      const db = await connectDB();
      
      const query = `
        SELECT 
          COUNT(DISTINCT e.EnrollmentID) as TotalEnrollments,
          COUNT(DISTINCT c.CourseID) as TotalCourses,
          
          COALESCE(SUM(
            CASE WHEN e.Status IN ('Enrolled', 'enrolled', 'ACTIVE', 'active') THEN 1 ELSE 0 END
          ), 0) as ActiveCourses,
          
          COALESCE(SUM(
            TIMESTAMPDIFF(MINUTE, ts.StartTime, ts.EndTime)
          ), 0) as TotalMinutesLearned,
          
          COUNT(DISTINCT s.SubmissionID) as TotalSubmissions,
          
          COALESCE(AVG(s.Score), 0) as OverallAvgScore,
          
          COUNT(DISTINCT a.AttendanceID) as TotalAttendances,
          
          COUNT(DISTINCT er.ResultID) as TotalExamsTaken
          
        FROM enrollment e
        INNER JOIN class cl ON e.ClassID = cl.ClassID
        INNER JOIN course c ON cl.CourseID = c.CourseID
        LEFT JOIN attendance a ON a.LearnerID = e.LearnerID AND a.Status = 'present'
        LEFT JOIN session se ON a.SessionID = se.SessionID
        LEFT JOIN timeslot ts ON se.TimeslotID = ts.TimeslotID
        LEFT JOIN submission s ON s.LearnerID = e.LearnerID
        LEFT JOIN examresult er ON er.LearnerID = e.LearnerID
        WHERE e.LearnerID = ?
      `;

      const [rows] = await db.query(query, [learnerId]);
      
      if (rows.length > 0) {
        const stats = rows[0];
        return {
          ...stats,
          TotalHoursLearned: Math.round((stats.TotalMinutesLearned / 60) * 10) / 10,
          CompletionRate: stats.TotalCourses > 0 
            ? Math.round(((stats.TotalCourses - stats.ActiveCourses) / stats.TotalCourses) * 100)
            : 0,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Database error in getOverallStatistics:", error);
      throw error;
    }
  }
}

module.exports = new ProgressRepository();