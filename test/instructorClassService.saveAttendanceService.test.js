jest.mock("../repositories/instructorClassRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorClassRosterRepository", () => ({
  getSessions: jest.fn(),
  getStudents: jest.fn(),
}));

jest.mock("../repositories/instructorAttendanceRepository", () => ({
  saveAttendance: jest.fn(),
}));

const instructorClassRepository = require("../repositories/instructorClassRepository");
const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const instructorAttendanceRepository = require("../repositories/instructorAttendanceRepository");
const {
  saveAttendanceService,
} = require("../services/instructorClassService");

describe("instructorClassService - saveAttendanceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - sessionId=1, classId=100, instructorId=10, attendanceData=[], repo.findById trả null -> service throw Error 'Lớp học không tồn tại'", async () => {
    instructorClassRepository.findById.mockResolvedValue(null);

    await expect(
      saveAttendanceService(1, 100, 10, [])
    ).rejects.toThrow("Lớp học không tồn tại");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(instructorClassRosterRepository.getSessions).not.toHaveBeenCalled();
  });

  test("UTCID02 - sessionId=1, classId=100, instructorId=10, attendanceData=[{LearnerID: 3}], repo.findById trả {InstructorID: 999} -> service throw Error 'Bạn không có quyền điểm danh lớp này'", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 999,
      Name: "Math Class",
    });

    await expect(
      saveAttendanceService(1, 100, 10, [{ LearnerID: 3 }])
    ).rejects.toThrow("Bạn không có quyền điểm danh lớp này");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(instructorClassRosterRepository.getSessions).not.toHaveBeenCalled();
  });

  test("UTCID03 - sessionId=2, classId=100, instructorId=10, attendanceData=[{LearnerID: 5}, {LearnerID: 6}], repo.findById trả class, getSessions không có sessionId=2 -> service throw Error 'Buổi học không thuộc lớp này'", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorClassRosterRepository.getSessions.mockResolvedValue([
      {
        sessionId: 1,
        Title: "Session 1",
      },
    ]);

    await expect(
      saveAttendanceService(2, 100, 10, [
        { LearnerID: 5 },
        { LearnerID: 6 },
      ])
    ).rejects.toThrow("Buổi học không thuộc lớp này");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(instructorClassRosterRepository.getSessions).toHaveBeenCalledWith(
      100,
      10
    );
    expect(instructorClassRosterRepository.getStudents).not.toHaveBeenCalled();
  });

  test("UTCID04 - sessionId=1, classId=100, instructorId=10, attendanceData=[{LearnerID: 3}], repo.findById trả class, getSessions có sessionId=1, getStudents không có LearnerID=3 -> service throw Error 'Học viên không thuộc lớp: 3'", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorClassRosterRepository.getSessions.mockResolvedValue([
      {
        sessionId: 1,
        Title: "Session 1",
      },
    ]);
    instructorClassRosterRepository.getStudents.mockResolvedValue([
      {
        LearnerID: 1,
        FullName: "John Doe",
      },
      {
        LearnerID: 2,
        FullName: "Jane Smith",
      },
    ]);

    await expect(
      saveAttendanceService(1, 100, 10, [{ LearnerID: 3, Status: "Present" }])
    ).rejects.toThrow("Học viên không thuộc lớp: 3");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(instructorClassRosterRepository.getSessions).toHaveBeenCalledWith(
      100,
      10
    );
    expect(instructorClassRosterRepository.getStudents).toHaveBeenCalledWith(
      100
    );
    expect(
      instructorAttendanceRepository.saveAttendance
    ).not.toHaveBeenCalled();
  });

  test("UTCID05 - sessionId=1, classId=100, instructorId=10, attendanceData=[{LearnerID: 5}, {LearnerID: 6}], repo.findById trả class, getSessions có sessionId=1, getStudents không có LearnerID=5,6 -> service throw Error 'Học viên không thuộc lớp: 5, 6'", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorClassRosterRepository.getSessions.mockResolvedValue([
      {
        sessionId: 1,
        Title: "Session 1",
      },
    ]);
    instructorClassRosterRepository.getStudents.mockResolvedValue([
      {
        LearnerID: 1,
        FullName: "John Doe",
      },
      {
        LearnerID: 2,
        FullName: "Jane Smith",
      },
    ]);

    await expect(
      saveAttendanceService(1, 100, 10, [
        { LearnerID: 5, Status: "Present" },
        { LearnerID: 6, Status: "Absent" },
      ])
    ).rejects.toThrow("Học viên không thuộc lớp: 5, 6");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(instructorClassRosterRepository.getSessions).toHaveBeenCalledWith(
      100,
      10
    );
    expect(instructorClassRosterRepository.getStudents).toHaveBeenCalledWith(
      100
    );
    expect(
      instructorAttendanceRepository.saveAttendance
    ).not.toHaveBeenCalled();
  });

  test("UTCID06 - sessionId=1, classId=100, instructorId=10, attendanceData=[{LearnerID: 1}], repo.findById trả class, getSessions throw error -> service throw error", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorClassRosterRepository.getSessions.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      saveAttendanceService(1, 100, 10, [{ LearnerID: 1, Status: "Present" }])
    ).rejects.toThrow("DB error");
    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(instructorClassRosterRepository.getSessions).toHaveBeenCalledWith(
      100,
      10
    );
  });

  test("UTCID07 - sessionId=1, classId=100, instructorId=10, attendanceData=[{LearnerID: 1, Status:'Present'}], all valid -> service return {success: true, message: 'Điểm danh đã được lưu thành công'}", async () => {
    instructorClassRepository.findById.mockResolvedValue({
      ClassID: 100,
      InstructorID: 10,
      Name: "Math Class",
    });
    instructorClassRosterRepository.getSessions.mockResolvedValue([
      {
        sessionId: 1,
        Title: "Session 1",
      },
    ]);
    instructorClassRosterRepository.getStudents.mockResolvedValue([
      {
        LearnerID: 1,
        FullName: "John Doe",
      },
    ]);
    instructorAttendanceRepository.saveAttendance.mockResolvedValue();

    const result = await saveAttendanceService(1, 100, 10, [
      { LearnerID: 1, Status: "Present" },
    ]);

    expect(instructorClassRepository.findById).toHaveBeenCalledWith(100);
    expect(instructorClassRosterRepository.getSessions).toHaveBeenCalledWith(
      100,
      10
    );
    expect(instructorClassRosterRepository.getStudents).toHaveBeenCalledWith(
      100
    );
    expect(instructorAttendanceRepository.saveAttendance).toHaveBeenCalledWith(
      1,
      [{ LearnerID: 1, Status: "Present" }]
    );
    expect(result).toEqual({
      success: true,
      message: "Điểm danh đã được lưu thành công",
    });
  });
});

