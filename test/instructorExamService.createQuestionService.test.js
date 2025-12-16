jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  createQuestion: jest.fn(),
  createQuestionOptions: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { createQuestionService } = require("../services/instructorExamService");

describe("instructorExamService - createQuestionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, questionData={content:'Q1', type:'multiple_choice', options:[{text:'A',isCorrect:true}, {text:'B',isCorrect:false}]}, repo trả instructorId=10, questionId=100 -> service return {questionId: 100, message: 'Tạo câu hỏi thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.createQuestion.mockResolvedValue(100);
    instructorExamRepository.createQuestionOptions.mockResolvedValue();

    const questionData = {
      content: "Q1",
      type: "multiple_choice",
      options: [
        { text: "A", isCorrect: true },
        { text: "B", isCorrect: false },
      ],
    };

    const result = await createQuestionService(1, questionData);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.createQuestion).toHaveBeenCalled();
    expect(instructorExamRepository.createQuestionOptions).toHaveBeenCalledWith(
      100,
      questionData.options
    );
    expect(result).toEqual({
      questionId: 100,
      message: "Tạo câu hỏi thành công",
    });
  });

  test("UTCID02 - instructorAccId=1, questionData={content:'Q2', type:'essay'}, repo trả instructorId=null -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    const questionData = {
      content: "Q2",
      type: "essay",
    };

    await expect(createQuestionService(1, questionData)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.createQuestion).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=1, questionData={content:'', type:'multiple_choice', options:null} -> throw Error 'Nội dung câu hỏi là bắt buộc'", async () => {
    const questionData = {
      content: "",
      type: "multiple_choice",
      options: null,
    };

    await expect(createQuestionService(1, questionData)).rejects.toThrow(
      "Nội dung câu hỏi là bắt buộc"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=1, questionData={content:'Q', type:'multiple_choice', options:[{text:'A',isCorrect:true}, {text:'B',isCorrect:false}]}, repo trả instructorId=10, questionId=101 -> service return {questionId: 101, message: 'Tạo câu hỏi thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.createQuestion.mockResolvedValue(101);
    instructorExamRepository.createQuestionOptions.mockResolvedValue();

    const questionData = {
      content: "Q",
      type: "multiple_choice",
      options: [
        { text: "A", isCorrect: true },
        { text: "B", isCorrect: false },
      ],
    };

    const result = await createQuestionService(1, questionData);

    expect(instructorExamRepository.createQuestion).toHaveBeenCalled();
    expect(instructorExamRepository.createQuestionOptions).toHaveBeenCalledWith(
      101,
      questionData.options
    );
    expect(result).toEqual({
      questionId: 101,
      message: "Tạo câu hỏi thành công",
    });
  });

  test("UTCID05 - instructorAccId=1, questionData={content:'Q1', type:'multiple_choice', options:[{text:'A',isCorrect:false}, {text:'B',isCorrect:false}]} -> throw Error 'Phải có ít nhất 1 đáp án đúng'", async () => {
    const questionData = {
      content: "Q1",
      type: "multiple_choice",
      options: [
        { text: "A", isCorrect: false },
        { text: "B", isCorrect: false },
      ],
    };

    await expect(createQuestionService(1, questionData)).rejects.toThrow(
      "Phải có ít nhất 1 đáp án đúng"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });
});
