jest.mock("../repositories/instructorExamRepository", () => ({
  getInstructorIdByAccId: jest.fn(),
  getInstanceById: jest.fn(),
  checkExamOwnership: jest.fn(),
  getExamResultsByInstance: jest.fn(),
}));

const instructorExamRepository = require("../repositories/instructorExamRepository");
const { getExamResultsService } = require("../services/instructorExamService");

describe("instructorExamService - getExamResultsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorAccId=1, instanceId=100 -> return results array", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    const instance = { InstanceID: 100, ExamId: 50 };
    instructorExamRepository.getInstanceById.mockResolvedValue(instance);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(true);
    const results = [
      { learnerId: 1, score: 85 },
      { learnerId: 2, score: 90 },
    ];
    instructorExamRepository.getExamResultsByInstance.mockResolvedValue(
      results
    );

    const result = await getExamResultsService(1, 100);

    expect(
      instructorExamRepository.getInstructorIdByAccId
    ).toHaveBeenCalledWith(1);
    expect(instructorExamRepository.getInstanceById).toHaveBeenCalledWith(100);
    expect(instructorExamRepository.checkExamOwnership).toHaveBeenCalledWith(
      50,
      10
    );
    expect(
      instructorExamRepository.getExamResultsByInstance
    ).toHaveBeenCalledWith(100);
    expect(result).toEqual(results);
  });

  test("UTCID02 - instructorAccId=9999, instanceId=100 -> throw Error 'Không tìm thấy thông tin giảng viên'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(null);

    await expect(getExamResultsService(9999, 100)).rejects.toThrow(
      "Không tìm thấy thông tin giảng viên"
    );
    expect(instructorExamRepository.getInstanceById).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorAccId=2, instanceId=100 -> throw Error 'Không có quyền truy cập phiên thi này'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    const instance = { InstanceID: 100, ExamId: 50 };
    instructorExamRepository.getInstanceById.mockResolvedValue(instance);
    instructorExamRepository.checkExamOwnership.mockResolvedValue(false);

    await expect(getExamResultsService(2, 100)).rejects.toThrow(
      "Không có quyền truy cập phiên thi này"
    );
    expect(
      instructorExamRepository.getExamResultsByInstance
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorAccId=1, instanceId=9999 -> throw Error 'Không tìm thấy phiên thi'", async () => {
    instructorExamRepository.getInstructorIdByAccId.mockResolvedValue(10);
    instructorExamRepository.getInstanceById.mockResolvedValue(null);

    await expect(getExamResultsService(1, 9999)).rejects.toThrow(
      "Không tìm thấy phiên thi"
    );
    expect(instructorExamRepository.checkExamOwnership).not.toHaveBeenCalled();
  });
});
