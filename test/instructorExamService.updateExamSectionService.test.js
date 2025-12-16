jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  checkSectionBelongsToExam: jest.fn(),
  getSectionById: jest.fn(),
  updateExamSection: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const {
  updateExamSectionService,
} = require("../services/instructorExamService");

describe("instructorExamService - updateExamSectionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=999, examId=10, sectionId=1, sectionData={type:'Listening', orderIndex:1} -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    const sectionData = {
      type: "Listening",
      orderIndex: 1,
    };

    await expect(
      updateExamSectionService(999, 10, 1, sectionData)
    ).rejects.toThrow("Không tìm thấy thông tin giảng viên");
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorAccId=10, examId=10, sectionId=1, sectionData={type:'Listening', orderIndex:1}, repo trả instructorId=1, hasAccess=false -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(1);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    const sectionData = {
      type: "Listening",
      orderIndex: 1,
    };

    await expect(
      updateExamSectionService(10, 10, 1, sectionData)
    ).rejects.toThrow("Không có quyền truy cập bài thi này");
    expect(instructorExamRepository.updateExamSection).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=10, examId=55, sectionId=1, sectionData={type:'unknown', orderIndex:1} -> throw Error 'Loại section không hợp lệ. Cho phép: Listening, Speaking, Reading, Writing'", async () => {
    const sectionData = {
      type: "unknown",
      orderIndex: 1,
    };

    await expect(
      updateExamSectionService(10, 55, 1, sectionData)
    ).rejects.toThrow(
      "Loại section không hợp lệ. Cho phép: Listening, Speaking, Reading, Writing"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=10, examId=55, sectionId=1, sectionData={type:'Reading', orderIndex:2}, repo trả instructorId=5, hasAccess=true, belongsToExam=true -> service return {message: 'Cập nhật section thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.checkSectionBelongsToExam.mockResolvedValue(true);
    instructorExamRepository.updateExamSection.mockResolvedValue();

    const sectionData = {
      type: "Reading",
      orderIndex: 2,
    };

    const result = await updateExamSectionService(10, 55, 1, sectionData);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(10);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      55,
      5
    );
    expect(
      instructorExamRepository.checkSectionBelongsToExam
    ).toHaveBeenCalledWith(1, 55);
    expect(instructorExamRepository.updateExamSection).toHaveBeenCalledWith(1, {
      type: "Reading",
      title: null,
      orderIndex: 2,
      parentSectionId: null,
      fileURL: null,
    });
    expect(result).toEqual({ message: "Cập nhật section thành công" });
  });
});
