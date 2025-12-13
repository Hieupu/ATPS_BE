jest.mock("../repositories/staffRepository", () => ({
  create: jest.fn(),
}));

const staffRepository = require("../repositories/staffRepository");
const staffService = require("../services/staffService");

describe("staffService.createStaff", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("creates staff when AccID and FullName are provided", async () => {
    const payload = { AccID: 1, FullName: "Staff A" };
    staffRepository.create.mockResolvedValue({
      StaffID: 10,
      AccID: 1,
      FullName: "Staff A",
    });

    const result = await staffService.createStaff(payload);

    expect(staffRepository.create).toHaveBeenCalledWith(payload);
    expect(result.StaffID).toBe(10);
    expect(result.AccID).toBe(1);
    expect(result.FullName).toBe("Staff A");
  });

  test("throws ServiceError 400 when missing AccID", async () => {
    await expect(
      staffService.createStaff({ FullName: "Staff A" })
    ).rejects.toMatchObject({
      message: "Thiếu AccID",
      status: 400,
    });
  });

  test("throws ServiceError 400 when missing FullName", async () => {
    await expect(
      staffService.createStaff({ AccID: 1, FullName: " " })
    ).rejects.toMatchObject({
      message: "Thiếu FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when FullName is empty string", async () => {
    await expect(
      staffService.createStaff({ AccID: 1, FullName: "" })
    ).rejects.toMatchObject({
      message: "Thiếu FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when AccID is null", async () => {
    await expect(
      staffService.createStaff({ AccID: null, FullName: "Staff A" })
    ).rejects.toMatchObject({
      message: "Thiếu AccID",
      status: 400,
    });
  });

  test("throws ServiceError 400 when AccID is undefined", async () => {
    await expect(
      staffService.createStaff({ AccID: undefined, FullName: "Staff A" })
    ).rejects.toMatchObject({
      message: "Thiếu AccID",
      status: 400,
    });
  });

  test("throws ServiceError 400 when FullName is null", async () => {
    await expect(
      staffService.createStaff({ AccID: 1, FullName: null })
    ).rejects.toMatchObject({
      message: "Thiếu FullName",
      status: 400,
    });
  });

  test("throws ServiceError 400 when FullName is only whitespace", async () => {
    await expect(
      staffService.createStaff({ AccID: 1, FullName: "   \t\n  " })
    ).rejects.toMatchObject({
      message: "Thiếu FullName",
      status: 400,
    });
  });

  test("propagates repository errors", async () => {
    const repoError = new Error("Database error");
    staffRepository.create.mockRejectedValue(repoError);

    await expect(
      staffService.createStaff({ AccID: 1, FullName: "Staff A" })
    ).rejects.toThrow("Database error");
  });

  test("handles repository errors with status code", async () => {
    const err = new Error("Duplicate entry");
    err.status = 409;
    staffRepository.create.mockRejectedValue(err);

    await expect(
      staffService.createStaff({ AccID: 1, FullName: "Staff A" })
    ).rejects.toMatchObject({
      message: "Duplicate entry",
      status: 409,
    });
  });
});

