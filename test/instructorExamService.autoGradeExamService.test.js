jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  getLearnerExamSubmission: jest.fn(),
  saveExamResult: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { autoGradeExamService } = require("../services/instructorExamService");

describe("instructorExamService - autoGradeExamService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, examId=100, learnerId=200 -> return {score: '85.00', message: 'Chấm bài tự động thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    const submission = [];
    for (let i = 1; i <= 20; i++) {
      submission.push({
        QuestionID: i,
        Point: 5,
        Type: "multiple_choice",
        LearnerAnswer: i <= 17 ? "A" : "B",
        CorrectAnswer: "A",
      });
    }
    instructorExamRepository.getLearnerExamSubmission.mockResolvedValue(
      submission
    );
    instructorExamRepository.saveExamResult.mockResolvedValue();

    const result = await autoGradeExamService(1, 100, 200);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      100,
      10
    );
    expect(
      instructorExamRepository.getLearnerExamSubmission
    ).toHaveBeenCalledWith(100, 200);
    expect(instructorExamRepository.saveExamResult).toHaveBeenCalled();
    expect(result).toEqual({
      score: "85.00",
      message: "Chấm bài tự động thành công",
    });
  });

  test("UTCID02 - instructorAccId=9999 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(autoGradeExamService(9999, 100, 200)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=2 -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(autoGradeExamService(2, 100, 200)).rejects.toThrow(
      "Không có quyền truy cập bài thi này"
    );
    expect(
      instructorExamRepository.getLearnerExamSubmission
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=1, examId=100, all answers correct -> return {score: '100.00', message: 'Chấm bài tự động thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    const submission = [
      {
        QuestionID: 1,
        Point: 10,
        Type: "multiple_choice",
        LearnerAnswer: "A",
        CorrectAnswer: "A",
      },
      {
        QuestionID: 2,
        Point: 10,
        Type: "multiple_choice",
        LearnerAnswer: "B",
        CorrectAnswer: "B",
      },
      {
        QuestionID: 3,
        Point: 10,
        Type: "multiple_choice",
        LearnerAnswer: "C",
        CorrectAnswer: "C",
      },
    ];
    instructorExamRepository.getLearnerExamSubmission.mockResolvedValue(
      submission
    );
    instructorExamRepository.saveExamResult.mockResolvedValue();

    const result = await autoGradeExamService(1, 100, 200);

    expect(
      instructorExamRepository.getLearnerExamSubmission
    ).toHaveBeenCalledWith(100, 200);
    expect(instructorExamRepository.saveExamResult).toHaveBeenCalled();
    expect(result).toEqual({
      score: "100.00",
      message: "Chấm bài tự động thành công",
    });
  });
});
