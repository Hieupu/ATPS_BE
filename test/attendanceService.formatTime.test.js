const attendanceService = require("../services/attendanceService");

describe("attendanceService - formatTime", () => {
  test("UTCID01 - time '08:30:45' -> '08:30'", () => {
    expect(attendanceService.formatTime("08:30:45")).toBe("08:30");
  });

  test("UTCID02 - time '14:20' -> '14:20'", () => {
    expect(attendanceService.formatTime("14:20")).toBe("14:20");
  });

  test("UTCID03 - time = null -> trả về chuỗi rỗng", () => {
    expect(attendanceService.formatTime(null)).toBe("");
  });

  test("UTCID04 - time = undefined -> trả về chuỗi rỗng", () => {
    expect(attendanceService.formatTime(undefined)).toBe("");
  });

  test("UTCID05 - time = '1234' (không có dấu :) -> '1234:undefined'", () => {
    expect(attendanceService.formatTime("1234")).toBe("1234:undefined");
  });

  test("UTCID06 - time = '12-30' (format lạ) -> '12-30:undefined'", () => {
    expect(attendanceService.formatTime("12-30")).toBe("12-30:undefined");
  });

  test("UTCID07 - time = '' (rỗng) -> trả về chuỗi rỗng", () => {
    expect(attendanceService.formatTime("")).toBe("");
  });
});
