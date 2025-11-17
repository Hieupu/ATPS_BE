const progressRepository = require("../repositories/progressRepository");

class ProgressService {
  async getLearnerProgress(learnerId, courseId = null) {
    try {
      const progressData = await progressRepository.getLearnerProgress(
        learnerId,
        courseId
      );
      console.log("progressData", progressData)

      const formattedProgress = progressData.map((progress) => {
        const status = this.getProgressStatus(progress.ProgressPercentage);
        const performanceLevel = this.getPerformanceLevel(progress.AvgScore);

        // Parse thông tin enrollments
        const enrollmentIds = progress.EnrollmentIDs ? progress.EnrollmentIDs.split(',') : [];
        const classIds = progress.ClassIDs ? progress.ClassIDs.split(',') : [];
        const classNames = progress.ClassNames ? progress.ClassNames.split(' | ') : [];
        const enrollmentStatuses = progress.EnrollmentStatuses ? progress.EnrollmentStatuses.split('|') : [];

        // Parse thống kê từng lớp (JSON array)
        let classesDetail = [];
        try {
          if (progress.ClassesDetailJSON) {
            const parsedClasses = typeof progress.ClassesDetailJSON === 'string' 
              ? JSON.parse(progress.ClassesDetailJSON) 
              : progress.ClassesDetailJSON;
            
            classesDetail = parsedClasses.map(cls => ({
              classId: cls.ClassID,
              name: cls.ClassName,
              status: cls.EnrollmentStatus,
              progress: cls.ClassProgress || 0,
              attendanceRate: cls.AttendanceRate || 0,
              performanceLevel: this.getPerformanceLevel(cls.AvgScore || 0),
              stats: {
                totalAssignments: cls.TotalAssignments || 0,
                completedAssignments: cls.CompletedAssignments || 0,
                remainingAssignments: Math.max(0, (cls.TotalAssignments || 0) - (cls.CompletedAssignments || 0)),
                totalSessions: cls.TotalSessions || 0,
                attendedSessions: cls.AttendedSessions || 0,
                absentSessions: cls.AbsentSessions || 0,
                totalStudyHours: Math.round(((cls.TotalStudyMinutes || 0) / 60) * 10) / 10,
                avgScore: Math.round((cls.AvgScore || 0) * 10) / 10,
              },
              dates: {
                enrollmentDate: cls.EnrollmentDate,
                classStart: cls.ClassStart,
                classEnd: cls.ClassEnd,
              },
            }));
          }
        } catch (e) {
          console.error("Error parsing ClassesDetailJSON:", e, progress.ClassesDetailJSON);
        }

        return {
          enrollmentIds: enrollmentIds,
          courseId: progress.CourseID,
          classIds: classIds,
          totalEnrolledClasses: progress.TotalEnrolledClasses || classIds.length,
          
          // Course Info
          course: {
            id: progress.CourseID,
            title: progress.CourseTitle,
            description: progress.CourseDescription,
            image: progress.CourseImage,
            duration: progress.CourseDuration,
            level: progress.CourseLevel,
          },
          
          // Class Info - multiple classes
          classes: classIds.map((id, index) => ({
            id: id,
            name: classNames[index] || 'N/A',
            status: enrollmentStatuses[index] || 'N/A',
          })),
          
          // Chi tiết từng lớp
          classesDetail: classesDetail,
          
          classInfo: {
            names: classNames.join(', '),
            count: classIds.length,
            totalFees: progress.TotalClassFees,
            earliestStart: progress.EarliestClassStart,
            latestEnd: progress.LatestClassEnd,
          },
          
          // Instructor Info
          instructor: {
            id: progress.InstructorID,
            name: progress.InstructorName,
            avatar: progress.InstructorAvatar,
          },
          
          // Progress Overview (tổng hợp từ tất cả classes)
          progress: {
            overall: progress.ProgressPercentage,
            lessons: progress.CompletionRate.lessons,
            assignments: progress.CompletionRate.assignments,
            exams: progress.CompletionRate.exams,
            attendance: progress.AttendanceRate,
          },
          
          // Statistics (tổng hợp)
          stats: {
            totalUnits: progress.TotalUnits,
            totalLessons: progress.TotalLessons,
            totalLessonHours: progress.TotalLessonHours,
            
            totalAssignments: progress.TotalAssignments,
            completedAssignments: progress.CompletedAssignments,
            remainingAssignments: progress.RemainingAssignments,
            
            totalExams: progress.TotalExams,
            completedExams: progress.CompletedExams,
            remainingExams: progress.RemainingExams,
            
            totalSessions: progress.TotalSessions,
            attendedSessions: progress.AttendedSessions,
            absentSessions: progress.AbsentSessions,
            
            totalStudyHours: progress.TotalStudyHours,
            avgScore: progress.AvgScore,
            avgAssignmentScore: Math.round(progress.AvgAssignmentScore * 10) / 10,
            avgExamScore: Math.round(progress.AvgExamScore * 10) / 10,
          },
          
          // Status & Flags
          status: {
            enrollmentStatuses: enrollmentStatuses,
            progress: status,
            performance: performanceLevel,
            isCompleted: progress.IsCompleted,
          },
          
          // Dates
          dates: {
            firstEnrolled: progress.FirstEnrollmentDate,
            latestEnrolled: progress.LatestEnrollmentDate,
            classStart: progress.EarliestClassStart,
            classEnd: progress.LatestClassEnd,
            firstPayment: progress.FirstPaymentDate,
          },
          
          // Payment
          payment: {
            totalAmount: progress.TotalPaidAmount,
            firstPaymentDate: progress.FirstPaymentDate,
          },
        };
      });

      return formattedProgress;
    } catch (error) {
      console.error("Error in getLearnerProgress service:", error);
      throw error;
    }
  }

