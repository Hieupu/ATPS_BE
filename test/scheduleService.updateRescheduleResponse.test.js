jest.mock("../repositories/scheduleRepository", () => ({
  updateRescheduleResponse: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - updateRescheduleResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - responseData có RescheduleID=1, Response='APPROVED' -> repo trả result object, service trả về result object", async () => {
    const responseData = {
      RescheduleID: 1,
      Response: "APPROVED",
    };

    const mockResult = {
      RescheduleID: 1,
      Response: "APPROVED",
      UpdatedAt: "2025-11-25 10:00:00",
    };

    scheduleRepository.updateRescheduleResponse.mockResolvedValue(mockResult);

    const result = await ScheduleService.updateRescheduleResponse(responseData);

    expect(scheduleRepository.updateRescheduleResponse).toHaveBeenCalledWith(
      responseData
    );
    expect(result).toEqual(mockResult);
  });

  test("UTCID02 - responseData có RescheduleID=2, Response='REJECTED' -> repo trả result object, service trả về result object", async () => {
    const responseData = {
      RescheduleID: 2,
      Response: "REJECTED",
    };

    const mockResult = {
      RescheduleID: 2,
      Response: "REJECTED",
      UpdatedAt: "2025-11-25 11:00:00",
    };

    scheduleRepository.updateRescheduleResponse.mockResolvedValue(mockResult);

    const result = await ScheduleService.updateRescheduleResponse(responseData);

    expect(scheduleRepository.updateRescheduleResponse).toHaveBeenCalledWith(
      responseData
    );
    expect(result).toEqual(mockResult);
  });

  test("UTCID03 - responseData có RescheduleID=3, Notes='Checked by admin', Reason='Conflict' -> repo trả result object, service trả về result object", async () => {
    const responseData = {
      RescheduleID: 3,
      Notes: "Checked by admin",
      Reason: "Conflict",
    };

    const mockResult = {
      RescheduleID: 3,
      Notes: "Checked by admin",
      Reason: "Conflict",
      UpdatedAt: "2025-11-25 12:00:00",
    };

    scheduleRepository.updateRescheduleResponse.mockResolvedValue(mockResult);

    const result = await ScheduleService.updateRescheduleResponse(responseData);

    expect(scheduleRepository.updateRescheduleResponse).toHaveBeenCalledWith(
      responseData
    );
    expect(result).toEqual(mockResult);
  });

  test("UTCID04 - responseData có RescheduleID=1, repo ném lỗi (DB error) -> service throw 'DB error'", async () => {
    const responseData = {
      RescheduleID: 1,
      Response: "APPROVED",
    };

    scheduleRepository.updateRescheduleResponse.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      ScheduleService.updateRescheduleResponse(responseData)
    ).rejects.toThrow("DB error");
    expect(scheduleRepository.updateRescheduleResponse).toHaveBeenCalledWith(
      responseData
    );
  });
});
