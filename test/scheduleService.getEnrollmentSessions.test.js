jest.mock("../repositories/scheduleRepository", () => ({
  getEnrollmentSessions: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getEnrollmentSessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - enrollmentId=1, repo trả session (SessionDate='2025-11-25', StartTime='08:00', EndTime='10:00') -> service format và trả correct data", async () => {
    scheduleRepository.getEnrollmentSessions.mockResolvedValue([
      {
        SessionID: 1,
        SessionDate: "2025-11-25",
        StartTime: "08:00",
        EndTime: "10:00",
        Title: "Session 1",
      },
    ]);

    const result = await ScheduleService.getEnrollmentSessions(1);

    expect(scheduleRepository.getEnrollmentSessions).toHaveBeenCalledWith(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 1);
    expect(result[0]).toHaveProperty("formattedSessionDate", "25/11/2025");
    expect(result[0]).toHaveProperty("timeRange", "08:00 - 10:00");
  });

  test("UTCID02 - enrollmentId=2, repo trả session (SessionDate='2025-12-01', StartTime='09:00', EndTime='11:00') -> service format: formattedSessionDate='1/12/2025', timeRange='09:00 - 11:00'", async () => {
    scheduleRepository.getEnrollmentSessions.mockResolvedValue([
      {
        SessionID: 2,
        SessionDate: "2025-12-01",
        StartTime: "09:00",
        EndTime: "11:00",
        Title: "Session 2",
      },
    ]);

    const result = await ScheduleService.getEnrollmentSessions(2);

    expect(scheduleRepository.getEnrollmentSessions).toHaveBeenCalledWith(2);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("formattedSessionDate", "1/12/2025");
    expect(result[0]).toHaveProperty("timeRange", "09:00 - 11:00");
  });

  test("UTCID03 - enrollmentId=3, repo trả session (SessionDate=null, StartTime=null, EndTime=null) -> service format: formattedSessionDate=null, timeRange=null", async () => {
    scheduleRepository.getEnrollmentSessions.mockResolvedValue([
      {
        SessionID: 3,
        SessionDate: null,
        StartTime: null,
        EndTime: null,
        Title: "Session 3",
      },
    ]);

    const result = await ScheduleService.getEnrollmentSessions(3);

    expect(scheduleRepository.getEnrollmentSessions).toHaveBeenCalledWith(3);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 3);
    expect(result[0]).toHaveProperty("formattedSessionDate", null);
    expect(result[0]).toHaveProperty("timeRange", null);
  });

  test("UTCID04 - enrollmentId=1, repo ném lỗi (DB error) -> service throw 'DB error'", async () => {
    scheduleRepository.getEnrollmentSessions.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      ScheduleService.getEnrollmentSessions(1)
    ).rejects.toThrow("DB error");
    expect(scheduleRepository.getEnrollmentSessions).toHaveBeenCalledWith(1);
  });
});

