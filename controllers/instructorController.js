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

      // Only call searchInstructors if there are actual filters (not just default page/pageSize)
      const hasFilters =
        search ||
        major ||
        type ||
        timeslotArray.length > 0 ||
        minFeeNum > 0 ||
        maxFeeNum < 1000000;
      // Only consider pagination if page > 1 (not just different pageSize)
      const hasPagination = page && Number(page) > 1;

      if (hasFilters || hasPagination) {
        console.log(
          "[getAllInstructors] Calling searchInstructors with params:",
          {
            search,
            major,
            type,
            timeslots: timeslotArray,
            minFee: minFeeNum,
            maxFee: maxFeeNum,
            page,
            pageSize,
          }
        );
        const result = await instructorService.searchInstructors({
          search,
          major,
          type,
          timeslots: timeslotArray,
          minFee: minFeeNum,
          maxFee: maxFeeNum,
          page,
          pageSize,
        });
        console.log("[getAllInstructors] searchInstructors result:", {
          itemsCount: result?.items?.length || 0,
          total: result?.total || 0,
          hasItems: !!result?.items,
          resultKeys: result ? Object.keys(result) : [],
        });
        return res.json(result);
      }

      console.log("[getAllInstructors] No filters, calling listInstructors");
      const results = await instructorService.listInstructors();
      console.log(
        "[getAllInstructors] listInstructors result count:",
        results?.length || 0
      );
      // Return consistent format: { items, total, page, pageSize }
      return res.json({
        items: results || [],
        total: results?.length || 0,
        page: 1,
        pageSize: results?.length || 0,
      });
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
