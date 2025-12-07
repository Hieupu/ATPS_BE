jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  checkSectionBelongsToExam: jest.fn(),
  addQuestionsToSection: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const {
  addQuestionsToSectionService,
} = require("../services/instructorExamService");

describe("instructorExamService - addQuestionsToSectionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, examId=100, sectionId=10, questionIds=[1,2,3] -> return {message: 'Thêm câu hỏi vào section thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.checkSectionBelongsToExam.mockResolvedValue(true);
    instructorExamRepository.addQuestionsToSection.mockResolvedValue();

    const result = await addQuestionsToSectionService(1, 100, 10, [1, 2, 3]);

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
    expect(instructorExamRepository.addQuestionsToSection).toHaveBeenCalledWith(
      10,
      [1, 2, 3]
    );
    expect(result.message).toContain("Thêm");
    expect(result.message).toContain("câu hỏi vào section thành công");
  });

  test("UTCID02 - instructorAccId=999, questionIds=[] -> throw Error 'Danh sách câu hỏi không hợp lệ'", async () => {
    await expect(
      addQuestionsToSectionService(999, 100, 10, [])
    ).rejects.toThrow("Danh sách câu hỏi không hợp lệ");
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID03 - questionIds='notarray' -> throw Error 'Danh sách câu hỏi không hợp lệ'", async () => {
    await expect(
      addQuestionsToSectionService(1, 100, 10, "notarray")
    ).rejects.toThrow("Danh sách câu hỏi không hợp lệ");
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId không tồn tại -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(
      addQuestionsToSectionService(999, 100, 10, [1, 2])
    ).rejects.toThrow("Không tìm thấy thông tin giảng viên");
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID05 - instructor không có quyền truy cập exam -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(
      addQuestionsToSectionService(2, 100, 10, [1, 2])
    ).rejects.toThrow("Không có quyền truy cập bài thi này");
    expect(
      instructorExamRepository.checkSectionBelongsToExam
    ).not.toHaveBeenCalled();
  });

  test("UTCID06 - instructorAccId=1, examId=100, sectionId=10, questionIds=[1] -> return {message: 'Thêm câu hỏi vào section thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.checkSectionBelongsToExam.mockResolvedValue(true);
    instructorExamRepository.addQuestionsToSection.mockResolvedValue();

    const result = await addQuestionsToSectionService(1, 100, 10, [1]);

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
    expect(instructorExamRepository.addQuestionsToSection).toHaveBeenCalledWith(
      10,
      [1]
    );
    expect(result.message).toContain("Thêm");
    expect(result.message).toContain("câu hỏi vào section thành công");
  });
});
