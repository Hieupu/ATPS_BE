const profileService = require("../services/profileService");

describe("profileService - formatDateForMySQL", () => {
  test("UTCID01 - dateString = null -> trả về null", () => {
    const result = profileService.formatDateForMySQL(null);
    expect(result).toBeNull();
  });

  test('UTCID02 - dateString = "" (rỗng) -> trả về null', () => {
    const result = profileService.formatDateForMySQL("");
    expect(result).toBeNull();
  });

  test("UTCID03 - dateString dạng ISO có 'T' (2024-05-10T15:30:00Z) -> cắt còn YYYY-MM-DD", () => {
    const result = profileService.formatDateForMySQL("2024-05-10T15:30:00Z");
    expect(result).toBe("2024-05-10");
  });

  test("UTCID04 - dateString đã là định dạng YYYY-MM-DD (2024-05-10) -> giữ nguyên", () => {
    const result = profileService.formatDateForMySQL("2024-05-10");
    expect(result).toBe("2024-05-10");
  });

  test("UTCID05 - dateString ở format khác (05/10/2024) -> chuẩn hoá sang YYYY-MM-DD (tuỳ timezone, chỉ assert đúng năm-tháng-ngày)", () => {
    const result = profileService.formatDateForMySQL("05/10/2024");
    expect(result.startsWith("2024-05")).toBe(true);
  });
});
