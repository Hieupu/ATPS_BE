jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  getSectionsHierarchyByExam: jest.fn(),
  getAllSectionsByExam: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { getSectionsService } = require("../services/instructorExamService");

describe("instructorExamService - getSectionsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, examId=10, hierarchical=true, repo trả instructorId=5, hasAccess=true, sections=[{id:1}, {id:2}] -> service return [{id:1}, {id:2}]", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.getSectionsHierarchyByExam.mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ]);

    const result = await getSectionsService(1, 10, true);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      10,
      5
    );
    expect(
      instructorExamRepository.getSectionsHierarchyByExam
    ).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("id", 1);
    expect(result[1]).toHaveProperty("id", 2);
  });

  test("UTCID02 - instructorAccId=999, examId=10 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(getSectionsService(999, 10)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=1, examId=10, repo trả instructorId=5, hasAccess=false -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(getSectionsService(1, 10)).rejects.toThrow(
      "Không có quyền truy cập bài thi này"
    );
    expect(
      instructorExamRepository.getSectionsHierarchyByExam
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=1, examId=10, hierarchical=true, repo trả instructorId=5, hasAccess=true, sections=[] -> service return []", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.getSectionsHierarchyByExam.mockResolvedValue([]);

    const result = await getSectionsService(1, 10, true);

    expect(
      instructorExamRepository.getSectionsHierarchyByExam
    ).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("UTCID05 - instructorAccId=1, examId=10, hierarchical=true, repo trả instructorId=5, hasAccess=true, getSectionsHierarchyByExam throw DB error -> throw Error 'DB error'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.getSectionsHierarchyByExam.mockRejectedValue(
      new Error("DB error")
    );

    await expect(getSectionsService(1, 10, true)).rejects.toThrow("DB error");
    expect(
      instructorExamRepository.getSectionsHierarchyByExam
    ).toHaveBeenCalledWith(10);
  });
});
