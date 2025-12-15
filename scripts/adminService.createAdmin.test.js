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

  test("UTCID01 - AccID và FullName hợp lệ -> tạo admin thành công", async () => {
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

  test("UTCID02 - FullName chỉ có khoảng trắng -> ServiceError 400 'Thiếu FullName'", async () => {
    await expect(
      adminService.createAdmin({ AccID: 1, FullName: " " })
    ).rejects.toThrow("Thiếu FullName");
  });

  test("UTCID03 - repository lỗi generic -> ServiceError 500 với message tiếng Việt", async () => {
    adminRepository.create.mockRejectedValue(new Error("db down"));

    await expect(
      adminService.createAdmin({ AccID: 1, FullName: "Admin A" })
    ).rejects.toMatchObject({
      message: "Lỗi khi tạo admin",
      status: 500,
    });
  });

  test("UTCID04 - repository lỗi có status 409 -> ServiceError 409 với message tiếng Việt", async () => {
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

  test("UTCID05 - repository PERMISSION_DENIED -> ServiceError 403 với message tiếng Việt", async () => {
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
