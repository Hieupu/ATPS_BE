jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  getExamById: jest.fn(),
  getSectionsHierarchyByExam: jest.fn(),
  getInstancesByExam: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { getExamDetailService } = require("../services/instructorExamService");

describe("instructorExamService - getExamDetailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=999, examId=101 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(getExamDetailService(999, 101)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorAccId=10, examId=101, repo trả instructorId=5, hasAccess=true, exam=null -> throw Error 'Không tìm thấy bài thi'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.getExamById.mockResolvedValue(null);

    await expect(getExamDetailService(10, 101)).rejects.toThrow(
      "Không tìm thấy bài thi"
    );
    expect(instructorExamRepository.getExamById).toHaveBeenCalledWith(101);
  });

  test("UTCID03 - instructorAccId=10, examId=89, repo trả instructorId=5, hasAccess=true, exam={ExamID:89}, sections=[], instances=[] -> service return {...exam, sections:[], instances:[]}", async () => {
    const exam = { ExamID: 89, Title: "Exam 1" };
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.getExamById.mockResolvedValue(exam);
    instructorExamRepository.getSectionsHierarchyByExam.mockResolvedValue([]);
    instructorExamRepository.getInstancesByExam.mockResolvedValue([]);

    const result = await getExamDetailService(10, 89);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(10);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      89,
      5
    );
    expect(instructorExamRepository.getExamById).toHaveBeenCalledWith(89);
    expect(
      instructorExamRepository.getSectionsHierarchyByExam
    ).toHaveBeenCalledWith(89);
    expect(instructorExamRepository.getInstancesByExam).toHaveBeenCalledWith(
      89
    );
    expect(result).toHaveProperty("sections", []);
    expect(result).toHaveProperty("instances", []);
  });

  test("UTCID04 - instructorAccId=10, examId=102, repo trả instructorId=5, hasAccess=true, exam={ExamID:102}, sections=[{SectionID:1}], instances=[{InstanceID:1}] -> service return {...exam, sections:[{SectionID:1}], instances:[{InstanceID:1}]}", async () => {
    const exam = { ExamID: 102, Title: "Exam 2" };
    const sections = [{ SectionID: 1, Type: "Listening" }];
    const instances = [{ InstanceID: 1, ClassId: 101 }];
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.getExamById.mockResolvedValue(exam);
    instructorExamRepository.getSectionsHierarchyByExam.mockResolvedValue(
      sections
    );
    instructorExamRepository.getInstancesByExam.mockResolvedValue(instances);

    const result = await getExamDetailService(10, 102);

    expect(
      instructorExamRepository.getSectionsHierarchyByExam
    ).toHaveBeenCalledWith(102);
    expect(instructorExamRepository.getInstancesByExam).toHaveBeenCalledWith(
      102
    );
    expect(result).toHaveProperty("sections", sections);
    expect(result).toHaveProperty("instances", instances);
    expect(Array.isArray(result.sections)).toBe(true);
    expect(Array.isArray(result.instances)).toBe(true);
  });
});
