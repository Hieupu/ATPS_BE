const { toDecimal2 } = require("../services/instructorCourseService");

describe("instructorCourseService - toDecimal2", () => {
  test("UTCID01 - input '123.456' -> 123.46", () => {
    expect(toDecimal2("123.456")).toBe(123.46);
  });

  test("UTCID02 - input 5 -> 5", () => {
    expect(toDecimal2(5)).toBe(5);
  });

  test("UTCID03 - input null -> fallback (0)", () => {
    expect(toDecimal2(null)).toBe(0);
  });

  test("UTCID04 - input undefined -> fallback (0)", () => {
    expect(toDecimal2(undefined)).toBe(0);
  });

  test("UTCID05 - input 'abc' -> fallback (5)", () => {
    expect(toDecimal2("abc", 5)).toBe(5);
  });
});
