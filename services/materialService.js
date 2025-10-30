const materialRepository = require("../repositories/materialRepository");

class MaterialService {
  async getCourseMaterials(courseId) {
    try {
      const materials = await materialRepository.getCourseMaterials(courseId);

      // Format data
      const formattedMaterials = materials.map((material) => ({
        ...material,
        fileType: this.getFileType(material.FileURL),
        canDownload: true,
      }));

      return formattedMaterials;
    } catch (error) {
      console.error("Error in getCourseMaterials service:", error);
      throw error;
    }
  }

  async getLearnerMaterials(learnerId) {
    try {
      const materials = await materialRepository.getLearnerMaterials(learnerId);

      // Format and group by course
      const groupedMaterials = materials.reduce((acc, material) => {
        const courseTitle = material.CourseTitle;
        if (!acc[courseTitle]) {
          acc[courseTitle] = {
            CourseTitle: courseTitle,
            CourseID: material.CourseID,
            CourseDescription: material.CourseDescription,
            InstructorName: material.InstructorName,
            Materials: [],
          };
        }
        acc[courseTitle].Materials.push({
          MaterialID: material.MaterialID,
          Title: material.Title,
          FileURL: material.FileURL,
          fileType: this.getFileType(material.FileURL),
          canDownload: true,
        });
        return acc;
      }, {});

      return Object.values(groupedMaterials);
    } catch (error) {
      console.error("Error in getLearnerMaterials service:", error);
      throw error;
    }
  }

  async getMaterialById(materialId) {
    try {
      const material = await materialRepository.getMaterialById(materialId);

      if (!material) {
        throw new Error("Material not found");
      }

      return {
        ...material,
        fileType: this.getFileType(material.FileURL),
        canDownload: true,
        canView: this.canViewInBrowser(material.FileURL),
      };
    } catch (error) {
      console.error("Error in getMaterialById service:", error);
      throw error;
    }
  }

  async createMaterial(materialData) {
    try {
      // Validate
      if (
        !materialData.Title ||
        !materialData.FileURL ||
        !materialData.CourseID
      ) {
        throw new Error("Thiếu thông tin bắt buộc");
      }

      return await materialRepository.createMaterial(materialData);
    } catch (error) {
      console.error("Error in createMaterial service:", error);
      throw error;
    }
  }

  async updateMaterial(materialId, materialData) {
    try {
      return await materialRepository.updateMaterial(materialId, materialData);
    } catch (error) {
      console.error("Error in updateMaterial service:", error);
      throw error;
    }
  }

  async deleteMaterial(materialId) {
    try {
      return await materialRepository.deleteMaterial(materialId);
    } catch (error) {
      console.error("Error in deleteMaterial service:", error);
      throw error;
    }
  }

  getFileType(fileURL) {
    const extension = fileURL.split(".").pop().toLowerCase();
    const types = {
      pdf: "PDF",
      doc: "Word",
      docx: "Word",
      xls: "Excel",
      xlsx: "Excel",
      ppt: "PowerPoint",
      pptx: "PowerPoint",
      zip: "Archive",
      rar: "Archive",
      mp4: "Video",
      avi: "Video",
      mp3: "Audio",
    };
    return types[extension] || "File";
  }

  canViewInBrowser(fileURL) {
    const extension = fileURL.split(".").pop().toLowerCase();
    return ["pdf", "jpg", "jpeg", "png", "gif"].includes(extension);
  }
}

module.exports = new MaterialService();
