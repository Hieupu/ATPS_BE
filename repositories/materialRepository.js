const connectDB = require("../config/db");

class MaterialRepository {
  async getCourseMaterials(courseId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          CourseID,
          MaterialID,
          Title,
          FileURL,
          Status 
         FROM material
         WHERE CourseID = ? AND LOWER(Status) = 'VISIBLE'
         ORDER BY MaterialID DESC`,
        [courseId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getCourseMaterials:", error);
      throw error;
    }
  }

  async getLearnerMaterials(learnerId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          m.MaterialID,
          m.Title,
          m.FileURL,
          m.Status,
          m.CourseID,
          c.Title as CourseTitle,
          c.Description as CourseDescription,
          i.InstructorID,
          i.FullName as InstructorName
         FROM material m
         INNER JOIN course c ON m.CourseID = c.CourseID
         INNER JOIN instructor i ON c.InstructorID = i.InstructorID
         INNER JOIN class cl ON c.CourseID = cl.CourseID
         INNER JOIN enrollment e ON cl.ClassID = e.ClassID
         WHERE e.LearnerID = ? 
           AND e.Status = 'Enrolled' 
           AND m.Status = 'VISIBLE'
         ORDER BY c.CourseID, m.MaterialID DESC`,
        [learnerId]
      );
      return rows;
    } catch (error) {
      console.error("Database error in getLearnerMaterials:", error);
      throw error;
    }
  }

  async getMaterialById(materialId) {
    try {
      const db = await connectDB();
      const [rows] = await db.query(
        `SELECT 
          m.MaterialID,
          m.Title,
          m.FileURL,
          m.Status,
          m.CourseID,
          c.Title as CourseTitle,
          c.Description as CourseDescription,
          i.InstructorID,
          i.FullName as InstructorName,
          i.ProfilePicture as InstructorAvatar
         FROM material m
         INNER JOIN course c ON m.CourseID = c.CourseID
         INNER JOIN instructor i ON c.InstructorID = i.InstructorID
         WHERE m.MaterialID = ?`,
        [materialId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Database error in getMaterialById:", error);
      throw error;
    }
  }

  async createMaterial(materialData) {
    try {
      const db = await connectDB();
      const { Title, FileURL, Status, CourseID } = materialData;

      const [result] = await db.query(
        `INSERT INTO material (Title, FileURL, Status, CourseID)
         VALUES (?, ?, ?, ?)`,
        [Title, FileURL, Status || "Active", CourseID]
      );

      return { MaterialID: result.insertId };
    } catch (error) {
      console.error("Database error in createMaterial:", error);
      throw error;
    }
  }

  async updateMaterial(materialId, materialData) {
    try {
      const db = await connectDB();
      const { Title, FileURL, Status } = materialData;

      const [result] = await db.query(
        `UPDATE material 
         SET Title = ?, FileURL = ?, Status = ?
         WHERE MaterialID = ?`,
        [Title, FileURL, Status, materialId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Database error in updateMaterial:", error);
      throw error;
    }
  }

  async deleteMaterial(materialId) {
    try {
      const db = await connectDB();
      const [result] = await db.query(
        `UPDATE material SET Status = 'Inactive' WHERE MaterialID = ?`,
        [materialId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Database error in deleteMaterial:", error);
      throw error;
    }
  }
}

module.exports = new MaterialRepository();
