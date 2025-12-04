// Mock DB pool
jest.mock("../config/db", () => ({
  execute: jest.fn(),
}));

// Mock repositories
jest.mock("../repositories/enrollmentRepository", () => ({
  findByClassId: jest.fn(),
}));

jest.mock("../repositories/instructorTimeslotRepository", () => ({
  findByDateRange: jest.fn(),
}));

jest.mock("../repositories/sessionRepository", () => ({
  findByDateRange: jest.fn(),
}));

// Mock sessionValidation helpers
jest.mock("../utils/sessionValidation", () => ({
  validateDateDayConsistency: jest.fn(),
  validateInstructorLeave: jest.fn(),
  getDayOfWeek: (dateStr) => {
    // Simple helper: use real Date to derive day-of-week label
    const d = new Date(dateStr);
    const day = d.getDay();
    const map = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return map[day];
  },
}));

// Mock sessionService
jest.mock("../services/sessionService", () => ({
  checkSessionConflictInfo: jest.fn(),
  createBulkSessions: jest.fn().mockResolvedValue({
    success: [],
    conflicts: [],
    summary: { success: 0, conflicts: 0 },
  }),
}));

const pool = require("../config/db");
const enrollmentRepository = require("../repositories/enrollmentRepository");
const instructorTimeslotRepository = require("../repositories/instructorTimeslotRepository");
const sessionRepository = require("../repositories/sessionRepository");
const sessionService = require("../services/sessionService");
const {
  validateInstructorLeave,
} = require("../utils/sessionValidation");

const classCreationWizardService = require("../services/classCreationWizardService");

describe("classCreationWizardService - findAvailableInstructorSlots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("trả về các slots rảnh khi không có nghỉ và không có session trùng", async () => {
    // Mock validateInstructorLeave: không có nghỉ
    validateInstructorLeave.mockResolvedValue({
      hasConflict: false,
      conflictInfo: null,
    });

    // Mock checkSessionConflictInfo: không có session trùng
    sessionService.checkSessionConflictInfo.mockResolvedValue({
      hasConflict: false,
      conflictType: null,
      conflictInfo: null,
    });

    const today = new Date();
    today.setDate(today.getDate() + 1);
    const startDate = today.toISOString().split("T")[0];

    const result =
      await classCreationWizardService.findAvailableInstructorSlots({
        InstructorID: 1,
        TimeslotID: 10,
        Day: "T2",
        numSuggestions: 2,
        startDate,
        excludeClassId: null,
      });

    expect(result.length).toBeGreaterThan(0);
    result.forEach((slot) => {
      expect(slot).toHaveProperty("date");
      expect(slot).toHaveProperty("available", true);
      expect(slot).toHaveProperty("timeslotId", 10);
    });
  });
});

describe("classCreationWizardService - checkLearnerConflicts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("trả về isValid=false và conflicts khi có học viên trùng lịch (bulk query)", async () => {
    // Mock enrollments: 2 learners active
    enrollmentRepository.findByClassId.mockResolvedValue([
      { LearnerID: 1, Status: "active", learnerName: "Learner 1" },
      { LearnerID: 2, Status: "enrolled", learnerName: "Learner 2" },
    ]);

    // Mock bulk conflict query: chỉ learner 1 có conflict
    pool.execute.mockResolvedValue([
      [
        {
          LearnerID: 1,
          learnerName: "Learner 1",
          SessionID: 100,
          sessionTitle: "Session X",
          Date: "2025-02-03",
          className: "Other Class",
          StartTime: "08:00:00",
          EndTime: "10:00:00",
        },
      ],
    ]);

    const result = await classCreationWizardService.checkLearnerConflicts({
      ClassID: 123,
      Date: "2025-02-03",
      TimeslotID: 10,
    });

    expect(result.isValid).toBe(false);
    expect(result.conflicts.length).toBe(1);
    expect(result.summary.totalLearners).toBe(2);
    expect(result.summary.conflictedLearners).toBe(1);
    expect(result.summary.availableLearners).toBe(1);

    const conflict = result.conflicts[0];
    expect(conflict.learnerId).toBe(1);
    expect(conflict.conflictInfo.className).toBe("Other Class");
  });

  it("trả về isValid=true khi không có học viên nào active/enrolled", async () => {
    enrollmentRepository.findByClassId.mockResolvedValue([]);

    const result = await classCreationWizardService.checkLearnerConflicts({
      ClassID: 123,
      Date: "2025-02-03",
      TimeslotID: 10,
    });

    expect(result.isValid).toBe(true);
    expect(result.conflicts.length).toBe(0);
    expect(result.summary.totalLearners).toBe(0);
  });
});

describe("classCreationWizardService - searchTimeslots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("trả về [] khi thiếu InstructorID hoặc DaysOfWeek rỗng", async () => {
    const r1 = await classCreationWizardService.searchTimeslots({
      InstructorID: null,
      DaysOfWeek: [1],
      TimeslotsByDay: { 1: [10] },
      Numofsession: 4,
      sessionsPerWeek: 1,
    });
    expect(r1).toEqual([]);

    const r2 = await classCreationWizardService.searchTimeslots({
      InstructorID: 1,
      DaysOfWeek: [],
      TimeslotsByDay: {},
      Numofsession: 4,
      sessionsPerWeek: 1,
    });
    expect(r2).toEqual([]);
  });
});


