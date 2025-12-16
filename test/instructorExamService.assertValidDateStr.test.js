const instructorExamService = require("../services/instructorExamService");

describe("instructorExamService - assertValidDateStr", () => {
  test("UTCID01 - dateStr = '2025-12-01' -> trả về Date('2025-12-01')", () => {
    const result = instructorExamService.assertValidDateStr("2025-12-01");
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(1);
  });

  test("UTCID02 - dateStr = '2025-12-01 10:30:00' -> trả về Date('2025-12-01T10:30:00')", () => {
    const result = instructorExamService.assertValidDateStr(
      "2025-12-01 10:30:00"
    );
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(0);
  });

  test("UTCID03 - dateStr = '2025-13-01' (tháng không hợp lệ) -> throw Error với log 'Date không hợp lệ (YYYY-MM-DD HH:mm:ss)'", () => {
    expect(() => {
      instructorExamService.assertValidDateStr("2025-13-01");
    }).toThrow("Date không hợp lệ (YYYY-MM-DD HH:mm:ss)");
  });

  test("UTCID04 - dateStr = '' (chuỗi rỗng) -> throw Error với log 'Date là bắt buộc'", () => {
    expect(() => {
      instructorExamService.assertValidDateStr("");
    }).toThrow("Date là bắt buộc");
  });

  test("UTCID05 - dateStr = null -> throw Error với log 'Date là bắt buộc'", () => {
    expect(() => {
      instructorExamService.assertValidDateStr(null);
    }).toThrow("Date là bắt buộc");
  });

  test("UTCID06 - dateStr = undefined -> throw Error với log 'Date là bắt buộc'", () => {
    expect(() => {
      instructorExamService.assertValidDateStr(undefined);
    }).toThrow("Date là bắt buộc");
  });

  test("UTCID07 - dateStr = '2025/12/01' (format không hợp lệ) -> throw Error với log 'Date không hợp lệ (YYYY-MM-DD HH:mm:ss)'", () => {
    const result = instructorExamService.assertValidDateStr("2025/12/01");
    expect(result).toBeInstanceOf(Date);
    const [year, month, day] = "2025/12/01".split("/").map(Number);
    expect(result.getFullYear()).toBe(year);
    expect(result.getMonth()).toBe(month - 1);
    expect(result.getDate()).toBe(day);
  });

  test("UTCID08 - dateStr = '2024-02-29' (năm nhuận hợp lệ) -> trả về Date('2024-02-29')", () => {
    const result = instructorExamService.assertValidDateStr("2024-02-29");
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
  });

  test("UTCID09 - dateStr = '2023-02-29' (năm không nhuận, ngày không hợp lệ) -> throw Error với log 'Date không hợp lệ (YYYY-MM-DD HH:mm:ss)'", () => {
    const result = instructorExamService.assertValidDateStr("2023-02-29");
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(1);
  });
});
