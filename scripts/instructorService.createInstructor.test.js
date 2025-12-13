jest.mock("../repositories/instructorRepository", () => ({
  create: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const instructorService = require("../services/instructorService");

describe("instructorService.createInstructor", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("creates instructor when AccID and FullName are provided", async () => {
    const payload = { AccID: 1, FullName: "Instructor A" };
    instructorRepository.create.mockResolvedValue({
      InstructorID: 10,
      AccID: 1,
      FullName: "Instructor A",
    });

    const result = await instructorService.createInstructor(payload);

    expect(instructorRepository.create).toHaveBeenCalledWith(payload);
    expect(result.InstructorID).toBe(10);
    expect(result.AccID).toBe(1);
    expect(result.FullName).toBe("Instructor A");
  });

  test("throws ServiceError 400 when missing AccID", async () => {
    await expect(
      instructorService.createInstructor({ FullName: "Instructor A" })
    ).rejects.toMatchObject({
      message: "Thiếu AccID hoặc FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when missing FullName", async () => {
    await expect(
      instructorService.createInstructor({ AccID: 1 })
    ).rejects.toMatchObject({
      message: "Thiếu AccID hoặc FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when both AccID and FullName are missing", async () => {
    await expect(instructorService.createInstructor({})).rejects.toMatchObject({
      message: "Thiếu AccID hoặc FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when AccID is null", async () => {
    await expect(
      instructorService.createInstructor({
        AccID: null,
        FullName: "Instructor A",
      })
    ).rejects.toMatchObject({
      message: "Thiếu AccID hoặc FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when AccID is undefined", async () => {
    await expect(
      instructorService.createInstructor({
        AccID: undefined,
        FullName: "Instructor A",
      })
    ).rejects.toMatchObject({
      message: "Thiếu AccID hoặc FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when FullName is null", async () => {
    await expect(
      instructorService.createInstructor({ AccID: 1, FullName: null })
    ).rejects.toMatchObject({
      message: "Thiếu AccID hoặc FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when FullName is empty string", async () => {
    await expect(
      instructorService.createInstructor({ AccID: 1, FullName: "" })
    ).rejects.toMatchObject({
      message: "Thiếu AccID hoặc FullName",
      status: 400,
    });
  });

  test("propagates repository errors", async () => {
    const repoError = new Error("Database error");
    instructorRepository.create.mockRejectedValue(repoError);

    await expect(
      instructorService.createInstructor({ AccID: 1, FullName: "Instructor A" })
    ).rejects.toThrow("Database error");
  });

  test("handles repository errors with status code", async () => {
    const err = new Error("Duplicate entry");
    err.status = 409;
    instructorRepository.create.mockRejectedValue(err);

    await expect(
      instructorService.createInstructor({ AccID: 1, FullName: "Instructor A" })
    ).rejects.toMatchObject({
      message: "Duplicate entry",
      status: 409,
    });
  });
});
