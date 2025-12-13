jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  checkExamOwnership: jest.fn(),
  updateExam: jest.fn(),
  deleteExamClasses: jest.fn(),
  assignExamToClasses: jest.fn(),
  deleteQuestionsByExam: jest.fn(),
  deleteExamSections: jest.fn(),
  insertSection: jest.fn(),
  insertSectionQuestions: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { updateExamService } = require("../services/instructorExamService");

describe("instructorExamService - updateExamService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=999, examId=101 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    const data = {
      CourseID: 1,
      title: "Exam 1",
      description: "Desc",
      StartTime: "2025-12-01",
      EndTime: "2025-12-02",
    };

    await expect(updateExamService(999, 101, data)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorAccId=10, examId=101, repo trả instructorId=5, hasAccess=false -> throw Error 'Không có quyền truy cập bài thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    const data = {
      CourseID: 1,
      title: "Exam 1",
      description: "Desc",
      StartTime: "2025-12-01",
      EndTime: "2025-12-02",
      isRandomQuestion: 1,
    };

    await expect(updateExamService(10, 101, data)).rejects.toThrow(
      "Không có quyền truy cập bài thi này"
    );
    expect(instructorExamRepository.updateExam).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=10, examId=101, data.title='' -> throw Error 'Tiêu đề bài thi là bắt buộc'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);

    const data = {
      CourseID: 1,
      title: "",
      description: "Desc",
      StartTime: "2025-12-01",
      EndTime: "2025-12-02",
      isRandomAnswer: 1,
    };

    await expect(updateExamService(10, 101, data)).rejects.toThrow(
      "Tiêu đề bài thi là bắt buộc"
    );
    expect(instructorExamRepository.updateExam).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=10, examId=101, data hợp lệ, repo trả instructorId=5, hasAccess=true -> service return {message: 'Cập nhật bài thi thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.updateExam.mockResolvedValue();

    const data = {
      CourseID: 1,
      title: "Exam 1",
      description: "Desc",
      StartTime: "2025-12-01",
      EndTime: "2025-12-02",
      isRandomQuestion: 0,
    };

    const result = await updateExamService(10, 101, data);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(10);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      101,
      5
    );
    expect(instructorExamRepository.updateExam).toHaveBeenCalled();
    expect(result).toEqual({ message: "Cập nhật bài thi thành công" });
  });

  test("UTCID05 - instructorAccId=10, examId=101, data.status='Published', data.isRandomQuestion=1, repo trả instructorId=5, hasAccess=true -> service return {message: 'Cập nhật bài thi thành công'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    instructorExamRepository.updateExam.mockResolvedValue();

    const data = {
      CourseID: 1,
      title: "Exam 2",
      description: "Desc",
      StartTime: "2025-12-01",
      EndTime: "2025-12-02",
      status: "Published",
      isRandomQuestion: 1,
    };

    const result = await updateExamService(10, 101, data);

    expect(instructorExamRepository.updateExam).toHaveBeenCalled();
    expect(result).toEqual({ message: "Cập nhật bài thi thành công" });
  });
});
