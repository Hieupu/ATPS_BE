jest.mock("../repositories/attendanceRepository", () => ({
  getAttendanceByClass: jest.fn(),
}));

const attendanceRepository = require("../repositories/attendanceRepository");
const attendanceService = require("../services/attendanceService");

describe("attendanceService - getAttendanceByClass", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - learnerId hợp lệ, repo trả dữ liệu -> thêm grade và status dựa trên AttendanceRate", async () => {
    attendanceRepository.getAttendanceByClass.mockResolvedValue([
      {
        ClassID: 1,
        ClassName: "Class A",
        AttendanceRate: 80,
      },
    ]);

    const result = await attendanceService.getAttendanceByClass(1);

    expect(attendanceRepository.getAttendanceByClass).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      ClassID: 1,
      ClassName: "Class A",
      AttendanceRate: 80,
      grade: "Khá",
      status: "Tốt",
    });
  });

  test("UTCID02 - learnerId hợp lệ nhưng repo trả [] -> trả mảng rỗng", async () => {
    attendanceRepository.getAttendanceByClass.mockResolvedValue([]);

    const result = await attendanceService.getAttendanceByClass(3);

    expect(attendanceRepository.getAttendanceByClass).toHaveBeenCalledWith(3);
    expect(result).toEqual([]);
  });

  test("UTCID03 - repo ném lỗi -> service log và propagate lỗi", async () => {
    attendanceRepository.getAttendanceByClass.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      attendanceService.getAttendanceByClass(4)
    ).rejects.toThrow("DB error");
  });

  test("UTCID04 - AttendanceRate = null -> grade và status tính với 0", async () => {
    attendanceRepository.getAttendanceByClass.mockResolvedValue([
      {
        ClassID: 2,
        ClassName: "Class B",
        AttendanceRate: null,
      },
    ]);

    const result = await attendanceService.getAttendanceByClass(5);

    expect(result[0]).toMatchObject({
      ClassID: 2,
      ClassName: "Class B",
      AttendanceRate: null,
      grade: "Cần cải thiện",
      status: "Cần cải thiện",
    });
  });

  test("UTCID05 - AttendanceRate = undefined -> grade và status tính với 0", async () => {
    attendanceRepository.getAttendanceByClass.mockResolvedValue([
      {
        ClassID: 3,
        ClassName: "Class C",
        AttendanceRate: undefined,
      },
    ]);

    const result = await attendanceService.getAttendanceByClass(6);

    expect(result[0]).toMatchObject({
      ClassID: 3,
      ClassName: "Class C",
      AttendanceRate: undefined,
      grade: "Cần cải thiện",
      status: "Cần cải thiện",
    });
  });

  test('UTCID06 - AttendanceRate = "abc" -> giữ nguyên AttendanceRate, grade/status "Cần cải thiện"', async () => {
    attendanceRepository.getAttendanceByClass.mockResolvedValue([
      {
        ClassID: 4,
        ClassName: "Class D",
        AttendanceRate: "abc",
      },
    ]);

    const result = await attendanceService.getAttendanceByClass(7);

    expect(result[0]).toMatchObject({
      ClassID: 4,
      ClassName: "Class D",
      AttendanceRate: "abc",
      grade: "Cần cải thiện",
      status: "Cần cải thiện",
    });
  });
});


