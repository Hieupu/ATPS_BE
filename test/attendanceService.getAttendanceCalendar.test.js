jest.mock("../repositories/attendanceRepository", () => ({
  getAttendanceCalendar: jest.fn(),
}));

const attendanceRepository = require("../repositories/attendanceRepository");
const attendanceService = require("../services/attendanceService");

describe("attendanceService - getAttendanceCalendar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - learnerId hợp lệ, có bản ghi -> trả về data với StatusText và Time format", async () => {
    attendanceRepository.getAttendanceCalendar.mockResolvedValue([
      {
        SessionID: 1,
        Status: "Present",
        StartTime: "09:00:00",
        EndTime: "10:00:00",
        OtherField: "value",
      },
    ]);

    const result = await attendanceService.getAttendanceCalendar(1, 11, 2025);

    expect(attendanceRepository.getAttendanceCalendar).toHaveBeenCalledWith(
      1,
      11,
      2025
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      SessionID: 1,
      Status: "Present",
      StatusText: "Có mặt",
      Time: "09:00 - 10:00",
      OtherField: "value",
    });
  });

  test("UTCID02 - learnerId hợp lệ nhưng không có bản ghi -> trả về mảng rỗng", async () => {
    attendanceRepository.getAttendanceCalendar.mockResolvedValue([]);

    const result = await attendanceService.getAttendanceCalendar(1, 11, 2025);

    expect(attendanceRepository.getAttendanceCalendar).toHaveBeenCalledWith(
      1,
      11,
      2025
    );
    expect(result).toEqual([]);
  });

  test("UTCID03 - learnerId không tồn tại -> repo trả [], service trả []", async () => {
    attendanceRepository.getAttendanceCalendar.mockResolvedValue([]);

    const result = await attendanceService.getAttendanceCalendar(
      999999,
      11,
      2025
    );

    expect(attendanceRepository.getAttendanceCalendar).toHaveBeenCalledWith(
      999999,
      11,
      2025
    );
    expect(result).toEqual([]);
  });

  test("UTCID04 - repo ném lỗi -> service log và propagate lỗi", async () => {
    attendanceRepository.getAttendanceCalendar.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      attendanceService.getAttendanceCalendar(1, 11, 2025)
    ).rejects.toThrow("DB error");
  });
});