  async getCourseDetailProgress(learnerId, courseId) {
    try {
      const unitProgress = await progressRepository.getCourseDetailProgress(
        learnerId,
        courseId
      );

      return unitProgress.map((unit) => ({
        unitId: unit.UnitID,
        title: unit.UnitTitle,
        description: unit.UnitDescription,
        order: unit.UnitOrder,
        duration: unit.UnitDuration,
        
        progress: unit.UnitProgress,
        isCompleted: unit.IsCompleted,
        
        stats: {
          totalLessons: unit.TotalLessons,
          totalLessonHours: unit.TotalLessonHours,
          totalAssignments: unit.TotalAssignments,
          completedAssignments: unit.CompletedAssignments,
          avgScore: Math.round(unit.AvgUnitScore * 10) / 10,
        },
      }));
    } catch (error) {
      console.error("Error in getCourseDetailProgress service:", error);
      throw error;
    }
  }

  async getOverallStatistics(learnerId) {
    try {
      const stats = await progressRepository.getOverallStatistics(learnerId);
      
      if (!stats) {
        return null;
      }

      return {
        totalEnrollments: stats.TotalEnrollments,
        totalCourses: stats.TotalCourses,
        activeCourses: stats.ActiveCourses,
        completedCourses: stats.TotalCourses - stats.ActiveCourses,
        totalHoursLearned: stats.TotalHoursLearned,
        totalSubmissions: stats.TotalSubmissions,
        totalExamsTaken: stats.TotalExamsTaken,
        totalAttendances: stats.TotalAttendances,
        overallAvgScore: Math.round(stats.OverallAvgScore * 10) / 10,
        completionRate: stats.CompletionRate,
      };
    } catch (error) {
      console.error("Error in getOverallStatistics service:", error);
      throw error;
    }
  }

  getProgressStatus(percentage) {
    if (percentage === 0) return "Chưa bắt đầu";
    if (percentage < 25) return "Mới bắt đầu";
    if (percentage < 50) return "Đang học";
    if (percentage < 75) return "Tiến triển tốt";
    if (percentage < 100) return "Gần hoàn thành";
    return "Hoàn thành";
  }

  getPerformanceLevel(avgScore) {
    if (avgScore >= 9) return "Xuất sắc";
    if (avgScore >= 8) return "Giỏi";
    if (avgScore >= 7) return "Khá";
    if (avgScore >= 6) return "Trung bình";
    if (avgScore >= 5) return "Yếu";
    return "Kém";
  }

  getProgressColor(percentage) {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "error";
  }
}

module.exports = new ProgressService();