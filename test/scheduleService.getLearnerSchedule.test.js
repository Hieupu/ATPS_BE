jest.mock("../repositories/scheduleRepository", () => ({
  getLearnerSchedule: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getLearnerSchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - learnerId = 1, repo trả [] -> service trả []", async () => {
    scheduleRepository.getLearnerSchedule.mockResolvedValue([]);

    const result = await ScheduleService.getLearnerSchedule(1);

    expect(scheduleRepository.getLearnerSchedule).toHaveBeenCalledWith(1);
    expect(result).toEqual([]);
  });

  test("UTCID02 - learnerId = 2, repo trả data với PENDING_RESCHEDULE -> service format đúng với rescheduleInfo, formattedDate, timeRange, hasZoom", async () => {
    scheduleRepository.getLearnerSchedule.mockResolvedValue([
      {
        SessionID: 1,
        Date: "2025-11-23",
        StartTime: "09:00",
        EndTime: "11:00",
        ZoomURL: "zoom.com",
        Description:
          "[PENDING_RESCHEDULE] [Lịch cũ: 23/11 09:00-11:00] [Đề xuất lịch mới: 24/11 10:00-12:00]",
      },
    ]);

    const result = await ScheduleService.getLearnerSchedule(2);

    expect(scheduleRepository.getLearnerSchedule).toHaveBeenCalledWith(2);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 1);
    expect(result[0]).toHaveProperty("Description");
    expect(result[0]).toHaveProperty("rescheduleInfo");
    expect(result[0].rescheduleInfo).toHaveProperty("oldSchedule");
    expect(result[0].rescheduleInfo).toHaveProperty("newSchedule");
    expect(result[0]).toHaveProperty("formattedDate");
    expect(result[0]).toHaveProperty("timeRange", "09:00 - 11:00");
    expect(result[0]).toHaveProperty("hasZoom", true);
  });

  test("UTCID03 - learnerId = 3, repo trả data với Description invalid -> service vẫn format được", async () => {
    scheduleRepository.getLearnerSchedule.mockResolvedValue([
      {
        SessionID: 2,
        Date: "2025-11-24",
        StartTime: "10:00",
        EndTime: "12:00",
        ZoomURL: null,
        Description: "Invalid string",
      },
    ]);

    const result = await ScheduleService.getLearnerSchedule(3);

    expect(scheduleRepository.getLearnerSchedule).toHaveBeenCalledWith(3);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 2);
    expect(result[0]).toHaveProperty("Description", "Invalid string");
    expect(result[0]).toHaveProperty("rescheduleInfo", null);
    expect(result[0]).toHaveProperty("formattedDate");
    expect(result[0]).toHaveProperty("timeRange", "10:00 - 12:00");
    expect(result[0]).toHaveProperty("hasZoom", false);
  });

  test("UTCID04 - learnerId = 4, repo ném lỗi -> service log error và ném lại", async () => {
    scheduleRepository.getLearnerSchedule.mockRejectedValue(
      new Error("DB error")
    );

    await expect(ScheduleService.getLearnerSchedule(4)).rejects.toThrow(
      "DB error"
    );
    expect(scheduleRepository.getLearnerSchedule).toHaveBeenCalledWith(4);
  });
});

