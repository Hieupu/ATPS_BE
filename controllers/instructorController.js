const instructorService = require("../services/instructorService");

class InstructorController {
  async getAllInstructors(req, res) {
    try {
      const {
        search = "",
        major = null,
        sort = "newest",
        page = 1,
        pageSize = 10,
      } = req.query;
      if (search || major || sort !== "newest" || page || pageSize) {
        const result = await instructorService.searchInstructors({
          search,
          major,
          sort,
          page,
          pageSize,
        });
        return res.json(result);
      }
      const results = await instructorService.listInstructors();
      return res.json({ instructors: results });
    } catch (error) {
      console.error("Error in getAllInstructors:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getInstructorById(req, res) {
    try {
      const { id } = req.params;
      const instructor = await instructorService.getInstructor(id);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      return res.json({ instructor });
    } catch (error) {
      console.error("Error in getInstructorById:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getInstructorIdByAccountId(req, res) {
    try {
      const { accountId } = req.params;
      const instructorId = await instructorService.getInstructorIdByAccountId(
        accountId
      );
      if (!instructorId) {
        return res.status(404).json({ message: "Instructor not found for this account" });
      }
      return res.json({ instructorId });
    } catch (error) {
      console.error("Error in getInstructorIdByAccountId:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new InstructorController();
