const ProgressService = require("../services/progressService");

describe("progressService - getProgressStatus", () => {
  test("UTCID01 - percentage = 0 -> trả 'Chưa bắt đầu'", () => {
    const result = ProgressService.getProgressStatus(0);
    expect(result).toBe("Chưa bắt đầu");
  });

  test("UTCID02 - percentage = 5 -> trả 'Mới bắt đầu'", () => {
    const result = ProgressService.getProgressStatus(5);
    expect(result).toBe("Mới bắt đầu");
  });

  test("UTCID03 - percentage = 24 -> trả 'Mới bắt đầu'", () => {
    const result = ProgressService.getProgressStatus(24);
    expect(result).toBe("Mới bắt đầu");
  });

  test("UTCID04 - percentage = 25 -> trả 'Đang học'", () => {
    const result = ProgressService.getProgressStatus(25);
    expect(result).toBe("Đang học");
  });

  test("UTCID05 - percentage = 49 -> trả 'Đang học'", () => {
    const result = ProgressService.getProgressStatus(49);
    expect(result).toBe("Đang học");
  });

  test("UTCID06 - percentage = 50 -> trả 'Tiến triển tốt'", () => {
    const result = ProgressService.getProgressStatus(50);
    expect(result).toBe("Tiến triển tốt");
  });

  test("UTCID07 - percentage = 74 -> trả 'Tiến triển tốt'", () => {
    const result = ProgressService.getProgressStatus(74);
    expect(result).toBe("Tiến triển tốt");
  });

  test("UTCID08 - percentage = 75 -> trả 'Gần hoàn thành'", () => {
    const result = ProgressService.getProgressStatus(75);
    expect(result).toBe("Gần hoàn thành");
  });

  test("UTCID09 - percentage = 99 -> trả 'Gần hoàn thành'", () => {
    const result = ProgressService.getProgressStatus(99);
    expect(result).toBe("Gần hoàn thành");
  });

  test("UTCID10 - percentage = 100 -> trả 'Hoàn thành'", () => {
    const result = ProgressService.getProgressStatus(100);
    expect(result).toBe("Hoàn thành");
  });

  test("UTCID11 - percentage = 110 (invalid) -> trả 'Hoàn thành'", () => {
    const result = ProgressService.getProgressStatus(110);
    expect(result).toBe("Hoàn thành");
  });

  test("UTCID12 - percentage = -7 (invalid) -> trả 'Mới bắt đầu'", () => {
    const result = ProgressService.getProgressStatus(-7);
    expect(result).toBe("Mới bắt đầu");
  });
});

