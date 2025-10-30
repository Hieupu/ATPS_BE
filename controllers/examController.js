const examService = require("../services/examService");

class ExamController {
  async listByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const exams = await examService.listByCourse(courseId);
      return res.json({ exams });
    } catch (e) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getQuestions(req, res) {
    try {
      const { examId } = req.params;
      const questions = await examService.getQuestions(examId);
      return res.json({ questions });
    } catch (e) {
      return res.status(500).json({ message: "Server error" });
    }
  }

  async submit(req, res) {
    try {
      const accId = req.user?.id;
      const { examId } = req.params;
      const { answers } = req.body;
      if (!accId) return res.status(401).json({ message: "Unauthorized" });
      const result = await examService.submitResult(
        accId,
        examId,
        answers || []
      );
      return res.status(201).json({ message: "Submitted", result });
    } catch (e) {
      return res.status(400).json({ message: e.message || "Bad request" });
    }
  }
}

module.exports = new ExamController();
