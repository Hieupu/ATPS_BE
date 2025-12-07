const { makeCourseCode } = require("../services/instructorCourseService");

describe("instructorCourseService - makeCourseCode", () => {
  function expectPrefix(title, expectedPrefix) {
    const code = makeCourseCode(title);
    const [prefix, suffix] = code.split("-");
    expect(prefix).toBe(expectedPrefix);
    expect(suffix).toMatch(/^[A-Z0-9]{4}$/);
  }

  test('UTCID01 - input "Math Basic" -> prefix "MATH"', () => {
    expectPrefix("Math Basic", "MATH");
  });

  test('UTCID02 - input "js" -> prefix "JS"', () => {
    expectPrefix("js", "JS");
  });

  test('UTCID03 - input "React#101" -> prefix "REAC"', () => {
    expectPrefix("React#101", "REAC");
  });

  test('UTCID04 - input "!!!" -> prefix mặc định "COUR"', () => {
    expectPrefix("!!!", "COUR");
  });

  test("UTCID05 - input null -> prefix 'NULL'", () => {
    expectPrefix(null, "NULL");
  });

  test("UTCID06 - input undefined -> prefix mặc định 'COUR'", () => {
    expectPrefix(undefined, "COUR");
  });

  test('UTCID07 - input "ab c!" -> prefix "ABC"', () => {
    expectPrefix("ab c!", "ABC");
  });

  test("UTCID08 - input rỗng -> prefix 'COUR'", () => {
    expectPrefix("", "COUR");
  });
});


