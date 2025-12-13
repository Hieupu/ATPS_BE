const instructorExamService = require("../services/instructorExamService");

describe("instructorExamService - validateExamData", () => {
  test("UTCID01 - data thiếu title -> throw Error 'Tiêu đề bài thi là bắt buộc'", () => {
    const data = {
      description: "Desc",
    };
    expect(() => {
      instructorExamService.validateExamData(data);
    }).toThrow("Tiêu đề bài thi là bắt buộc");
  });

  test("UTCID02 - data.title='' -> throw Error 'Tiêu đề bài thi là bắt buộc'", () => {
    const data = {
      title: "",
      description: "Desc",
    };
    expect(() => {
      instructorExamService.validateExamData(data);
    }).toThrow("Tiêu đề bài thi là bắt buộc");
  });

  test("UTCID03 - data thiếu description -> throw Error 'Mô tả bài thi là bắt buộc'", () => {
    const data = {
      title: "Exam 1",
    };
    expect(() => {
      instructorExamService.validateExamData(data);
    }).toThrow("Mô tả bài thi là bắt buộc");
  });

  test("UTCID04 - data.description='' -> throw Error 'Mô tả bài thi là bắt buộc'", () => {
    const data = {
      title: "Exam",
      description: "",
    };
    expect(() => {
      instructorExamService.validateExamData(data);
    }).toThrow("Mô tả bài thi là bắt buộc");
  });

  test("UTCID05 - data.status='Invalid' -> throw Error 'Trạng thái không hợp lệ. Cho phép: Draft, Published, Archived'", () => {
    const data = {
      title: "Exam",
      description: "Desc",
      status: "Invalid",
    };
    expect(() => {
      instructorExamService.validateExamData(data);
    }).toThrow("Trạng thái không hợp lệ. Cho phép: Draft, Published, Archived");
  });

  test("UTCID06 - data.type='Invalid' -> throw Error 'Loại bài thi không hợp lệ. Cho phép: Assignment, Exam'", () => {
    const data = {
      title: "Exam",
      description: "Desc",
      type: "Invalid",
    };
    expect(() => {
      instructorExamService.validateExamData(data);
    }).toThrow("Loại bài thi không hợp lệ. Cho phép: Assignment, Exam");
  });

  test("UTCID07 - data.status='Pending' -> throw Error 'Trạng thái không hợp lệ. Cho phép: Draft, Published, Archived'", () => {
    const data = {
      title: "Exam 1",
      description: "Desc",
      status: "Pending",
    };
    expect(() => {
      instructorExamService.validateExamData(data);
    }).toThrow("Trạng thái không hợp lệ. Cho phép: Draft, Published, Archived");
  });

  test("UTCID08 - data hợp lệ với tất cả trường bắt buộc -> return data", () => {
    const data = {
      title: "Exam",
      description: "Desc",
    };
    const result = instructorExamService.validateExamData(data);
    expect(result).toEqual(data);
    expect(result).toHaveProperty("title", "Exam");
    expect(result).toHaveProperty("description", "Desc");
  });

  test("UTCID09 - data hợp lệ với status='Published' -> return data với status='Published'", () => {
    const data = {
      title: "Exam",
      description: "Desc",
      status: "Published",
    };
    const result = instructorExamService.validateExamData(data);
    expect(result).toEqual(data);
    expect(result).toHaveProperty("status", "Published");
  });
});
