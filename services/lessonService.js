const lessonRepository = require("../repositories/lessonRepository");

class LessonService {
  // Tạo bài học mới
  async createLesson(lessonData) {
    try {
      const newLesson = await lessonRepository.create(lessonData);

      // Lấy thông tin đầy đủ
      const fullLessonData = await lessonRepository.findById(
        newLesson.insertId
      );

      return fullLessonData[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy bài học theo ID
  async getLessonById(lessonId) {
    try {
      const lessons = await lessonRepository.findById(lessonId);
      return lessons[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy bài học theo unit
  async getLessonsByUnit(unitId) {
    try {
      const lessons = await lessonRepository.findByUnitId(unitId);
      return lessons;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật bài học
  async updateLesson(lessonId, updateData) {
    try {
      const updated = await lessonRepository.update(lessonId, updateData);
      if (updated.affectedRows === 0) {
        throw new Error("Bài học không tồn tại");
      }

      // Lấy thông tin đầy đủ sau khi cập nhật
      const updatedLesson = await this.getLessonById(lessonId);
      return updatedLesson;
    } catch (error) {
      throw error;
    }
  }

  // Xóa bài học
  async deleteLesson(lessonId) {
    try {
      const deleted = await lessonRepository.delete(lessonId);
      return deleted;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LessonService();
