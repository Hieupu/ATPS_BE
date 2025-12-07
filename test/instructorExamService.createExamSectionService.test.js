jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  getSectionById: jest.fn(),
  checkSectionBelongsToExam: jest.fn(),
  createExamSection: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const {
  createExamSectionService,
} = require("../services/instructorExamService");

describe("instructorExamService - createExamSectionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=999, examId=101, sectionData={type:'Listening', orderIndex:1} -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    const sectionData = {
      type: "Listening",
      orderIndex: 1,
    };

    await expect(
      createExamSectionService(999, 101, sectionData)
    ).rejects.toThrow("Không tìm thấy thông tin giảng viên");
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorAccId=10, examId=101, sectionData={type:'Invalid', orderIndex:1} -> throw Error 'Loại section không hợp lệ. Cho phép: Listening, Speaking, Reading, Writing'", async () => {
    const sectionData = {
      type: "Invalid",
      orderIndex: 1,
    };

    await expect(
      createExamSectionService(10, 101, sectionData)
    ).rejects.toThrow(
      "Loại section không hợp lệ. Cho phép: Listening, Speaking, Reading, Writing"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=10, examId=101, sectionData={type:'Listening', orderIndex:1}, repo trả instructorId=5, hasAccess=true, sectionId=999 -> service return {sectionId: 999, message: 'Tạo parent section thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.createExamSection.mockResolvedValue(999);

    const sectionData = {
      type: "Listening",
      orderIndex: 1,
    };

    const result = await createExamSectionService(10, 101, sectionData);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(10);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      101,
      5
    );
    expect(instructorExamRepository.createExamSection).toHaveBeenCalledWith(
      101,
      {
        type: "Listening",
        title: null,
        orderIndex: 1,
        parentSectionId: null,
        fileURL: null,
      }
    );
    expect(result).toEqual({
      sectionId: 999,
      message: "Tạo parent section thành công",
    });
  });

  test("UTCID04 - instructorAccId=10, examId=101, sectionData={type:'Reading', orderIndex:2}, repo trả instructorId=5, hasAccess=true, sectionId=1000 -> service return {sectionId: 1000, message: 'Tạo parent section thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.createExamSection.mockResolvedValue(1000);

    const sectionData = {
      type: "Reading",
      orderIndex: 2,
    };

    const result = await createExamSectionService(10, 101, sectionData);

    expect(instructorExamRepository.createExamSection).toHaveBeenCalledWith(
      101,
      {
        type: "Reading",
        title: null,
        orderIndex: 2,
        parentSectionId: null,
        fileURL: null,
      }
    );
    expect(result).toEqual({
      sectionId: 1000,
      message: "Tạo parent section thành công",
    });
  });
});
