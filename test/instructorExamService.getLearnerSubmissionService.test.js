jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  getLearnerExamSubmission: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const {
  getLearnerSubmissionService,
} = require("../services/instructorExamService");

describe("instructorExamService - getLearnerSubmissionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, examId=100, learnerId=200 -> return {submission: {...}}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    const submission = {
      submissionId: 1,
      learnerId: 200,
      examId: 100,
      answers: [{ questionId: 1, answer: "A" }],
      score: 85,
    };
    instructorExamRepository.getLearnerExamSubmission.mockResolvedValue(
      submission
    );

    const result = await getLearnerSubmissionService(1, 100, 200);

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
    expect(result).toEqual(submission);
  });

  test("UTCID02 - instructorAccId=9999, examId=100 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(getLearnerSubmissionService(9999, 100, 200)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=2, examId=100 -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(getLearnerSubmissionService(2, 100, 200)).rejects.toThrow(
      "Không có quyền truy cập bài thi này"
    );
    expect(
      instructorExamRepository.getLearnerExamSubmission
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=1, examId=100, learnerId=9999 -> return null", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.getLearnerExamSubmission.mockResolvedValue(null);

    const result = await getLearnerSubmissionService(1, 100, 9999);

    expect(
      instructorExamRepository.getLearnerExamSubmission
    ).toHaveBeenCalledWith(100, 9999);
    expect(result).toBeNull();
  });
});
