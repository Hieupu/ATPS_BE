jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  getQuestionsByInstructor: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { getQuestionsService } = require("../services/instructorExamService");

describe("instructorExamService - getQuestionsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, filters={}, repo trả instructorId=10, questions=[Q1, Q2] -> return [Q1, Q2]", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    const Q1 = { id: 1, content: "Q1" };
    const Q2 = { id: 2, content: "Q2" };
    instructorExamRepository.getQuestionsByInstructor.mockResolvedValue([
      Q1,
      Q2,
    ]);

    const result = await getQuestionsService(1, {});

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(
      instructorExamRepository.getQuestionsByInstructor
    ).toHaveBeenCalledWith(10, {});
    expect(result).toEqual([Q1, Q2]);
  });

  test("UTCID02 - instructorAccId=1, filters={type:'essay'}, repo trả instructorId=10, questions=[Q_essay] -> return [Q_essay]", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    const Q_essay = { id: 3, content: "Q_essay", type: "essay" };
    instructorExamRepository.getQuestionsByInstructor.mockResolvedValue([
      Q_essay,
    ]);

    const result = await getQuestionsService(1, { type: "essay" });

    expect(
      instructorExamRepository.getQuestionsByInstructor
    ).toHaveBeenCalledWith(10, { type: "essay" });
    expect(result).toEqual([Q_essay]);
  });

  test("UTCID03 - instructorAccId=99999, filters={}, repo trả instructorId=null -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(getQuestionsService(99999, {})).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(
      instructorExamRepository.getQuestionsByInstructor
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=1, filters={}, repo trả instructorId=10, questions=[] -> return []", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.getQuestionsByInstructor.mockResolvedValue([]);

    const result = await getQuestionsService(1, {});

    expect(
      instructorExamRepository.getQuestionsByInstructor
    ).toHaveBeenCalledWith(10, {});
    expect(result).toEqual([]);
  });

  test("UTCID05 - instructorAccId=1, filters={type:'mcq', level:'Hard'}, repo trả instructorId=10, questions=[Q_hard] -> return [Q_hard]", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    const Q_hard = { id: 4, content: "Q_hard", type: "mcq", level: "Hard" };
    instructorExamRepository.getQuestionsByInstructor.mockResolvedValue([
      Q_hard,
    ]);

    const result = await getQuestionsService(1, { type: "mcq", level: "Hard" });

    expect(
      instructorExamRepository.getQuestionsByInstructor
    ).toHaveBeenCalledWith(10, { type: "mcq", level: "Hard" });
    expect(result).toEqual([Q_hard]);
  });

  test("UTCID06 - instructorAccId=1, filters=undefined, repo trả instructorId=10, questions=[Q1] -> return [Q1]", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    const Q1 = { id: 1, content: "Q1" };
    instructorExamRepository.getQuestionsByInstructor.mockResolvedValue([Q1]);

    const result = await getQuestionsService(1, undefined);

    expect(
      instructorExamRepository.getQuestionsByInstructor
    ).toHaveBeenCalledWith(10, {});
    expect(result).toEqual([Q1]);
  });
});
