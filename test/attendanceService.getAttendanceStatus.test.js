const attendanceService = require("../services/attendanceService");

describe("attendanceService - getAttendanceStatus", () => {
  test("UTCID01 - rate = 85 -> Tốt", () => {
    expect(attendanceService.getAttendanceStatus(85)).toBe("Tốt");
  });

  test("UTCID02 - rate = 70 -> Khá", () => {
    expect(attendanceService.getAttendanceStatus(70)).toBe("Khá");
  });

  test("UTCID03 - rate = 50 -> Trung bình", () => {
    expect(attendanceService.getAttendanceStatus(50)).toBe("Trung bình");
  });

  test("UTCID04 - rate = 30 -> Cần cải thiện", () => {
    expect(attendanceService.getAttendanceStatus(30)).toBe("Cần cải thiện");
  });

  test("UTCID05 - rate = 80 (biên trên của Khá) -> Tốt", () => {
    expect(attendanceService.getAttendanceStatus(80)).toBe("Tốt");
  });

  test("UTCID06 - rate = 60 -> Khá", () => {
    expect(attendanceService.getAttendanceStatus(60)).toBe("Khá");
  });

  test("UTCID07 - rate = 40 -> Trung bình", () => {
    expect(attendanceService.getAttendanceStatus(40)).toBe("Trung bình");
  });

  test("UTCID08 - rate = 0 -> Cần cải thiện", () => {
    expect(attendanceService.getAttendanceStatus(0)).toBe("Cần cải thiện");
  });

  test("UTCID09 - rate = -10 -> Cần cải thiện", () => {
    expect(attendanceService.getAttendanceStatus(-10)).toBe("Cần cải thiện");
  });

  test("UTCID10 - rate = 130 -> Tốt", () => {
    expect(attendanceService.getAttendanceStatus(130)).toBe("Tốt");
  });
});


