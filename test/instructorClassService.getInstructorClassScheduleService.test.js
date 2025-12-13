jest.mock("../repositories/instructorClassRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorClassRosterRepository", () => ({
  getSessions: jest.fn(),
  getTotalEnrolledStudents: jest.fn(),
  getAttendedCount: jest.fn(),
}));

const instructorClassRepository = require("../repositories/instructorClassRepository");
const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const {
  getInstructorClassScheduleService,
} = require("../services/instructorClassService");

describe("instructorClassService - getInstructorClassScheduleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - classId=9999, instructorId=5, repo.findById trả null -> service throw Error 'Lớp học không tồn tại'", async () => {
    instructorClassRepository.findById.mockResolvedValue(null);

    await expect(getInstructorClassScheduleService(9999, 5)).rejects.toThrow(
      "Lớp học không tồn tại"
    );
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(9999);
    expect(instructorClassRosterRepository.getSessions).not.toHaveBeenCalled();
  });

  test("UTCID02 - classId=10, instructorId=55, repo.findById trả class với InstructorID=5 (khác instructorId) -> service throw Error 'Bạn không có quyền truy cập lớp này'", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 10,
      InstructorID: 5,
      Name: "Math Class",
    });

    await expect(getInstructorClassScheduleService(10, 55)).rejects.toThrow(
      "Bạn không có quyền truy cập lớp này"
    );
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(10);
    expect(instructorClassRosterRepository.getSessions).not.toHaveBeenCalled();
  });

  test("UTCID03 - classId=10, instructorId=5, repo.findById trả class, getSessions trả [] -> service return {Sessions: []}", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 10,
      InstructorID: 5,
      Name: "Math Class",
    });
    instructorClassRosterRepository.getSessions.mockResolvedValue([]);
    instructorClassRosterRepository.getTotalEnrolledStudents.mockResolvedValue(
      0
    );

    const result = await getInstructorClassScheduleService(10, 5);

    expect(instructorClassRepository.findById).toHaveBeenCalledWith(10);
    expect(instructorClassRosterRepository.getSessions).toHaveBeenCalledWith(
      10,
      5
    );
    expect(result).toHaveProperty("Sessions");
    expect(Array.isArray(result.Sessions)).toBe(true);
    expect(result.Sessions).toHaveLength(0);
  });

  test("UTCID04 - classId=10, instructorId=5, repo trả class, getSessions trả 2 sessions, totalStudents=5, attendedCount khác nhau -> service return sessions với isFullyMarked=false và isFullyMarked=true", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 10,
      InstructorID: 5,
      Name: "Math Class",
    });
    instructorClassRosterRepository.getSessions.mockResolvedValue([
      {
        sessionId: 1,
        Title: "Session 1",
        Date: "2025-11-25",
      },
      {
        sessionId: 2,
        Title: "Session 2",
        Date: "2025-11-26",
      },
    ]);
    instructorClassRosterRepository.getTotalEnrolledStudents.mockResolvedValue(
      5
    );
    instructorClassRosterRepository.getAttendedCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);

    const result = await getInstructorClassScheduleService(10, 5);

    expect(instructorClassRepository.findById).toHaveBeenCalledWith(10);
    expect(instructorClassRosterRepository.getSessions).toHaveBeenCalledWith(
      10,
      5
    );
    expect(result).toHaveProperty("Sessions");
    expect(result.Sessions).toHaveLength(2);
    expect(result.Sessions[0]).toHaveProperty("isFullyMarked", false);
    expect(result.Sessions[0]).toHaveProperty("attendedCount", 3);
    expect(result.Sessions[0]).toHaveProperty("totalStudents", 5);
    expect(result.Sessions[1]).toHaveProperty("isFullyMarked", true);
    expect(result.Sessions[1]).toHaveProperty("attendedCount", 5);
    expect(result.Sessions[1]).toHaveProperty("totalStudents", 5);
  });
});
