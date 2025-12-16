jest.mock("../repositories/attendanceRepository", () => ({
  updateAttendance: jest.fn(),
}));

const attendanceRepository = require("../repositories/attendanceRepository");
const attendanceService = require("../services/attendanceService");

describe("attendanceService - updateAttendance", () => {
  const attendanceId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - attendanceId hợp lệ, status = 'Present' -> gọi repository và trả về result", async () => {
    attendanceRepository.updateAttendance.mockResolvedValue({ affectedRows: 1 });

    const result = await attendanceService.updateAttendance(
      attendanceId,
      "Present"
    );

    expect(attendanceRepository.updateAttendance).toHaveBeenCalledWith(
      attendanceId,
      "Present"
    );
    expect(result).toEqual({ affectedRows: 1 });
  });

  test("UTCID02 - status = 'Late' hợp lệ -> gọi repository thành công", async () => {
    attendanceRepository.updateAttendance.mockResolvedValue({ affectedRows: 1 });

    await attendanceService.updateAttendance(attendanceId, "Late");

    expect(attendanceRepository.updateAttendance).toHaveBeenCalledWith(
      attendanceId,
      "Late"
    );
  });

  test("UTCID03 - status = 'Absent' hợp lệ -> gọi repository thành công", async () => {
    attendanceRepository.updateAttendance.mockResolvedValue({ affectedRows: 1 });

    await attendanceService.updateAttendance(attendanceId, "Absent");

    expect(attendanceRepository.updateAttendance).toHaveBeenCalledWith(
      attendanceId,
      "Absent"
    );
  });

  test("UTCID04 - status = 'Excused' hợp lệ -> gọi repository thành công", async () => {
    attendanceRepository.updateAttendance.mockResolvedValue({ affectedRows: 1 });

    await attendanceService.updateAttendance(attendanceId, "Excused");

    expect(attendanceRepository.updateAttendance).toHaveBeenCalledWith(
      attendanceId,
      "Excused"
    );
  });

  test("UTCID05 - status = 'Holiday' không hợp lệ -> ném lỗi 'Status không hợp lệ' và không gọi repository", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      attendanceService.updateAttendance(attendanceId, "Holiday")
    ).rejects.toThrow("Status không hợp lệ");

    expect(attendanceRepository.updateAttendance).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("UTCID06 - status = null -> ném lỗi 'Status không hợp lệ'", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      attendanceService.updateAttendance(attendanceId, null)
    ).rejects.toThrow("Status không hợp lệ");

    expect(attendanceRepository.updateAttendance).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("UTCID07 - repository updateAttendance ném lỗi -> service log và propagate lỗi", async () => {
    attendanceRepository.updateAttendance.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      attendanceService.updateAttendance(attendanceId, "Present")
    ).rejects.toThrow("DB error");
  });
});


