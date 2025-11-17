const progressService = require("../services/progressService");

class ProgressController {
  async getLearnerProgress(req, res) {
    try {
      const { learnerId } = req.params;
      const { courseId } = req.query;

      if (!learnerId) {
        return res.status(400).json({ 
          success: false,
          message: "Learner ID is required" 
        });
      }

      const progress = await progressService.getLearnerProgress(
        learnerId,
        courseId
      );

      return res.json({ 
        success: true,
        data: progress,
        count: progress.length
      });
    } catch (error) {
      console.error("Error in getLearnerProgress:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch learner progress",
        error: error.message 
      });
    }
  }

  async getCourseDetailProgress(req, res) {
    try {
      const { learnerId, courseId } = req.params;

      if (!learnerId || !courseId) {
        return res.status(400).json({ 
          success: false,
          message: "Learner ID and Course ID are required" 
        });
      }

      const unitProgress = await progressService.getCourseDetailProgress(
        learnerId,
        courseId
      );

      return res.json({ 
        success: true,
        data: unitProgress,
        count: unitProgress.length
      });
    } catch (error) {
      console.error("Error in getCourseDetailProgress:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch course detail progress",
        error: error.message 
      });
    }
  }

  async getOverallStatistics(req, res) {
    try {
      const { learnerId } = req.params;

      if (!learnerId) {
        return res.status(400).json({ 
          success: false,
          message: "Learner ID is required" 
        });
      }

      const statistics = await progressService.getOverallStatistics(learnerId);

      if (!statistics) {
        return res.status(404).json({ 
          success: false,
          message: "No statistics found for this learner" 
        });
      }

      return res.json({ 
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error("Error in getOverallStatistics:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch overall statistics",
        error: error.message 
      });
    }
  }
}

module.exports = new ProgressController();