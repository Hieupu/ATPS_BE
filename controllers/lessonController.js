const lessonService = require("../services/lessonService");

const lessonController = {
  // Tạo bài học mới
  createLesson: async (req, res) => {
    try {
      const { Title, Description, FileURL, Type, UnitID } = req.body;

      // Validation
      if (!Title || !UnitID) {
        return res.status(400).json({
          success: false,
          message: "Title và UnitID là bắt buộc",
        });
      }

      const lessonData = {
        Title,
        Description,
        FileURL,
        Type: Type || "other",
        UnitID,
      };

      const newLesson = await lessonService.createLesson(lessonData);

      res.status(201).json({
        success: true,
        message: "Tạo bài học thành công",
        data: newLesson,
      });
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo bài học",
        error: error.message,
      });
    }
  },

  // Lấy tất cả bài học
  getAllLessons: async (req, res) => {
    try {
      const lessons = await lessonService.getAllLessons();

      res.json({
        success: true,
        message: "Lấy danh sách bài học thành công",
        data: lessons,
      });
    } catch (error) {
      console.error("Error getting lessons:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách bài học",
        error: error.message,
      });
    }
  },

  // Lấy bài học theo ID
  getLessonById: async (req, res) => {
    try {
      const { lessonId } = req.params;

      const lesson = await lessonService.getLessonById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message: "Bài học không tồn tại",
        });
      }

      res.json({
        success: true,
        message: "Lấy bài học thành công",
        data: lesson,
      });
    } catch (error) {
      console.error("Error getting lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy bài học",
        error: error.message,
      });
    }
  },

  // Lấy bài học theo unit
  getLessonsByUnit: async (req, res) => {
    try {
      const { unitId } = req.params;

      const lessons = await lessonService.getLessonsByUnit(unitId);

      res.json({
        success: true,
        message: "Lấy danh sách bài học theo unit thành công",
        data: lessons,
      });
    } catch (error) {
      console.error("Error getting lessons by unit:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách bài học",
        error: error.message,
      });
    }
  },

  // Cập nhật bài học
  updateLesson: async (req, res) => {
    try {
      const { lessonId } = req.params;
      const updateData = req.body;

      const updatedLesson = await lessonService.updateLesson(
        lessonId,
        updateData
      );

      res.json({
        success: true,
        message: "Cập nhật bài học thành công",
        data: updatedLesson,
      });
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật bài học",
        error: error.message,
      });
    }
  },

  // Xóa bài học
  deleteLesson: async (req, res) => {
    try {
      const { lessonId } = req.params;

      await lessonService.deleteLesson(lessonId);

      res.json({
        success: true,
        message: "Xóa bài học thành công",
      });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa bài học",
        error: error.message,
      });
    }
  },
};

module.exports = lessonController;
