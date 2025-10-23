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

  // Lấy tất cả tài liệu
  getAllMaterials: async (req, res) => {
    try {
      const materials = await Material.findAll();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách tài liệu thành công",
        data: materials,
      });
    } catch (error) {
      console.error("Error getting materials:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách tài liệu",
        error: error.message,
      });
    }
  },

  // Lấy tài liệu theo ID
  getMaterialById: async (req, res) => {
    try {
      const materialId = req.params.id;
      const material = await Material.findById(materialId);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài liệu",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin tài liệu thành công",
        data: material,
      });
    } catch (error) {
      console.error("Error getting material:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin tài liệu",
        error: error.message,
      });
    }
  },

  // Lấy tài liệu theo khóa học
  getMaterialsByCourse: async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const materials = await Material.findByCourseId(courseId);

      res.status(200).json({
        success: true,
        message: "Lấy tài liệu theo khóa học thành công",
        data: materials,
      });
    } catch (error) {
      console.error("Error getting materials by course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tài liệu theo khóa học",
        error: error.message,
      });
    }
  },

  // Cập nhật tài liệu
  updateMaterial: async (req, res) => {
    try {
      const materialId = req.params.id;
      const updateData = req.body;

      const updatedMaterial = await Material.update(materialId, updateData);

      if (!updatedMaterial) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài liệu",
        });
      }

      res.status(200).json({
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
      const materialId = req.params.id;

      const deleted = await Material.delete(materialId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài liệu",
        });
      }

      res.status(200).json({
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

  // Lấy tài liệu công khai (không cần đăng nhập)
  getPublicMaterials: async (req, res) => {
    try {
      const materials = await Material.findPublicMaterials();

      res.status(200).json({
        success: true,
        message: "Lấy tài liệu công khai thành công",
        data: materials,
      });
    } catch (error) {
      console.error("Error getting public materials:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tài liệu công khai",
        error: error.message,
      });
    }
  },

  // Tải xuống tài liệu
  downloadMaterial: async (req, res) => {
    try {
      const materialId = req.params.id;
      const material = await Material.findById(materialId);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài liệu",
        });
      }

      // Tăng số lần tải xuống
      await Material.incrementDownloadCount(materialId);

      res.status(200).json({
        success: true,
        message: "Tải xuống tài liệu thành công",
        data: {
          MaterialID: material.MaterialID,
          Title: material.Title,
          FileURL: material.FileURL,
          FileType: material.FileType,
          FileSize: material.FileSize,
        },
      });
    } catch (error) {
      console.error("Error downloading material:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải xuống tài liệu",
        error: error.message,
      });
    }
  },
};

module.exports = materialController;
