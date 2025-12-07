jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  checkSectionBelongsToExam: jest.fn(),
  removeQuestionFromSection: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const {
  removeQuestionFromSectionService,
} = require("../services/instructorExamService");

describe("instructorExamService - removeQuestionFromSectionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, examId=100, sectionId=10, questionId=5 -> return {message: 'Xóa câu hỏi khỏi section thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.checkSectionBelongsToExam.mockResolvedValue(true);
    instructorExamRepository.removeQuestionFromSection.mockResolvedValue();

    const result = await removeQuestionFromSectionService(1, 100, 10, 5);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      100,
      10
    );
    expect(
      instructorExamRepository.checkSectionBelongsToExam
    ).toHaveBeenCalledWith(10, 100);
    expect(
      instructorExamRepository.removeQuestionFromSection
    ).toHaveBeenCalledWith(10, 5);
    expect(result).toEqual({
      message: "Xóa câu hỏi khỏi section thành công",
    });
  });

  test("UTCID02 - instructorAccId=9999 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(
      removeQuestionFromSectionService(9999, 100, 10, 5)
    ).rejects.toThrow("Không tìm thấy thông tin giảng viên");
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=2 -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(
      removeQuestionFromSectionService(2, 100, 10, 5)
    ).rejects.toThrow("Không có quyền truy cập bài thi này");
    expect(
      instructorExamRepository.checkSectionBelongsToExam
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - questionId=5, repo throw 'DB error' -> throw DB error", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.checkSectionBelongsToExam.mockResolvedValue(true);
    instructorExamRepository.removeQuestionFromSection.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      removeQuestionFromSectionService(1, 100, 10, 5)
    ).rejects.toThrow("DB error");
    expect(
      instructorExamRepository.removeQuestionFromSection
    ).toHaveBeenCalledWith(10, 5);
  });
});
