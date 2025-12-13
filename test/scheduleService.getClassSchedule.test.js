jest.mock("../repositories/scheduleRepository", () => ({
  getClassSchedule: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getClassSchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - classId = 10, repo trả data -> service format và trả array length > 0", async () => {
    scheduleRepository.getClassSchedule.mockResolvedValue([
      {
        SessionID: 1,
        Date: "2025-11-23",
        StartTime: "09:00",
        EndTime: "11:00",
        Title: "Session 1",
      },
      {
        SessionID: 2,
        Date: "2025-11-24",
        StartTime: "14:00",
        EndTime: "16:00",
        Title: "Session 2",
      },
    ]);

    const result = await ScheduleService.getClassSchedule(10);

    expect(scheduleRepository.getClassSchedule).toHaveBeenCalledWith(10);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("SessionID", 1);
    expect(result[0]).toHaveProperty("formattedDate");
    expect(result[0]).toHaveProperty("timeRange", "09:00 - 11:00");
    expect(result[1]).toHaveProperty("SessionID", 2);
    expect(result[1]).toHaveProperty("formattedDate");
    expect(result[1]).toHaveProperty("timeRange", "14:00 - 16:00");
  });

  test("UTCID02 - classId = 10, repo trả [] (no schedule) -> service trả []", async () => {
    scheduleRepository.getClassSchedule.mockResolvedValue([]);

    const result = await ScheduleService.getClassSchedule(10);

    expect(scheduleRepository.getClassSchedule).toHaveBeenCalledWith(10);
    expect(result).toEqual([]);
  });

  test("UTCID03 - classId = null, repo trả [] -> service trả []", async () => {
    scheduleRepository.getClassSchedule.mockResolvedValue([]);

    const result = await ScheduleService.getClassSchedule(null);

    expect(scheduleRepository.getClassSchedule).toHaveBeenCalledWith(null);
    expect(result).toEqual([]);
  });

  test("UTCID04 - classId = 'abc', repo trả [] -> service trả []", async () => {
    scheduleRepository.getClassSchedule.mockResolvedValue([]);

    const result = await ScheduleService.getClassSchedule("abc");

    expect(scheduleRepository.getClassSchedule).toHaveBeenCalledWith("abc");
    expect(result).toEqual([]);
  });

  test("UTCID05 - repo ném lỗi -> service log error và ném lại", async () => {
    scheduleRepository.getClassSchedule.mockRejectedValue(
      new Error("DB error")
    );

    await expect(ScheduleService.getClassSchedule(10)).rejects.toThrow(
      "DB error"
    );
    expect(scheduleRepository.getClassSchedule).toHaveBeenCalledWith(10);
  });
});

