jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  createExam: jest.fn(),
  createExamSection: jest.fn(),
  addQuestionsToSection: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { createExamService } = require("../services/instructorExamService");

describe("instructorExamService - createExamService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=10, data.title=null -> throw Error 'Tiêu đề bài thi là bắt buộc'", async () => {
    const data = {
      title: null,
      description: "Desc",
    };
    await expect(createExamService(10, data)).rejects.toThrow(
      "Tiêu đề bài thi là bắt buộc"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorAccId=9999, data.title='' -> throw Error 'Tiêu đề bài thi là bắt buộc'", async () => {
    const data = {
      title: "",
      description: "Desc",
    };
    await expect(createExamService(9999, data)).rejects.toThrow(
      "Tiêu đề bài thi là bắt buộc"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=10, data.title='Exam 1', data.description='' -> throw Error 'Mô tả bài thi là bắt buộc'", async () => {
    const data = {
      title: "Exam 1",
      description: "",
    };

    await expect(createExamService(10, data)).rejects.toThrow(
      "Mô tả bài thi là bắt buộc"
    );
    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=10, data hợp lệ, repo trả instructorId=5, examId=102 -> service return {examId: 102, message: 'Tạo bài thi template thành công. Bạn có thể tạo exam instances để gán cho class/unit.'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.createExam.mockResolvedValue(102);

    const data = {
      title: "Exam 1",
      description: "Desc",
    };

    const result = await createExamService(10, data);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(10);
    expect(instructorExamRepository.createExam).toHaveBeenCalled();
    expect(result).toEqual({
      examId: 102,
      message:
        "Tạo bài thi template thành công. Bạn có thể tạo exam instances để gán cho class/unit.",
    });
  });

  test("UTCID05 - instructorAccId=10, data hợp lệ với sections, repo trả instructorId=5, examId=104 -> service return {examId: 104, message: 'Tạo bài thi template thành công. Bạn có thể tạo exam instances để gán cho class/unit.'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.createExam.mockResolvedValue(104);
    instructorExamRepository.createExamSection.mockResolvedValue(201);

    const data = {
      title: "Exam 1",
      description: "Desc",
      sections: [{ type: "Listening", orderIndex: 1, questionIds: [] }],
    };

    const result = await createExamService(10, data);

    expect(instructorExamRepository.createExamSection).toHaveBeenCalled();
    expect(result).toEqual({
      examId: 104,
      message:
        "Tạo bài thi template thành công. Bạn có thể tạo exam instances để gán cho class/unit.",
    });
  });

  test("UTCID06 - instructorAccId=9999, data hợp lệ, repo trả instructorId=null -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    const data = {
      title: "Exam 1",
      description: "Desc",
    };

    await expect(createExamService(9999, data)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.createExam).not.toHaveBeenCalled();
  });

  test("UTCID07 - instructorAccId=10, data hợp lệ với sections có childSections, repo trả instructorId=5, examId=105 -> service return {examId: 105, message: 'Tạo bài thi template thành công. Bạn có thể tạo exam instances để gán cho class/unit.'}", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(5);
    instructorExamRepository.createExam.mockResolvedValue(105);
    instructorExamRepository.createExamSection
      .mockResolvedValueOnce(201)
      .mockResolvedValueOnce(202);
    instructorExamRepository.addQuestionsToSection.mockResolvedValue();

    const data = {
      title: "Exam 1",
      description: "Desc",
      sections: [
        {
          type: "Listening",
          orderIndex: 1,
          childSections: [
            { type: "Reading", orderIndex: 1, questionIds: [1, 2] },
          ],
        },
      ],
    };

    const result = await createExamService(10, data);

    expect(instructorExamRepository.createExamSection).toHaveBeenCalledTimes(2);
    expect(instructorExamRepository.addQuestionsToSection).toHaveBeenCalled();
    expect(result).toEqual({
      examId: 105,
      message:
        "Tạo bài thi template thành công. Bạn có thể tạo exam instances để gán cho class/unit.",
    });
  });
});
