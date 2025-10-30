const scheduleService = require("../services/scheduleService");
const courseRepository = require("../repositories/courseRepository");

class ScheduleController {
  async getLearnerSchedule(req, res) {
    try {
      const { learnerId } = req.params;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const schedules = await scheduleService.getLearnerSchedule(learnerId);
      return res.json({ schedules });
    } catch (error) {
      console.error("Error in getLearnerSchedule:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getInstructorSchedule(req, res) {
    try {
      const { instructorId } = req.params;

      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required" });
      }

      const schedules = await scheduleService.getInstructorSchedule(
        instructorId
      );
      return res.json({ schedules });
    } catch (error) {
      console.error("Error in getInstructorSchedule:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await scheduleService.getSessionDetails(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      return res.json({ session });
    } catch (error) {
      console.error("Error in getSessionDetails:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async createSession(req, res) {
    try {
      const sessionData = req.body;

      const session = await scheduleService.createSession(sessionData);

      return res.status(201).json({
        message: "Session created successfully",
        session,
      });
    } catch (error) {
      console.error("Error in createSession:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async getAvailableInstructorSlots(req, res) {
    try {
      const { instructorId } = req.params;

      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required" });
      }

      const slots = await scheduleService.getAvailableInstructorSlots(
        instructorId
      );
      return res.json({ slots });
    } catch (error) {
      console.error("Error in getAvailableInstructorSlots:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async createOneOnOneBooking(req, res) {
    try {
      const bookingData = req.body;

      const booking = await scheduleService.createOneOnOneBooking(bookingData);

      return res.status(201).json({
        message: "Booking created successfully",
        booking,
      });
    } catch (error) {
      console.error("Error in createOneOnOneBooking:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async getClassesByInstructor(req, res) {
    try {
      const { instructorId } = req.params;
      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required" });
      }
      const classes = await scheduleService.getClassesByInstructor(
        instructorId
      );
      return res.json({ classes });
    } catch (error) {
      console.error("Error in getClassesByInstructor:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getClassSchedule(req, res) {
    try {
      const { classId } = req.params;
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }
      const schedules = await scheduleService.getClassSchedule(classId);
      return res.json({ schedules });
    } catch (error) {
      console.error("Error in getClassSchedule:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new ScheduleController();
