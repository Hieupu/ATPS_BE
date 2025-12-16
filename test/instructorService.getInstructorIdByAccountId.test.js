jest.mock("../repositories/instructorRepository", () => ({
  getInstructorIdByAccountId: jest.fn(),
  getAllInstructors: jest.fn(),
  getInstructorById: jest.fn(),
  getInstructorReviews: jest.fn(),
  getFeaturedInstructors: jest.fn(),
  searchInstructors: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const instructorService = require("../services/instructorService");

describe("instructorService - getInstructorIdByAccountId", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - accountId hợp lệ (10), repo trả 5 -> service trả 5", async () => {
    instructorRepository.getInstructorIdByAccountId.mockResolvedValue(5);

    const result = await instructorService.getInstructorIdByAccountId(10);

    expect(
      instructorRepository.getInstructorIdByAccountId
    ).toHaveBeenCalledWith(10);
    expect(result).toBe(5);
  });

  test("UTCID02 - accountId khác (20), repo trả null -> service trả null", async () => {
    instructorRepository.getInstructorIdByAccountId.mockResolvedValue(null);

    const result = await instructorService.getInstructorIdByAccountId(20);

    expect(
      instructorRepository.getInstructorIdByAccountId
    ).toHaveBeenCalledWith(20);
    expect(result).toBeNull();
  });

  test("UTCID03 - accountId = 0, repo trả 0 -> service trả 0", async () => {
    instructorRepository.getInstructorIdByAccountId.mockResolvedValue(0);

    const result = await instructorService.getInstructorIdByAccountId(0);

    expect(
      instructorRepository.getInstructorIdByAccountId
    ).toHaveBeenCalledWith(0);
    expect(result).toBe(0);
  });

  test("UTCID04 - repo ném ServiceError('Not found') -> service log error và ném lại", async () => {
    const error = new Error("Not found");
    instructorRepository.getInstructorIdByAccountId.mockRejectedValue(error);

    await expect(
      instructorService.getInstructorIdByAccountId(null)
    ).rejects.toThrow("Not found");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});


