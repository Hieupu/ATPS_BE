jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  saveExamResult: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { manualGradeExamService } = require("../services/instructorExamService");

describe("instructorExamService - manualGradeExamService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, examId=100, learnerId=200, score=85, feedback='Good job' -> return {message: 'Chấm bài thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.saveExamResult.mockResolvedValue();

    const result = await manualGradeExamService(1, 100, 200, 85, "Good job");

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      100,
      10
    );
    expect(instructorExamRepository.saveExamResult).toHaveBeenCalledWith({
      learnerId: 200,
      examId: 100,
      score: 85,
      feedback: "Good job",
    });
    expect(result).toEqual({ message: "Chấm bài thành công" });
  });

  test("UTCID02 - instructorAccId=9999 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(
      manualGradeExamService(9999, 100, 200, 85, "Good job")
    ).rejects.toThrow("Không tìm thấy thông tin giảng viên");
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=2 -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(
      manualGradeExamService(2, 100, 200, 85, "Good job")
    ).rejects.toThrow("Không có quyền truy cập bài thi này");
    expect(instructorExamRepository.saveExamResult).not.toHaveBeenCalled();
  });

  test("UTCID04 - score=-5 -> throw Error 'Điểm phải từ 0 đến 100'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);

    await expect(
      manualGradeExamService(1, 100, 200, -5, "Good job")
    ).rejects.toThrow("Điểm phải từ 0 đến 100");
    expect(instructorExamRepository.saveExamResult).not.toHaveBeenCalled();
  });

  test("UTCID05 - score=150 -> throw Error 'Điểm phải từ 0 đến 100'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);

    await expect(
      manualGradeExamService(1, 100, 200, 150, "Good job")
    ).rejects.toThrow("Điểm phải từ 0 đến 100");
    expect(instructorExamRepository.saveExamResult).not.toHaveBeenCalled();
  });

  test("UTCID06 - instructorAccId=1, examId=100, learnerId=200, score=85, feedback=null -> return {message: 'Chấm bài thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.saveExamResult.mockResolvedValue();

    const result = await manualGradeExamService(1, 100, 200, 85, null);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      100,
      10
    );
    expect(instructorExamRepository.saveExamResult).toHaveBeenCalledWith({
      learnerId: 200,
      examId: 100,
      score: 85,
      feedback: "",
    });
    expect(result).toEqual({ message: "Chấm bài thành công" });
  });
});
