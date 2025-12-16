jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  deleteExam: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { deleteExamService } = require("../services/instructorExamService");

describe("instructorExamService - deleteExamService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=999, examId=101 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(deleteExamService(999, 101)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorAccId=10, examId=101, repo trả instructorId=5, hasAccess=false -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(deleteExamService(10, 101)).rejects.toThrow(
      "Không có quyền truy cập bài thi này"
    );
    expect(instructorExamRepository.deleteExam).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=10, examId=89, repo trả instructorId=5, hasAccess=true -> service return {message: 'Xóa bài thi thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.deleteExam.mockResolvedValue();

    const result = await deleteExamService(10, 89);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(10);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      89,
      5
    );
    expect(instructorExamRepository.deleteExam).toHaveBeenCalledWith(89);
    expect(result).toEqual({ message: "Xóa bài thi thành công" });
  });

  test("UTCID04 - instructorAccId=10, examId=102, repo trả instructorId=5, hasAccess=true -> service return {message: 'Xóa bài thi thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.deleteExam.mockResolvedValue();

    const result = await deleteExamService(10, 102);

    expect(instructorExamRepository.deleteExam).toHaveBeenCalledWith(102);
    expect(result).toEqual({ message: "Xóa bài thi thành công" });
  });
});
