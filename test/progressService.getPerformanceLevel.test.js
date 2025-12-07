const ProgressService = require("../services/progressService");

describe("progressService - getPerformanceLevel", () => {
  test("UTCID01 - avgScore = 10 -> trả 'Xuất sắc'", () => {
    const result = ProgressService.getPerformanceLevel(10);
    expect(result).toBe("Xuất sắc");
  });

  test("UTCID02 - avgScore = 9 -> trả 'Xuất sắc'", () => {
    const result = ProgressService.getPerformanceLevel(9);
    expect(result).toBe("Xuất sắc");
  });

  test("UTCID03 - avgScore = 8.5 -> trả 'Giỏi'", () => {
    const result = ProgressService.getPerformanceLevel(8.5);
    expect(result).toBe("Giỏi");
  });

  test("UTCID04 - avgScore = 8 -> trả 'Giỏi'", () => {
    const result = ProgressService.getPerformanceLevel(8);
    expect(result).toBe("Giỏi");
  });

  test("UTCID05 - avgScore = 7.5 -> trả 'Khá'", () => {
    const result = ProgressService.getPerformanceLevel(7.5);
    expect(result).toBe("Khá");
  });

  test("UTCID06 - avgScore = 7 -> trả 'Khá'", () => {
    const result = ProgressService.getPerformanceLevel(7);
    expect(result).toBe("Khá");
  });

  test("UTCID07 - avgScore = 6.5 -> trả 'Trung bình'", () => {
    const result = ProgressService.getPerformanceLevel(6.5);
    expect(result).toBe("Trung bình");
  });

  test("UTCID08 - avgScore = 6 -> trả 'Trung bình'", () => {
    const result = ProgressService.getPerformanceLevel(6);
    expect(result).toBe("Trung bình");
  });

  test("UTCID09 - avgScore = 5.5 -> trả 'Yếu'", () => {
    const result = ProgressService.getPerformanceLevel(5.5);
    expect(result).toBe("Yếu");
  });

  test("UTCID10 - avgScore = 5 -> trả 'Yếu'", () => {
    const result = ProgressService.getPerformanceLevel(5);
    expect(result).toBe("Yếu");
  });

  test("UTCID11 - avgScore = 4 -> trả 'Kém'", () => {
    const result = ProgressService.getPerformanceLevel(4);
    expect(result).toBe("Kém");
  });

  test("UTCID12 - avgScore = 0 -> trả 'Kém'", () => {
    const result = ProgressService.getPerformanceLevel(0);
    expect(result).toBe("Kém");
  });

  test("UTCID13 - avgScore = -1 -> trả 'Kém'", () => {
    const result = ProgressService.getPerformanceLevel(-1);
    expect(result).toBe("Kém");
  });

  test("UTCID14 - avgScore = 11 -> trả 'Xuất sắc'", () => {
    const result = ProgressService.getPerformanceLevel(11);
    expect(result).toBe("Xuất sắc");
  });
});

