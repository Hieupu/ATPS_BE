jest.mock("../repositories/scheduleRepository", () => ({
  getClassesByInstructor: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getClassesByInstructor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId = 10, repo trả 2 classes (ClassID=1 Name=Math, ClassID=2) -> service trả 2-element array", async () => {
    scheduleRepository.getClassesByInstructor.mockResolvedValue([
      {
        ClassID: 1,
        ClassName: "Math",
        Status: "active",
        ZoomID: "123456",
        Zoompass: "pass123",
        CourseID: 10,
        StudentCount: 5,
      },
      {
        ClassID: 2,
        ClassName: "Physics",
        Status: "active",
        ZoomID: "789012",
        Zoompass: "pass456",
        CourseID: 11,
        StudentCount: 3,
      },
    ]);

    const result = await ScheduleService.getClassesByInstructor(10);

    expect(scheduleRepository.getClassesByInstructor).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("ClassID", 1);
    expect(result[0]).toHaveProperty("ClassName", "Math");
    expect(result[1]).toHaveProperty("ClassID", 2);
  });

  test("UTCID02 - instructorId = 10, repo trả empty array -> service trả Empty array", async () => {
    scheduleRepository.getClassesByInstructor.mockResolvedValue([]);

    const result = await ScheduleService.getClassesByInstructor(10);

    expect(scheduleRepository.getClassesByInstructor).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("UTCID03 - instructorId = 'abc', repo trả 1 class (ClassID=1) -> service trả 1-element array", async () => {
    scheduleRepository.getClassesByInstructor.mockResolvedValue([
      {
        ClassID: 1,
        ClassName: "Math",
        Status: "active",
        ZoomID: "123456",
        Zoompass: "pass123",
        CourseID: 10,
        StudentCount: 5,
      },
    ]);

    const result = await ScheduleService.getClassesByInstructor("abc");

    expect(scheduleRepository.getClassesByInstructor).toHaveBeenCalledWith(
      "abc"
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("ClassID", 1);
  });

  test("UTCID04 - instructorId = null, repo trả empty array -> service trả Empty array", async () => {
    scheduleRepository.getClassesByInstructor.mockResolvedValue([]);

    const result = await ScheduleService.getClassesByInstructor(null);

    expect(scheduleRepository.getClassesByInstructor).toHaveBeenCalledWith(
      null
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("UTCID05 - instructorId = 9999999, repo trả empty array -> service trả Empty array", async () => {
    scheduleRepository.getClassesByInstructor.mockResolvedValue([]);

    const result = await ScheduleService.getClassesByInstructor(9999999);

    expect(scheduleRepository.getClassesByInstructor).toHaveBeenCalledWith(
      9999999
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("UTCID06 - instructorId = 10, repo ném lỗi (DB fail) -> service log error và ném lại", async () => {
    scheduleRepository.getClassesByInstructor.mockRejectedValue(
      new Error("DB fail")
    );

    await expect(
      ScheduleService.getClassesByInstructor(10)
    ).rejects.toThrow("DB fail");
    expect(scheduleRepository.getClassesByInstructor).toHaveBeenCalledWith(10);
  });

  test("UTCID07 - instructorId = 10, repo trả class (ClassID=1) -> service trả correct data với đầy đủ fields", async () => {
    scheduleRepository.getClassesByInstructor.mockResolvedValue([
      {
        ClassID: 1,
        ClassName: "Math",
        Status: "active",
        ZoomID: "123456",
        Zoompass: "pass123",
        CourseID: 10,
        StudentCount: 5,
      },
    ]);

    const result = await ScheduleService.getClassesByInstructor(10);

    expect(scheduleRepository.getClassesByInstructor).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("ClassID", 1);
    expect(result[0]).toHaveProperty("ClassName", "Math");
    expect(result[0]).toHaveProperty("Status", "active");
    expect(result[0]).toHaveProperty("ZoomID", "123456");
    expect(result[0]).toHaveProperty("Zoompass", "pass123");
    expect(result[0]).toHaveProperty("CourseID", 10);
    expect(result[0]).toHaveProperty("StudentCount", 5);
  });
});

