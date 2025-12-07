jest.mock("../repositories/scheduleRepository", () => ({
  getPendingRescheduleRequestsByAccountId: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getPendingRescheduleRequestsByAccountId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - accountId=1, repo trả full data (SessionDate, StartTime, EndTime, Description) -> service format và trả correct full data với formattedSessionDate và timeRange", async () => {
    scheduleRepository.getPendingRescheduleRequestsByAccountId.mockResolvedValue(
      [
        {
          RescheduleID: 1,
          SessionID: 10,
          SessionDate: "2025-11-25",
          StartTime: "09:00",
          EndTime: "11:00",
          Description:
            "[Lịch cũ: 2025-11-20 08:00-10:00] [Đề xuất lịch mới: 2025-11-25 09:00-11:00] Lý do: Student request",
        },
      ]
    );

    const result =
      await ScheduleService.getPendingRescheduleRequestsByAccountId(1);

    expect(
      scheduleRepository.getPendingRescheduleRequestsByAccountId
    ).toHaveBeenCalledWith(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("RescheduleID", 1);
    expect(result[0]).toHaveProperty("formattedSessionDate");
    expect(result[0]).toHaveProperty("timeRange", "09:00 - 11:00");
    expect(result[0]).toHaveProperty("rescheduleInfo");
  });

  test("UTCID02 - accountId=2, repo trả null -> service throw Error 'Không có hồ sơ học viên'", async () => {
    scheduleRepository.getPendingRescheduleRequestsByAccountId.mockResolvedValue(
      null
    );

    await expect(
      ScheduleService.getPendingRescheduleRequestsByAccountId(2)
    ).rejects.toThrow(
      "Không có hồ sơ học viên. Vui lòng tạo hồ sơ học viên trước."
    );
    expect(
      scheduleRepository.getPendingRescheduleRequestsByAccountId
    ).toHaveBeenCalledWith(2);
  });

  test("UTCID03 - accountId=3, repo trả empty array -> service trả empty array", async () => {
    scheduleRepository.getPendingRescheduleRequestsByAccountId.mockResolvedValue(
      []
    );

    const result =
      await ScheduleService.getPendingRescheduleRequestsByAccountId(3);

    expect(
      scheduleRepository.getPendingRescheduleRequestsByAccountId
    ).toHaveBeenCalledWith(3);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("UTCID04 - accountId=4, repo ném lỗi (DB error) -> service throw 'DB error'", async () => {
    scheduleRepository.getPendingRescheduleRequestsByAccountId.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      ScheduleService.getPendingRescheduleRequestsByAccountId(4)
    ).rejects.toThrow("DB error");
    expect(
      scheduleRepository.getPendingRescheduleRequestsByAccountId
    ).toHaveBeenCalledWith(4);
  });
});

