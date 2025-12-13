jest.mock("../repositories/instructorRepository", () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const instructorService = require("../services/instructorService");

describe("instructorService.updateInstructor", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const instructorId = 99;
  const payload = { FullName: "Instructor Updated" };

  test("updates instructor successfully", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      AccID: 1,
      FullName: "Instructor Old",
    };
    const updatedInstructor = {
      InstructorID: instructorId,
      AccID: 1,
      FullName: "Instructor Updated",
    };

    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.update.mockResolvedValue(updatedInstructor);

    const result = await instructorService.updateInstructor(
      instructorId,
      payload
    );

    expect(instructorRepository.findById).toHaveBeenCalledWith(instructorId);
    expect(instructorRepository.update).toHaveBeenCalledWith(
      instructorId,
      payload
    );
    expect(result).toEqual(updatedInstructor);
    expect(result.FullName).toBe("Instructor Updated");
  });

  test("throws ServiceError 404 when instructor not found", async () => {
    instructorRepository.findById.mockResolvedValue(null);

    await expect(
      instructorService.updateInstructor(instructorId, payload)
    ).rejects.toMatchObject({
      message: "Giảng viên không tồn tại",
      status: 404,
    });
  });

  test("propagates repository errors from findById", async () => {
    const repoError = new Error("Database error");
    instructorRepository.findById.mockRejectedValue(repoError);

    await expect(
      instructorService.updateInstructor(instructorId, payload)
    ).rejects.toThrow("Database error");
  });

  test("propagates repository errors from update", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      AccID: 1,
      FullName: "Instructor Old",
    };
    const repoError = new Error("Update failed");
    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.update.mockRejectedValue(repoError);

    await expect(
      instructorService.updateInstructor(instructorId, payload)
    ).rejects.toThrow("Update failed");
  });

  test("handles repository errors with status code", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      AccID: 1,
      FullName: "Instructor Old",
    };
    const err = new Error("Conflict");
    err.status = 409;
    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.update.mockRejectedValue(err);

    await expect(
      instructorService.updateInstructor(instructorId, payload)
    ).rejects.toMatchObject({
      message: "Conflict",
      status: 409,
    });
  });

  test("handles invalid instructorId (null)", async () => {
    await expect(
      instructorService.updateInstructor(null, payload)
    ).rejects.toThrow();
  });

  test("handles invalid instructorId (0)", async () => {
    instructorRepository.findById.mockResolvedValue(null);

    await expect(
      instructorService.updateInstructor(0, payload)
    ).rejects.toThrow("Giảng viên không tồn tại");
  });

  test("handles empty payload", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      AccID: 1,
      FullName: "Instructor Old",
    };
    const updatedInstructor = {
      InstructorID: instructorId,
      AccID: 1,
      FullName: "Instructor Old",
    };

    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.update.mockResolvedValue(updatedInstructor);

    const result = await instructorService.updateInstructor(instructorId, {});

    expect(instructorRepository.update).toHaveBeenCalledWith(instructorId, {});
    expect(result).toEqual(updatedInstructor);
  });
});

