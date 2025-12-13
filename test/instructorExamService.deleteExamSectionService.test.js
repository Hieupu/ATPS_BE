jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  checkSectionBelongsToExam: jest.fn(),
  deleteExamSection: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const {
  deleteExamSectionService,
} = require("../services/instructorExamService");

describe("instructorExamService - deleteExamSectionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, examId=10, sectionId=100, repo trả instructorId=null -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(deleteExamSectionService(1, 10, 100)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorAccId=1, examId=10, sectionId=100, repo trả instructorId=5, hasAccess=false -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(deleteExamSectionService(1, 10, 100)).rejects.toThrow(
      "Không có quyền truy cập bài thi này"
    );
    expect(instructorExamRepository.deleteExamSection).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=1, examId=10, sectionId=100, repo trả instructorId=5, hasAccess=true, belongsToExam=true, deleteExamSection throw DB error -> throw Error 'DB error'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.checkSectionBelongsToExam.mockResolvedValue(true);
    instructorExamRepository.deleteExamSection.mockRejectedValue(
      new Error("DB error")
    );

    await expect(deleteExamSectionService(1, 10, 100)).rejects.toThrow(
      "DB error"
    );
    expect(instructorExamRepository.deleteExamSection).toHaveBeenCalledWith(
      100
    );
  });

  test("UTCID04 - instructorAccId=1, examId=10, sectionId=100, repo trả instructorId=5, hasAccess=true, belongsToExam=true -> service return {message: 'Xóa section thành công (bao gồm child sections và questions)'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.checkSectionBelongsToExam.mockResolvedValue(true);
    instructorExamRepository.deleteExamSection.mockResolvedValue();

    const result = await deleteExamSectionService(1, 10, 100);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      10,
      5
    );
    expect(
      instructorExamRepository.checkSectionBelongsToExam
    ).toHaveBeenCalledWith(100, 10);
    expect(instructorExamRepository.deleteExamSection).toHaveBeenCalledWith(
      100
    );
    expect(result).toEqual({
      message: "Xóa section thành công (bao gồm child sections và questions)",
    });
  });
});
