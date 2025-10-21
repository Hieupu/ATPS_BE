const Material = require("../models/material");

const materialController = {
  // Tạo tài liệu cho khóa học
  createMaterial: async (req, res) => {
    try {
      const materialData = req.body;

      // Validation
      if (
        !materialData.Title ||
        !materialData.FileURL ||
        !materialData.CourseID
      ) {
        return res.status(400).json({
          success: false,
          message: "Title, FileURL và CourseID là bắt buộc",
        });
      }

      const newMaterial = await Material.create(materialData);

      res.status(201).json({
        success: true,
        message: "Tạo tài liệu thành công",
        data: newMaterial,
      });
    } catch (error) {
      console.error("Error creating material:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo tài liệu",
        error: error.message,
      });
    }
  },

  // Lấy tài liệu của khóa học
  getCourseMaterials: async (req, res) => {
    try {
      const { courseId } = req.params;

      const materials = await Material.findByCourseId(courseId);

      res.json({
        success: true,
        message: "Lấy tài liệu khóa học thành công",
        data: materials,
      });
    } catch (error) {
      console.error("Error getting course materials:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tài liệu khóa học",
        error: error.message,
      });
    }
  },

  // Lấy tài liệu theo ID
  getMaterialById: async (req, res) => {
    try {
      const { materialId } = req.params;

      const material = await Material.findById(materialId);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài liệu",
        });
      }

      res.json({
        success: true,
        message: "Lấy tài liệu thành công",
        data: material,
      });
    } catch (error) {
      console.error("Error getting material:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tài liệu",
        error: error.message,
      });
    }
  },

  // Cập nhật tài liệu
  updateMaterial: async (req, res) => {
    try {
      const { materialId } = req.params;
      const materialData = req.body;

      const updatedMaterial = await Material.update(materialId, materialData);

      if (!updatedMaterial) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài liệu",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật tài liệu thành công",
        data: updatedMaterial,
      });
    } catch (error) {
      console.error("Error updating material:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật tài liệu",
        error: error.message,
      });
    }
  },

  // Xóa tài liệu
  deleteMaterial: async (req, res) => {
    try {
      const { materialId } = req.params;

      const deleted = await Material.delete(materialId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài liệu",
        });
      }

      res.json({
        success: true,
        message: "Xóa tài liệu thành công",
      });
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa tài liệu",
        error: error.message,
      });
    }
  },

  // Lấy tài liệu của học viên (đã enroll)
  getLearnerMaterials: async (req, res) => {
    try {
      const { learnerId } = req.query;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const materials = await Material.findByLearnerId(learnerId);

      res.json({
        success: true,
        message: "Lấy tài liệu học viên thành công",
        data: materials,
      });
    } catch (error) {
      console.error("Error getting learner materials:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tài liệu học viên",
        error: error.message,
      });
    }
  },

  // Lấy tài liệu theo SessionID
  getSessionMaterials: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const materials = await Material.findBySessionId(sessionId);

      res.json({
        success: true,
        message: "Lấy tài liệu session thành công",
        data: materials,
      });
    } catch (error) {
      console.error("Error getting session materials:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tài liệu session",
        error: error.message,
      });
    }
  },
};

module.exports = materialController;
