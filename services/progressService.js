const progressRepository = require("../repositories/progressRepository");

class ProgressService {
  async getLearnerProgress(learnerId, courseId = null) {
    try {
      const progressData = await progressRepository.getLearnerProgress(
        learnerId,
        courseId
      );

      // Format và enrich data
      const formattedProgress = progressData.map((progress) => ({
        ...progress,
        progressBar: {
          percentage: progress.ProgressPercentage,
          completed: progress.AttendedSessions || 0,
          total: progress.TotalSessions || 0,
        },
        status: this.getProgressStatus(progress.ProgressPercentage),
        formattedDuration: `${progress.Duration}h`,
        enrollmentDate: new Date(progress.EnrollmentDate).toLocaleDateString(
          "vi-VN"
        ),
      }));

      return formattedProgress;
    } catch (error) {
      console.error("Error in getLearnerProgress service:", error);
      throw error;
    }
  }

  async getUnitProgress(learnerId, courseId) {
    try {
      const unitProgress = await progressRepository.getUnitProgress(
        learnerId,
        courseId
      );

      // Format data
      const formattedProgress = unitProgress.map((unit) => ({
        ...unit,
        completionStatus:
          unit.CompletionRate >= 100
            ? "completed"
            : unit.CompletionRate >= 50
            ? "in-progress"
            : "not-started",
        progressColor: this.getProgressColor(unit.CompletionRate),
      }));

      return formattedProgress;
    } catch (error) {
      console.error("Error in getUnitProgress service:", error);
      throw error;
    }
  }

  getProgressStatus(percentage) {
    if (percentage >= 100) return "Hoàn thành";
    if (percentage >= 75) return "Gần hoàn thành";
    if (percentage >= 50) return "Đang tiến hành";
    if (percentage >= 25) return "Bắt đầu";
    return "Chưa bắt đầu";
  }

  getProgressColor(percentage) {
    if (percentage >= 100) return "success";
    if (percentage >= 75) return "info";
    if (percentage >= 50) return "warning";
    return "error";
  }
}

module.exports = new ProgressService();
