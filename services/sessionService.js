const sessionRepository = require("../repositories/sessionRepository");
const classRepository = require("../repositories/classRepository");
const instructorRepository = require("../repositories/instructorRepository");

class SessionService {
  async createSession(data) {
    try {
      // Validate required fields
      if (!data.Title || !data.InstructorID || !data.ClassID) {
        throw new Error("Title, InstructorID, and ClassID are required");
      }

      // Check if class exists
      const classData = await classRepository.findById(data.ClassID);
      if (!classData) {
        throw new Error("Class not found");
      }

      // Check if instructor exists
      const instructor = await instructorRepository.findById(data.InstructorID);
      if (!instructor) {
        throw new Error("Instructor not found");
      }

      // Create session
      const newSession = await sessionRepository.create(data);
      return newSession;
    } catch (error) {
      throw error;
    }
  }

  async getAllSessions() {
    try {
      const sessions = await sessionRepository.findAll();
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  async getSessionById(id) {
    try {
      const session = await sessionRepository.findById(id);
      if (!session) {
        throw new Error("Session not found");
      }
      return session;
    } catch (error) {
      throw error;
    }
  }

  async getSessionsByClassId(classId) {
    try {
      const sessions = await sessionRepository.findByClassId(classId);
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  async getSessionsByInstructorId(instructorId) {
    try {
      const sessions = await sessionRepository.findByInstructorId(instructorId);
      return sessions;
    } catch (error) {
      throw error;
    }
  }

  async updateSession(id, data) {
    try {
      // Check if session exists
      const existingSession = await sessionRepository.findById(id);
      if (!existingSession) {
        throw new Error("Session not found");
      }

      // Update session
      const updatedSession = await sessionRepository.update(id, data);
      return updatedSession;
    } catch (error) {
      throw error;
    }
  }

  async deleteSession(id) {
    try {
      // Check if session exists
      const existingSession = await sessionRepository.findById(id);
      if (!existingSession) {
        throw new Error("Session not found");
      }

      // Delete session
      const deleted = await sessionRepository.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SessionService();
