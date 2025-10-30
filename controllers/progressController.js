const progressService = require("../services/progressService");

class ProgressController {
  async getLearnerProgress(req, res) {
    try {
      const { learnerId } = req.params;
      const { courseId } = req.query;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const progress = await progressService.getLearnerProgress(
        learnerId,
        courseId
      );
      return res.json({ progress });
    } catch (error) {
      console.error("Error in getLearnerProgress:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getUnitProgress(req, res) {
    try {
      const { learnerId, courseId } = req.params;

      if (!learnerId || !courseId) {
        return res
          .status(400)
          .json({ message: "Learner ID and Course ID are required" });
      }

      const unitProgress = await progressService.getUnitProgress(
        learnerId,
        courseId
      );
      return res.json({ unitProgress });
    } catch (error) {
      console.error("Error in getUnitProgress:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new ProgressController();
