const attendanceService = require("../services/attendanceService");

describe("attendanceService - calculateAttendanceGrade", () => {
  test("UTCID01 - rate = 95 -> Xuất sắc", () => {
    expect(attendanceService.calculateAttendanceGrade(95)).toBe("Xuất sắc");
  });

  test("UTCID02 - rate = 85 -> Tốt", () => {
    expect(attendanceService.calculateAttendanceGrade(85)).toBe("Tốt");
  });

  test("UTCID03 - rate = 72 -> Trung bình", () => {
    expect(attendanceService.calculateAttendanceGrade(72)).toBe("Trung bình");
  });

  test("UTCID04 - rate = 65 -> Trung bình", () => {
    expect(attendanceService.calculateAttendanceGrade(65)).toBe("Trung bình");
  });

  test("UTCID05 - rate = 50 -> Cần cải thiện", () => {
    expect(attendanceService.calculateAttendanceGrade(50)).toBe("Cần cải thiện");
  });

  test("UTCID06 - rate = 90 (>=95 boundary dưới) -> Tốt", () => {
    expect(attendanceService.calculateAttendanceGrade(90)).toBe("Tốt");
  });

  test("UTCID07 - rate = 80 -> Khá", () => {
    expect(attendanceService.calculateAttendanceGrade(80)).toBe("Khá");
  });

  test("UTCID08 - rate = 70 -> Trung bình", () => {
    expect(attendanceService.calculateAttendanceGrade(70)).toBe("Trung bình");
  });

  test("UTCID09 - rate = 60 -> Cần cải thiện", () => {
    expect(attendanceService.calculateAttendanceGrade(60)).toBe("Cần cải thiện");
  });

  test("UTCID10 - rate = -5 (dưới 0) -> Cần cải thiện", () => {
    expect(attendanceService.calculateAttendanceGrade(-5)).toBe("Cần cải thiện");
  });

  test("UTCID11 - rate = 120 (trên 100) -> Xuất sắc", () => {
    expect(attendanceService.calculateAttendanceGrade(120)).toBe("Xuất sắc");
  });
});


