jest.mock("../repositories/scheduleRepository", () => ({
  getInstructorWeeklySchedule: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getInstructorWeeklySchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId=10, weekStartDate='2025-02-10', repo trả list 2 lessons -> service trả array giống mock", async () => {
    const mockSchedule = [
      {
        SessionID: 1,
        Title: "Lesson 1",
        Date: "2025-02-10",
        StartTime: "09:00",
        EndTime: "11:00",
      },
      {
        SessionID: 2,
        Title: "Lesson 2",
        Date: "2025-02-11",
        StartTime: "14:00",
        EndTime: "16:00",
      },
    ];

    scheduleRepository.getInstructorWeeklySchedule.mockResolvedValue(
      mockSchedule
    );

    const result = await ScheduleService.getInstructorWeeklySchedule(
      10,
      "2025-02-10"
    );

    expect(
      scheduleRepository.getInstructorWeeklySchedule
    ).toHaveBeenCalledWith(10, "2025-02-10");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result).toEqual(mockSchedule);
  });

  test("UTCID02 - instructorId=10, weekStartDate='2025-02-10', repo trả empty array -> service trả empty array", async () => {
    scheduleRepository.getInstructorWeeklySchedule.mockResolvedValue([]);

    const result = await ScheduleService.getInstructorWeeklySchedule(
      10,
      "2025-02-10"
    );

    expect(
      scheduleRepository.getInstructorWeeklySchedule
    ).toHaveBeenCalledWith(10, "2025-02-10");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("UTCID03 - instructorId=null, weekStartDate='2025-02-10', repo trả 3 items -> service trả correct data", async () => {
    const mockSchedule = [
      {
        SessionID: 1,
        Title: "Lesson 1",
        Date: "2025-02-10",
      },
      {
        SessionID: 2,
        Title: "Lesson 2",
        Date: "2025-02-11",
      },
      {
        SessionID: 3,
        Title: "Lesson 3",
        Date: "2025-02-12",
      },
    ];

    scheduleRepository.getInstructorWeeklySchedule.mockResolvedValue(
      mockSchedule
    );

    const result = await ScheduleService.getInstructorWeeklySchedule(
      null,
      "2025-02-10"
    );

    expect(
      scheduleRepository.getInstructorWeeklySchedule
    ).toHaveBeenCalledWith(null, "2025-02-10");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockSchedule);
  });

  test("UTCID04 - instructorId=5, weekStartDate=null, repo trả list 2 lessons -> service trả array giống mock", async () => {
    const mockSchedule = [
      {
        SessionID: 1,
        Title: "Lesson 1",
        Date: "2025-02-10",
      },
      {
        SessionID: 2,
        Title: "Lesson 2",
        Date: "2025-02-11",
      },
    ];

    scheduleRepository.getInstructorWeeklySchedule.mockResolvedValue(
      mockSchedule
    );

    const result = await ScheduleService.getInstructorWeeklySchedule(5, null);

    expect(
      scheduleRepository.getInstructorWeeklySchedule
    ).toHaveBeenCalledWith(5, null);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result).toEqual(mockSchedule);
  });

  test("UTCID05 - instructorId=5, weekStartDate='invalid-date', repo trả 3 items -> service trả exactly 3 items", async () => {
    const mockSchedule = [
      {
        SessionID: 1,
        Title: "Lesson 1",
      },
      {
        SessionID: 2,
        Title: "Lesson 2",
      },
      {
        SessionID: 3,
        Title: "Lesson 3",
      },
    ];

    scheduleRepository.getInstructorWeeklySchedule.mockResolvedValue(
      mockSchedule
    );

    const result = await ScheduleService.getInstructorWeeklySchedule(
      5,
      "invalid-date"
    );

    expect(
      scheduleRepository.getInstructorWeeklySchedule
    ).toHaveBeenCalledWith(5, "invalid-date");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result).toEqual(mockSchedule);
  });

  test("UTCID06 - instructorId=10, weekStartDate='2025-02-10', repo ném lỗi (DB error) -> service log error và ném lại", async () => {
    scheduleRepository.getInstructorWeeklySchedule.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      ScheduleService.getInstructorWeeklySchedule(10, "2025-02-10")
    ).rejects.toThrow("DB error");
    expect(
      scheduleRepository.getInstructorWeeklySchedule
    ).toHaveBeenCalledWith(10, "2025-02-10");
  });
});

