const ProgressService = require("../services/progressService");

describe("progressService - getProgressColor", () => {
  test("UTCID01 - percentage = 100 -> trả 'success'", () => {
    const result = ProgressService.getProgressColor(100);
    expect(result).toBe("success");
  });

  test("UTCID02 - percentage = 80 -> trả 'success'", () => {
    const result = ProgressService.getProgressColor(80);
    expect(result).toBe("success");
  });

  test("UTCID03 - percentage = 79 -> trả 'warning'", () => {
    const result = ProgressService.getProgressColor(79);
    expect(result).toBe("warning");
  });

  test("UTCID04 - percentage = 50 -> trả 'warning'", () => {
    const result = ProgressService.getProgressColor(50);
    expect(result).toBe("warning");
  });

  test("UTCID05 - percentage = 49 -> trả 'error'", () => {
    const result = ProgressService.getProgressColor(49);
    expect(result).toBe("error");
  });

  test("UTCID06 - percentage = 0 -> trả 'error'", () => {
    const result = ProgressService.getProgressColor(0);
    expect(result).toBe("error");
  });

  test("UTCID07 - percentage = -10 -> trả 'error'", () => {
    const result = ProgressService.getProgressColor(-10);
    expect(result).toBe("error");
  });

  test("UTCID08 - percentage = 110 -> trả 'success'", () => {
    const result = ProgressService.getProgressColor(110);
    expect(result).toBe("success");
  });
});

