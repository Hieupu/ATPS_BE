const materialService = require("../services/materialService");

class MaterialController {
  async getCourseMaterials(req, res) {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const materials = await materialService.getCourseMaterials(courseId);
      return res.json({ materials });
    } catch (error) {
      console.error("Error in getCourseMaterials:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getLearnerMaterials(req, res) {
    try {
      const { learnerId } = req.params;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const materials = await materialService.getLearnerMaterials(learnerId);
      return res.json({ materials });
    } catch (error) {
      console.error("Error in getLearnerMaterials:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getMaterialById(req, res) {
    try {
      const { materialId } = req.params;

      if (!materialId) {
        return res.status(400).json({ message: "Material ID is required" });
      }

      const material = await materialService.getMaterialById(materialId);

      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      return res.json({ material });
    } catch (error) {
      console.error("Error in getMaterialById:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async createMaterial(req, res) {
    try {
      const materialData = req.body;

      const material = await materialService.createMaterial(materialData);

      return res.status(201).json({
        message: "Material created successfully",
        material,
      });
    } catch (error) {
      console.error("Error in createMaterial:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async updateMaterial(req, res) {
    try {
      const { materialId } = req.params;
      const materialData = req.body;

      const updated = await materialService.updateMaterial(
        materialId,
        materialData
      );

      if (!updated) {
        return res.status(404).json({ message: "Material not found" });
      }

      return res.json({ message: "Material updated successfully" });
    } catch (error) {
      console.error("Error in updateMaterial:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async deleteMaterial(req, res) {
    try {
      const { materialId } = req.params;

      const deleted = await materialService.deleteMaterial(materialId);

      if (!deleted) {
        return res.status(404).json({ message: "Material not found" });
      }

      return res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Error in deleteMaterial:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new MaterialController();
