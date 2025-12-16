jest.mock("../repositories/instructorClassRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorAttendanceRepository", () => ({
  getAttendanceSheet: jest.fn(),
}));

const instructorClassRepository = require("../repositories/instructorClassRepository");
const instructorAttendanceRepository = require("../repositories/instructorAttendanceRepository");
const {
  getAttendanceSheetService,
} = require("../services/instructorClassService");

describe("instructorClassService - getAttendanceSheetService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - sessionId=1, classId=100, instructorId=10, repo.findById trả null -> service throw Error 'Lớp học không tồn tại'", async () => {
    instructorClassRepository.findById.mockResolvedValue(null);

    await expect(
      getAttendanceSheetService(1, 100, 10)
    ).rejects.toThrow("Lớp học không tồn tại");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(
      instructorAttendanceRepository.getAttendanceSheet
    ).not.toHaveBeenCalled();
  });

  test("UTCID02 - sessionId=1, classId=100, instructorId=10, repo.findById trả {InstructorID: 999} (khác instructorId) -> service throw Error 'Bạn không có quyền truy cập lớp này'", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 999,
      Name: "Math Class",
    });

    await expect(
      getAttendanceSheetService(1, 100, 10)
    ).rejects.toThrow("Bạn không có quyền truy cập lớp này");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(
      instructorAttendanceRepository.getAttendanceSheet
    ).not.toHaveBeenCalled();
  });

  test("UTCID03 - sessionId=1, classId=100, instructorId=10, repo.findById trả {}, getAttendanceSheet trả [] -> service return {SessionID: 1, ClassID: 100, AttendanceRecords: []}", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorAttendanceRepository.getAttendanceSheet.mockResolvedValue([]);

    const result = await getAttendanceSheetService(1, 100, 10);

    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(
      instructorAttendanceRepository.getAttendanceSheet
    ).toHaveBeenCalledWith(1, 100);
    expect(result).toHaveProperty("SessionID", 1);
    expect(result).toHaveProperty("ClassID", 100);
    expect(result).toHaveProperty("AttendanceRecords");
    expect(Array.isArray(result.AttendanceRecords)).toBe(true);
    expect(result.AttendanceRecords).toHaveLength(0);
  });

  test("UTCID04 - sessionId=1, classId=100, instructorId=10, repo.findById trả {}, getAttendanceSheet trả [...] -> service return {SessionID: 1, ClassID: 100, AttendanceRecords: [...]}", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorAttendanceRepository.getAttendanceSheet.mockResolvedValue([
      {
        LearnerID: 1,
        FullName: "John Doe",
        Status: "Present",
      },
      {
        LearnerID: 2,
        FullName: "Jane Smith",
        Status: "Absent",
      },
    ]);

    const result = await getAttendanceSheetService(1, 100, 10);

    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(
      instructorAttendanceRepository.getAttendanceSheet
    ).toHaveBeenCalledWith(1, 100);
    expect(result).toHaveProperty("SessionID", 1);
    expect(result).toHaveProperty("ClassID", 100);
    expect(result).toHaveProperty("AttendanceRecords");
    expect(Array.isArray(result.AttendanceRecords)).toBe(true);
    expect(result.AttendanceRecords).toHaveLength(2);
  });

  test("UTCID05 - sessionId=1, classId=100, instructorId=10, repo.findById trả {}, getAttendanceSheet trả null -> service return {SessionID: 1, ClassID: 100, AttendanceRecords: null}", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorAttendanceRepository.getAttendanceSheet.mockResolvedValue(null);

    const result = await getAttendanceSheetService(1, 100, 10);

    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(
      instructorAttendanceRepository.getAttendanceSheet
    ).toHaveBeenCalledWith(1, 100);
    expect(result).toHaveProperty("SessionID", 1);
    expect(result).toHaveProperty("ClassID", 100);
    expect(result).toHaveProperty("AttendanceRecords", null);
  });

  test("UTCID06 - sessionId=1, classId=100, instructorId=10, repo.findById trả {}, getAttendanceSheet throw error -> service throw error", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorAttendanceRepository.getAttendanceSheet.mockRejectedValue(
      new Error("Repository error")
    );

    await expect(
      getAttendanceSheetService(1, 100, 10)
    ).rejects.toThrow("Repository error");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(
      instructorAttendanceRepository.getAttendanceSheet
    ).toHaveBeenCalledWith(1, 100);
  });

  test("UTCID07 - sessionId=0, classId=0, instructorId=0, repo.findById trả {}, getAttendanceSheet trả [] -> service return {SessionID: 0, ClassID: 0, AttendanceRecords: []}", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 0,
      InstructorID: 0,
      Name: "Test Class",
    });
    instructorAttendanceRepository.getAttendanceSheet.mockResolvedValue([]);

    const result = await getAttendanceSheetService(0, 0, 0);

    expect(instructorClassRepository.findById).toHaveBeenCalledWith(0);
    expect(
      instructorAttendanceRepository.getAttendanceSheet
    ).toHaveBeenCalledWith(0, 0);
    expect(result).toHaveProperty("SessionID", 0);
    expect(result).toHaveProperty("ClassID", 0);
    expect(result).toHaveProperty("AttendanceRecords");
    expect(Array.isArray(result.AttendanceRecords)).toBe(true);
    expect(result.AttendanceRecords).toHaveLength(0);
  });
});

