const scheduleRepository = require("../repositories/scheduleRepository");

class ScheduleService {
  async getLearnerSchedule(learnerId) {
    try {
      const schedules = await scheduleRepository.getLearnerSchedule(learnerId);

      const formattedSchedules = schedules.map((schedule) => ({
        ...schedule,
        formattedDate: schedule.Date
          ? new Date(schedule.Date).toLocaleDateString("vi-VN")
          : null,
        timeRange: `${schedule.StartTime} - ${schedule.EndTime}`,
        hasZoom: !!schedule.ZoomURL,
      }));

      return formattedSchedules;
    } catch (error) {
      console.error("Error in getLearnerSchedule service:", error);
      throw error;
    }
  }

  async getInstructorSchedule(instructorId) {
    try {
      const schedules = await scheduleRepository.getInstructorSchedule(
        instructorId
      );

      const formattedSchedules = schedules.map((schedule) => ({
        ...schedule,
        formattedDate: schedule.Date
          ? new Date(schedule.Date).toLocaleDateString("vi-VN")
          : null,
        timeRange: `${schedule.StartTime} - ${schedule.EndTime}`,
        hasZoom: !!schedule.ZoomURL,
      }));

      return formattedSchedules;
    } catch (error) {
      console.error("Error in getInstructorSchedule service:", error);
      throw error;
    }
  }

  async getSessionDetails(sessionId) {
    try {
      const session = await scheduleRepository.getSessionDetails(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      // Format timeslot
      if (session.Timeslot) {
        session.Timeslot = {
          ...session.Timeslot,
          formattedDate: new Date(session.Timeslot.Date).toLocaleDateString(
            "vi-VN"
          ),
          timeRange: `${session.Timeslot.StartTime} - ${session.Timeslot.EndTime}`,
        };
      }

      return session;
    } catch (error) {
      console.error("Error in getSessionDetails service:", error);
      throw error;
    }
  }

  async getClassesByInstructor(instructorId) {
    try {
      const classes = await scheduleRepository.getClassesByInstructor(
        instructorId
      );
      return classes;
    } catch (error) {
      console.error("Error in getClassesByInstructor service:", error);
      throw error;
    }
  }

  async getClassSchedule(classId) {
    try {
      const schedules = await scheduleRepository.getClassSchedule(classId);
      return schedules.map((s) => ({
        ...s,
        formattedDate: s.Date
          ? new Date(s.Date).toLocaleDateString("vi-VN")
          : null,
        timeRange: `${s.StartTime || ""} - ${s.EndTime || ""}`.trim(),
      }));
    } catch (error) {
      console.error("Error in getClassSchedule service:", error);
      throw error;
    }
  }

  async createSession(sessionData) {
    try {
      if (
        !sessionData.Title ||
        !sessionData.InstructorID ||
        !sessionData.ClassID
      ) {
        throw new Error("Thiếu thông tin bắt buộc");
      }

      const session = await scheduleRepository.createSession(sessionData);

      return session;
    } catch (error) {
      console.error("Error in createSession service:", error);
      throw error;
    }
  }

  async getAvailableInstructorSlots(instructorId) {
    const slots = await scheduleRepository.getAvailableInstructorSlots(
      instructorId
    );
    return slots.map((slot) => {
      let formattedDate = null;
      if (slot.Date) {
        const dateStr =
          slot.Date instanceof Date ? slot.Date : new Date(slot.Date);
        formattedDate = dateStr.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      return {
        ...slot,
        formattedDate,
        timeRange: `${slot.StartTime} - ${slot.EndTime}`,
        isAvailable: slot.IsAvailable || slot.SessionID === null,
      };
    });
  }

  async createOneOnOneBooking(bookingData) {
    if (!bookingData.LearnerID || !bookingData.InstructorID) {
      throw new Error("Missing required booking information");
    }

    const result = await scheduleRepository.createOneOnOneBooking(bookingData);
    return result;
  }
}

module.exports = new ScheduleService();
