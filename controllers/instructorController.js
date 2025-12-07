const instructorService = require("../services/instructorService");

class InstructorController {
  // Update instructorController.js - getAllInstructors method
  async getAllInstructors(req, res) {
    try {
      const {
        search = "",
        major = null,
        type = null,
        timeslots = null,
        minFee = 0, // THÊM minFee
        maxFee = 1000000, // THÊM maxFee
        page = 1,
        pageSize = 10,
      } = req.query;

      // Handle multiple timeslots
      const timeslotArray = Array.isArray(timeslots)
        ? timeslots
        : timeslots
        ? [timeslots]
        : [];

      // Convert fee parameters to numbers
      const minFeeNum = Number(minFee);
      const maxFeeNum = Number(maxFee);

      console.log("=== CONTROLLER PARAMS ===");
      console.log("minFee:", minFee, "->", minFeeNum);
      console.log("maxFee:", maxFee, "->", maxFeeNum);
      console.log("timeslots:", timeslotArray);

      if (
        search ||
        major ||
        type ||
        timeslotArray.length > 0 ||
        minFeeNum > 0 ||
        maxFeeNum < 1000000 ||
        page ||
        pageSize
      ) {
        const result = await instructorService.searchInstructors({
          search,
          major,
          type,
          timeslots: timeslotArray,
          minFee: minFeeNum, // THÊM minFee
          maxFee: maxFeeNum, // THÊM maxFee
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
        return res
          .status(404)
          .json({ message: "Instructor not found for this account" });
      }
      return res.json({ instructorId });
    } catch (error) {
      console.error("Error in getInstructorIdByAccountId:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getFeaturedInstructors(req, res) {
    try {
      const { limit = 4 } = req.query;
      const instructors = await instructorService.getFeaturedInstructors(
        Number(limit)
      );
      return res.json({ instructors });
    } catch (error) {
      console.error("Error in getFeaturedInstructors:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new InstructorController();
