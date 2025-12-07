const instructorExamService = require("../services/instructorExamService");

describe("instructorExamService - validateQuestionData", () => {
  test("UTCID01 - data.content = '' (chuỗi rỗng) -> throw Error 'Nội dung câu hỏi là bắt buộc'", () => {
    const data = {
      content: "",
      type: "essay",
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow("Nội dung câu hỏi là bắt buộc");
  });

  test("UTCID02 - data thiếu content -> throw Error 'Nội dung câu hỏi là bắt buộc'", () => {
    const data = {
      type: "essay",
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow("Nội dung câu hỏi là bắt buộc");
  });

  test("UTCID03 - data.type = 'Invalid' (không hợp lệ) -> throw Error 'Loại câu hỏi không hợp lệ. Cho phép: multiple_choice, true_false, fill_in_blank, matching, essay, speaking'", () => {
    const data = {
      content: "Q1",
      type: "Invalid",
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow(
      "Loại câu hỏi không hợp lệ. Cho phép: multiple_choice, true_false, fill_in_blank, matching, essay, speaking"
    );
  });

  test("UTCID04 - data.level = 'Invalid' (không hợp lệ) -> throw Error 'Độ khó không hợp lệ. Cho phép: Easy, Medium, Hard'", () => {
    const data = {
      content: "Q1",
      level: "Invalid",
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow("Độ khó không hợp lệ. Cho phép: Easy, Medium, Hard");
  });

  test("UTCID05 - data.point = -1 (nhỏ hơn 0) -> throw Error 'Điểm phải từ 0 đến 100'", () => {
    const data = {
      content: "Q1",
      point: -1,
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow("Điểm phải từ 0 đến 100");
  });

  test("UTCID06 - data.point = 101 (lớn hơn 100) -> throw Error 'Điểm phải từ 0 đến 100'", () => {
    const data = {
      content: "Q1",
      point: 101,
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow("Điểm phải từ 0 đến 100");
  });

  test("UTCID07 - data.type = 'multiple_choice', data.options = [] (ít hơn 2 lựa chọn) -> throw Error 'Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn'", () => {
    const data = {
      content: "Q1",
      type: "multiple_choice",
      options: [],
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
  });

  test("UTCID08 - data.type = 'multiple_choice', data.options = [{text:'A',isCorrect:false}, {text:'B',isCorrect:false}] (thiếu đáp án đúng) -> throw Error 'Phải có ít nhất 1 đáp án đúng'", () => {
    const data = {
      content: "Q1",
      type: "multiple_choice",
      options: [
        { text: "A", isCorrect: false },
        { text: "B", isCorrect: false },
      ],
      level: "Easy",
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).toThrow("Phải có ít nhất 1 đáp án đúng");
  });

  test("UTCID09 - data.type = 'essay', data.content = 'Explain XYZ', data.point = 10, data.level = 'Medium' -> không throw Error", () => {
    const data = {
      content: "Explain XYZ",
      type: "essay",
      point: 10,
      level: "Medium",
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).not.toThrow();
  });

  test("UTCID10 - data.content = 'Explain XYZ', data.point = 20, data.level = 'Medium' -> không throw Error", () => {
    const data = {
      content: "Explain XYZ",
      point: 20,
      level: "Medium",
    };
    expect(() => {
      instructorExamService.validateQuestionData(data);
    }).not.toThrow();
  });
});
