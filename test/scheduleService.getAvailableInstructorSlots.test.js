jest.mock("../repositories/scheduleRepository", () => ({
  getAvailableInstructorSlots: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getAvailableInstructorSlots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId=1, repo trả slot (Date='2025-01-20', StartTime='08:00', EndTime='10:00', IsAvailable=TRUE, SessionID=null) -> service format: formattedDate='20/01/2025', timeRange='08:00 - 10:00', isAvailable=true", async () => {
    scheduleRepository.getAvailableInstructorSlots.mockResolvedValue([
      {
        TimeslotID: 1,
        Day: "Monday",
        Date: "2025-01-20",
        StartTime: "08:00",
        EndTime: "10:00",
        IsAvailable: true,
        SessionID: null,
      },
    ]);

    const result = await ScheduleService.getAvailableInstructorSlots(1);

    expect(
      scheduleRepository.getAvailableInstructorSlots
    ).toHaveBeenCalledWith(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("formattedDate", "20/01/2025");
    expect(result[0]).toHaveProperty("timeRange", "08:00 - 10:00");
    expect(result[0]).toHaveProperty("isAvailable", true);
  });

  test("UTCID02 - instructorId=1, repo trả slot (Date='2025-02-10', StartTime='14:00', EndTime='16:00', IsAvailable=FALSE, SessionID=null) -> service format: formattedDate='10/02/2025', isAvailable=true (vì SessionID=null)", async () => {
    scheduleRepository.getAvailableInstructorSlots.mockResolvedValue([
      {
        TimeslotID: 2,
        Day: "Tuesday",
        Date: "2025-02-10",
        StartTime: "14:00",
        EndTime: "16:00",
        IsAvailable: false,
        SessionID: null,
      },
    ]);

    const result = await ScheduleService.getAvailableInstructorSlots(1);

    expect(
      scheduleRepository.getAvailableInstructorSlots
    ).toHaveBeenCalledWith(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("formattedDate", "10/02/2025");
    expect(result[0]).toHaveProperty("timeRange", "14:00 - 16:00");
    expect(result[0]).toHaveProperty("isAvailable", true);
  });

  test("UTCID03 - instructorId=1, repo trả slot (Date=null, StartTime='08:00', EndTime='10:00', IsAvailable=FALSE, SessionID=5) -> service format: formattedDate=null, timeRange='08:00 - 10:00', isAvailable=false", async () => {
    scheduleRepository.getAvailableInstructorSlots.mockResolvedValue([
      {
        TimeslotID: 3,
        Day: "Wednesday",
        Date: null,
        StartTime: "08:00",
        EndTime: "10:00",
        IsAvailable: false,
        SessionID: 5,
      },
    ]);

    const result = await ScheduleService.getAvailableInstructorSlots(1);

    expect(
      scheduleRepository.getAvailableInstructorSlots
    ).toHaveBeenCalledWith(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("formattedDate", null);
    expect(result[0]).toHaveProperty("timeRange", "08:00 - 10:00");
    expect(result[0]).toHaveProperty("isAvailable", false);
  });

  test("UTCID04 - instructorId=1, repo trả slot (Date='2025-03-01', StartTime='14:00', EndTime='16:00', IsAvailable=FALSE, SessionID=4) -> service format: isAvailable=false", async () => {
    scheduleRepository.getAvailableInstructorSlots.mockResolvedValue([
      {
        TimeslotID: 4,
        Day: "Thursday",
        Date: "2025-03-01",
        StartTime: "14:00",
        EndTime: "16:00",
        IsAvailable: false,
        SessionID: 4,
      },
    ]);

    const result = await ScheduleService.getAvailableInstructorSlots(1);

    expect(
      scheduleRepository.getAvailableInstructorSlots
    ).toHaveBeenCalledWith(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("formattedDate", "01/03/2025");
    expect(result[0]).toHaveProperty("timeRange", "14:00 - 16:00");
    expect(result[0]).toHaveProperty("isAvailable", false);
  });

  test("UTCID05 - instructorId=1, repo trả slot (Date='2025-03-01', StartTime='14:00', EndTime='16:00', IsAvailable=FALSE, SessionID=null) -> service format: isAvailable=true", async () => {
    scheduleRepository.getAvailableInstructorSlots.mockResolvedValue([
      {
        TimeslotID: 5,
        Day: "Friday",
        Date: "2025-03-01",
        StartTime: "14:00",
        EndTime: "16:00",
        IsAvailable: false,
        SessionID: null,
      },
    ]);

    const result = await ScheduleService.getAvailableInstructorSlots(1);

    expect(
      scheduleRepository.getAvailableInstructorSlots
    ).toHaveBeenCalledWith(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("formattedDate", "01/03/2025");
    expect(result[0]).toHaveProperty("timeRange", "14:00 - 16:00");
    expect(result[0]).toHaveProperty("isAvailable", true);
  });

  test("UTCID06 - instructorId=1, repo ném lỗi (DB failed) -> service ném lại error", async () => {
    scheduleRepository.getAvailableInstructorSlots.mockRejectedValue(
      new Error("DB failed")
    );

    await expect(
      ScheduleService.getAvailableInstructorSlots(1)
    ).rejects.toThrow("DB failed");
    expect(
      scheduleRepository.getAvailableInstructorSlots
    ).toHaveBeenCalledWith(1);
  });
});

