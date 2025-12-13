jest.mock("../repositories/adminRepository", () => ({
  findById: jest.fn(),
  create: jest.fn(),
}));

const adminRepository = require("../repositories/adminRepository");
const adminService = require("../services/adminService");

describe("adminService.createAdmin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("creates admin when AccID and FullName are provided", async () => {
    const payload = { AccID: 1, FullName: "Admin A" };
    adminRepository.create.mockResolvedValue({
      AdminID: 10,
      AccID: 1,
      FullName: "Admin A",
    });

    const result = await adminService.createAdmin(payload);

    expect(adminRepository.create).toHaveBeenCalledWith({
      ...payload,
      AccID: 1,
      FullName: "Admin A",
    });
    expect(result.AdminID).toBe(10);
  });

  test("throws ServiceError 400 when missing FullName", async () => {
    await expect(
      adminService.createAdmin({ AccID: 1, FullName: " " })
    ).rejects.toThrow("Thiếu FullName");
  });

  test("wraps repository errors with ServiceError (status 500)", async () => {
    adminRepository.create.mockRejectedValue(new Error("db down"));

    await expect(
      adminService.createAdmin({ AccID: 1, FullName: "Admin A" })
    ).rejects.toMatchObject({
      message: "Lỗi khi tạo admin",
      status: 500,
    });
  });

  test("preserves repository error status code when provided (e.g., 409 Conflict)", async () => {
    const err = new Error("Account already has an admin record");
    err.status = 409;
    adminRepository.create.mockRejectedValue(err);

    await expect(
      adminService.createAdmin({ AccID: 1, FullName: "Admin A" })
    ).rejects.toMatchObject({
      message: "Lỗi khi tạo admin",
      status: 409,
    });
  });

  test("returns 403 when repository signals PERMISSION_DENIED error", async () => {
    const err = new Error("Forbidden");
    err.code = "PERMISSION_DENIED";
    adminRepository.create.mockRejectedValue(err);

    await expect(
      adminService.createAdmin({ AccID: 1, FullName: "Admin A" })
    ).rejects.toMatchObject({
      message: "Lỗi khi tạo admin",
      status: 403,
    });
  });
});
