jest.mock("../repositories/instructorExamRepository", () => ({
  getQuestionById: jest.fn(),
  getInstructorIdByAccId: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const {
  getQuestionDetailService,
} = require("../services/instructorExamService");

describe("instructorExamService - getQuestionDetailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, questionId=100, repo trả question={QuestionID: 100, InstructorID: 10}, instructorId=10 -> return question object", async () => {
    const question = { QuestionID: 100, InstructorID: 10, content: "Q1" };
    instructorExamRepository.getQuestionById.mockResolvedValue(question);
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);

    const result = await getQuestionDetailService(1, 100);

    expect(instructorExamRepository.getQuestionById).toHaveBeenCalledWith(100);
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(result).toEqual(question);
  });

  test("UTCID02 - instructorAccId=2, questionId=999999, repo trả question=null -> throw Error 'Không tìm thấy câu hỏi'", async () => {
    instructorExamRepository.getQuestionById.mockResolvedValue(null);

    await expect(getQuestionDetailService(2, 999999)).rejects.toThrow(
      "Không tìm thấy câu hỏi"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=2, questionId=100, repo trả question={QuestionID: 100, InstructorID: 10}, instructorId=11 -> throw Error 'Không có quyền truy cập câu hỏi này'", async () => {
    const question = { QuestionID: 100, InstructorID: 10, content: "Q1" };
    instructorExamRepository.getQuestionById.mockResolvedValue(question);
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(11);

    await expect(getQuestionDetailService(2, 100)).rejects.toThrow(
      "Không có quyền truy cập câu hỏi này"
    );
    expect(instructorExamRepository.getQuestionById).toHaveBeenCalledWith(100);
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(2);
  });

  test("UTCID04 - instructorAccId=2, questionId='abc', repo trả full question object, instructorId=10 -> return question object", async () => {
    const question = {
      QuestionID: 100,
      InstructorID: 10,
      content: "Full question",
      type: "multiple_choice",
      level: "Medium",
    };
    instructorExamRepository.getQuestionById.mockResolvedValue(question);
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);

    const result = await getQuestionDetailService(2, "abc");

    expect(instructorExamRepository.getQuestionById).toHaveBeenCalledWith(
      "abc"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(2);
    expect(result).toEqual(question);
  });

  test("UTCID05 - instructorAccId=1, questionId=101, repo trả full question object, instructorId=10 -> return question object", async () => {
    const question = {
      QuestionID: 101,
      InstructorID: 10,
      content: "Full question",
      type: "essay",
      level: "Hard",
    };
    instructorExamRepository.getQuestionById.mockResolvedValue(question);
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);

    const result = await getQuestionDetailService(1, 101);

    expect(instructorExamRepository.getQuestionById).toHaveBeenCalledWith(101);
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(result).toEqual(question);
  });

  test("UTCID06 - instructorAccId=1, questionId=102, repo throw 'DB error' -> throw DB error", async () => {
    instructorExamRepository.getQuestionById.mockRejectedValue(
      new Error("DB error")
    );

    await expect(getQuestionDetailService(1, 102)).rejects.toThrow("DB error");
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });
});
