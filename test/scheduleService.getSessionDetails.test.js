jest.mock("../repositories/scheduleRepository", () => ({
  getSessionDetails: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getSessionDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - sessionId = 5, repo trả session có Timeslot -> service format Timeslot với formattedDate và timeRange", async () => {
    scheduleRepository.getSessionDetails.mockResolvedValue({
      SessionID: 5,
      Title: "Session 1",
      Date: "2025-11-23",
      Timeslot: {
        Date: "2025-11-23",
        StartTime: "09:00",
        EndTime: "11:00",
      },
    });

    const result = await ScheduleService.getSessionDetails(5);

    expect(scheduleRepository.getSessionDetails).toHaveBeenCalledWith(5);
    expect(result).toHaveProperty("SessionID", 5);
    expect(result).toHaveProperty("Timeslot");
    expect(result.Timeslot).toHaveProperty("formattedDate");
    expect(result.Timeslot).toHaveProperty("timeRange", "09:00 - 11:00");
  });

  test("UTCID02 - sessionId = 5, repo trả session với Timeslot = null -> service trả object không có formatted fields", async () => {
    scheduleRepository.getSessionDetails.mockResolvedValue({
      SessionID: 5,
      Title: "Session 1",
      Date: "2025-11-23",
      Timeslot: null,
    });

    const result = await ScheduleService.getSessionDetails(5);

    expect(scheduleRepository.getSessionDetails).toHaveBeenCalledWith(5);
    expect(result).toHaveProperty("SessionID", 5);
    expect(result).toHaveProperty("Timeslot", null);
    expect(result.Timeslot).toBeNull();
  });

  test("UTCID03 - sessionId = 5, repo trả session hợp lệ -> service trả toàn bộ session object", async () => {
    scheduleRepository.getSessionDetails.mockResolvedValue({
      SessionID: 5,
      Title: "Session 1",
      Date: "2025-11-23",
      ClassID: 10,
      Timeslot: {
        Date: "2025-11-23",
        StartTime: "09:00",
        EndTime: "11:00",
      },
    });

    const result = await ScheduleService.getSessionDetails(5);

    expect(scheduleRepository.getSessionDetails).toHaveBeenCalledWith(5);
    expect(result).toHaveProperty("SessionID", 5);
    expect(result).toHaveProperty("Title", "Session 1");
    expect(result).toHaveProperty("Date", "2025-11-23");
    expect(result).toHaveProperty("ClassID", 10);
    expect(result).toHaveProperty("Timeslot");
  });

  test("UTCID04 - sessionId = 999999, repo trả null -> service ném Error 'Session not found'", async () => {
    scheduleRepository.getSessionDetails.mockResolvedValue(null);

    await expect(ScheduleService.getSessionDetails(999999)).rejects.toThrow(
      "Session not found"
    );
    expect(scheduleRepository.getSessionDetails).toHaveBeenCalledWith(999999);
  });

  test("UTCID05 - sessionId = undefined, repo trả null -> service ném Error 'Session not found'", async () => {
    scheduleRepository.getSessionDetails.mockResolvedValue(null);

    await expect(ScheduleService.getSessionDetails(undefined)).rejects.toThrow(
      "Session not found"
    );
    expect(scheduleRepository.getSessionDetails).toHaveBeenCalledWith(
      undefined
    );
  });

  test("UTCID06 - repo ném lỗi (DB error) -> service log error và ném lại", async () => {
    scheduleRepository.getSessionDetails.mockRejectedValue(
      new Error("DB error")
    );

    await expect(ScheduleService.getSessionDetails(5)).rejects.toThrow(
      "DB error"
    );
    expect(scheduleRepository.getSessionDetails).toHaveBeenCalledWith(5);
  });
});

