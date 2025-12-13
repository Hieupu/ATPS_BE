jest.mock("../repositories/instructorClassRosterRepository", () => ({
  getSessionsByInstructor: jest.fn(),
  getTotalEnrolledStudents: jest.fn(),
  getAttendedCount: jest.fn(),
}));

const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const {
  getInstructorScheduleService,
} = require("../services/instructorClassService");

describe("instructorClassService - getInstructorScheduleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId=10, repo.getSessionsByInstructor trả null -> service return {Sessions: [], message: 'Không có buổi học nào'}", async () => {
    instructorClassRosterRepository.getSessionsByInstructor.mockResolvedValue(
      null
    );

    const result = await getInstructorScheduleService(10);

    expect(
      instructorClassRosterRepository.getSessionsByInstructor
    ).toHaveBeenCalledWith(10);
    expect(result).toHaveProperty("Sessions");
    expect(Array.isArray(result.Sessions)).toBe(true);
    expect(result.Sessions).toHaveLength(0);
    expect(result).toHaveProperty("message", "Không có buổi học nào");
  });

  test("UTCID02 - instructorId=10, repo.getSessionsByInstructor trả [] -> service return {Sessions: [], message: 'Không có buổi học nào'}", async () => {
    instructorClassRosterRepository.getSessionsByInstructor.mockResolvedValue(
      []
    );

    const result = await getInstructorScheduleService(10);

    expect(
      instructorClassRosterRepository.getSessionsByInstructor
    ).toHaveBeenCalledWith(10);
    expect(result).toHaveProperty("Sessions");
    expect(Array.isArray(result.Sessions)).toBe(true);
    expect(result.Sessions).toHaveLength(0);
    expect(result).toHaveProperty("message", "Không có buổi học nào");
  });

  test("UTCID03 - instructorId=10, repo.getSessionsByInstructor trả [{sessionId:1, classId:100}] -> service return {Sessions: [{sessionId:1, classId:100...}]}", async () => {
    instructorClassRosterRepository.getSessionsByInstructor.mockResolvedValue([
      {
        sessionId: 1,
        classId: 100,
        Title: "Session 1",
        Date: "2025-11-25",
      },
    ]);
    instructorClassRosterRepository.getTotalEnrolledStudents.mockResolvedValue(
      5
    );
    instructorClassRosterRepository.getAttendedCount.mockResolvedValue(3);

    const result = await getInstructorScheduleService(10);

    expect(
      instructorClassRosterRepository.getSessionsByInstructor
    ).toHaveBeenCalledWith(10);
    expect(result).toHaveProperty("Sessions");
    expect(result.Sessions).toHaveLength(1);
    expect(result.Sessions[0]).toHaveProperty("sessionId", 1);
    expect(result.Sessions[0]).toHaveProperty("classId", 100);
    expect(result.Sessions[0]).toHaveProperty("attendedCount", 3);
    expect(result.Sessions[0]).toHaveProperty("totalStudents", 5);
    expect(result.Sessions[0]).toHaveProperty("isFullyMarked", false);
  });

  test("UTCID04 - instructorId=10, repo.getSessionsByInstructor trả data, attendedCount === totalStudents -> service return {Sessions: [..., isFullyMarked: true]}", async () => {
    instructorClassRosterRepository.getSessionsByInstructor.mockResolvedValue([
      {
        sessionId: 1,
        classId: 100,
        Title: "Session 1",
        Date: "2025-11-25",
      },
    ]);
    instructorClassRosterRepository.getTotalEnrolledStudents.mockResolvedValue(
      5
    );
    instructorClassRosterRepository.getAttendedCount.mockResolvedValue(5);

    const result = await getInstructorScheduleService(10);

    expect(
      instructorClassRosterRepository.getSessionsByInstructor
    ).toHaveBeenCalledWith(10);
    expect(result).toHaveProperty("Sessions");
    expect(result.Sessions).toHaveLength(1);
    expect(result.Sessions[0]).toHaveProperty("isFullyMarked", true);
    expect(result.Sessions[0]).toHaveProperty("attendedCount", 5);
    expect(result.Sessions[0]).toHaveProperty("totalStudents", 5);
  });

  test("UTCID05 - instructorId=10, repo.getSessionsByInstructor trả data, attendedCount < totalStudents -> service return {Sessions: [..., isFullyMarked: false]}", async () => {
    instructorClassRosterRepository.getSessionsByInstructor.mockResolvedValue([
      {
        sessionId: 1,
        classId: 100,
        Title: "Session 1",
        Date: "2025-11-25",
      },
    ]);
    instructorClassRosterRepository.getTotalEnrolledStudents.mockResolvedValue(
      5
    );
    instructorClassRosterRepository.getAttendedCount.mockResolvedValue(2);

    const result = await getInstructorScheduleService(10);

    expect(
      instructorClassRosterRepository.getSessionsByInstructor
    ).toHaveBeenCalledWith(10);
    expect(result).toHaveProperty("Sessions");
    expect(result.Sessions).toHaveLength(1);
    expect(result.Sessions[0]).toHaveProperty("isFullyMarked", false);
    expect(result.Sessions[0]).toHaveProperty("attendedCount", 2);
    expect(result.Sessions[0]).toHaveProperty("totalStudents", 5);
  });

  test("UTCID06 - instructorId=10, repo.getSessionsByInstructor trả multiple sessions với different classIds -> service return correct enrichment list for each session", async () => {
    instructorClassRosterRepository.getSessionsByInstructor.mockResolvedValue([
      {
        sessionId: 1,
        classId: 100,
        Title: "Session 1",
        Date: "2025-11-25",
      },
      {
        sessionId: 2,
        classId: 200,
        Title: "Session 2",
        Date: "2025-11-26",
      },
    ]);
    instructorClassRosterRepository.getTotalEnrolledStudents
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(10);
    instructorClassRosterRepository.getAttendedCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(10);

    const result = await getInstructorScheduleService(10);

    expect(
      instructorClassRosterRepository.getSessionsByInstructor
    ).toHaveBeenCalledWith(10);
    expect(result).toHaveProperty("Sessions");
    expect(result.Sessions).toHaveLength(2);
    expect(result.Sessions[0]).toHaveProperty("sessionId", 1);
    expect(result.Sessions[0]).toHaveProperty("classId", 100);
    expect(result.Sessions[0]).toHaveProperty("attendedCount", 3);
    expect(result.Sessions[0]).toHaveProperty("totalStudents", 5);
    expect(result.Sessions[0]).toHaveProperty("isFullyMarked", false);
    expect(result.Sessions[1]).toHaveProperty("sessionId", 2);
    expect(result.Sessions[1]).toHaveProperty("classId", 200);
    expect(result.Sessions[1]).toHaveProperty("attendedCount", 10);
    expect(result.Sessions[1]).toHaveProperty("totalStudents", 10);
    expect(result.Sessions[1]).toHaveProperty("isFullyMarked", true);
  });

  test("UTCID07 - instructorId=10, repo.getSessionsByInstructor throw Error('DB') -> service throw error", async () => {
    instructorClassRosterRepository.getSessionsByInstructor.mockRejectedValue(
      new Error("DB")
    );

    await expect(getInstructorScheduleService(10)).rejects.toThrow("DB");
    expect(
      instructorClassRosterRepository.getSessionsByInstructor
    ).toHaveBeenCalledWith(10);
  });
});

