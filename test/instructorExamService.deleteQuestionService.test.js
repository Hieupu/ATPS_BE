jest.mock("../repositories/instructorExamRepository", () => ({
  getQuestionById: jest.fn(),
  getInstructorIdByAccId: jest.fn(),
  deleteQuestion: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { deleteQuestionService } = require("../services/instructorExamService");

describe("instructorExamService - deleteQuestionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, questionId=100, question tồn tại và instructor có quyền -> return {message: 'Xóa câu hỏi thành công'}", async () => {
    const question = { QuestionID: 100, InstructorID: 10, content: "Q1" };
    instructorExamRepository.getQuestionById.mockResolvedValue(question);
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.deleteQuestion.mockResolvedValue();

    const result = await deleteQuestionService(1, 100);

    expect(instructorExamRepository.getQuestionById).toHaveBeenCalledWith(100);
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.deleteQuestion).toHaveBeenCalledWith(100);
    expect(result).toEqual({ message: "Xóa câu hỏi thành công" });
  });

  test("UTCID02 - instructorAccId=1, questionId=99999, question không tồn tại -> throw Error 'Không tìm thấy câu hỏi'", async () => {
    instructorExamRepository.getQuestionById.mockResolvedValue(null);

    await expect(deleteQuestionService(1, 99999)).rejects.toThrow(
      "Không tìm thấy câu hỏi"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
    expect(instructorExamRepository.deleteQuestion).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=2, questionId=100, question tồn tại nhưng instructor không có quyền -> throw Error 'Không có quyền xóa câu hỏi này'", async () => {
    const question = { QuestionID: 100, InstructorID: 10, content: "Q1" };
    instructorExamRepository.getQuestionById.mockResolvedValue(question);
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(11);

    await expect(deleteQuestionService(2, 100)).rejects.toThrow(
      "Không có quyền xóa câu hỏi này"
    );
    expect(instructorExamRepository.getQuestionById).toHaveBeenCalledWith(100);
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(2);
    expect(instructorExamRepository.deleteQuestion).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=1, questionId=101, question tồn tại và instructor có quyền -> return {message: 'Xóa câu hỏi thành công'}", async () => {
    const question = { QuestionID: 101, InstructorID: 10, content: "Q2" };
    instructorExamRepository.getQuestionById.mockResolvedValue(question);
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.deleteQuestion.mockResolvedValue();

    const result = await deleteQuestionService(1, 101);

    expect(instructorExamRepository.getQuestionById).toHaveBeenCalledWith(101);
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.deleteQuestion).toHaveBeenCalledWith(101);
    expect(result).toEqual({ message: "Xóa câu hỏi thành công" });
  });
});
