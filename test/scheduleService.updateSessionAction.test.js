jest.mock("../repositories/scheduleRepository", () => ({
  updateSessionAction: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - updateSessionAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - actionData có SessionID=1, Status='COMPLETED' -> repo trả result object, service trả về result object", async () => {
    const actionData = {
      SessionID: 1,
      Status: "COMPLETED",
    };

    const mockResult = {
      SessionID: 1,
      Status: "COMPLETED",
      UpdatedAt: "2025-11-25 10:00:00",
    };

    scheduleRepository.updateSessionAction.mockResolvedValue(mockResult);

    const result = await ScheduleService.updateSessionAction(actionData);

    expect(scheduleRepository.updateSessionAction).toHaveBeenCalledWith(
      actionData
    );
    expect(result).toEqual(mockResult);
  });

  test("UTCID02 - actionData có SessionID=2, Status='Rescheduled' -> repo trả result object, service trả về result object", async () => {
    const actionData = {
      SessionID: 2,
      Status: "Rescheduled",
    };

    const mockResult = {
      SessionID: 2,
      Status: "Rescheduled",
      UpdatedAt: "2025-11-25 11:00:00",
    };

    scheduleRepository.updateSessionAction.mockResolvedValue(mockResult);

    const result = await ScheduleService.updateSessionAction(actionData);

    expect(scheduleRepository.updateSessionAction).toHaveBeenCalledWith(
      actionData
    );
    expect(result).toEqual(mockResult);
  });

  test("UTCID03 - actionData có SessionID=3, Status='CANCELLED', Reason='Student request' -> repo trả result object, service trả về result object", async () => {
    const actionData = {
      SessionID: 3,
      Status: "CANCELLED",
      Reason: "Student request",
    };

    const mockResult = {
      SessionID: 3,
      Status: "CANCELLED",
      Reason: "Student request",
      UpdatedAt: "2025-11-25 12:00:00",
    };

    scheduleRepository.updateSessionAction.mockResolvedValue(mockResult);

    const result = await ScheduleService.updateSessionAction(actionData);

    expect(scheduleRepository.updateSessionAction).toHaveBeenCalledWith(
      actionData
    );
    expect(result).toEqual(mockResult);
  });

  test("UTCID04 - actionData có SessionID=4, repo ném lỗi (DB error) -> service throw 'DB error'", async () => {
    const actionData = {
      SessionID: 4,
      Status: "COMPLETED",
    };

    scheduleRepository.updateSessionAction.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      ScheduleService.updateSessionAction(actionData)
    ).rejects.toThrow("DB error");
    expect(scheduleRepository.updateSessionAction).toHaveBeenCalledWith(
      actionData
    );
  });
});

