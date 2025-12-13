jest.mock("../repositories/scheduleRepository", () => ({
  createSession: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - createSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - sessionData thiếu Title (null), InstructorID=1, ClassID=2 -> throw Error 'Thiếu thông tin bắt buộc'", async () => {
    const sessionData = {
      Title: null,
      InstructorID: 1,
      ClassID: 2,
    };

    await expect(
      ScheduleService.createSession(sessionData)
    ).rejects.toThrow("Thiếu thông tin bắt buộc");
    expect(scheduleRepository.createSession).not.toHaveBeenCalled();
  });

  test("UTCID02 - sessionData có Title='Buổi 1', thiếu InstructorID (null), ClassID=2 -> throw Error 'Thiếu thông tin bắt buộc'", async () => {
    const sessionData = {
      Title: "Buổi 1",
      InstructorID: null,
      ClassID: 2,
    };

    await expect(
      ScheduleService.createSession(sessionData)
    ).rejects.toThrow("Thiếu thông tin bắt buộc");
    expect(scheduleRepository.createSession).not.toHaveBeenCalled();
  });

  test("UTCID03 - sessionData có Title='Buổi 1', InstructorID=1, thiếu ClassID (null) -> throw Error 'Thiếu thông tin bắt buộc'", async () => {
    const sessionData = {
      Title: "Buổi 1",
      InstructorID: 1,
      ClassID: null,
    };

    await expect(
      ScheduleService.createSession(sessionData)
    ).rejects.toThrow("Thiếu thông tin bắt buộc");
    expect(scheduleRepository.createSession).not.toHaveBeenCalled();
  });

  test("UTCID04 - sessionData có đầy đủ Title, InstructorID, ClassID -> repo trả session object, service trả về session", async () => {
    const sessionData = {
      Title: "Buổi 1",
      InstructorID: 1,
      ClassID: 2,
      Description: "Session description",
      TimeslotID: 5,
      Date: "2025-11-23",
    };

    scheduleRepository.createSession.mockResolvedValue({
      SessionID: 10,
    });

    const result = await ScheduleService.createSession(sessionData);

    expect(scheduleRepository.createSession).toHaveBeenCalledWith(sessionData);
    expect(result).toHaveProperty("SessionID", 10);
  });
});

