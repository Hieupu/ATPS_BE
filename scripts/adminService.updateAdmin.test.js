jest.mock("../repositories/adminRepository", () => ({
  update: jest.fn(),
}));

const adminRepository = require("../repositories/adminRepository");
const adminService = require("../services/adminService");

describe("adminService.updateAdmin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const adminId = 99;
  const payload = { FullName: "Admin Updated" };

  test("updates admin successfully", async () => {
    adminRepository.update.mockResolvedValue({ affectedRows: 1, ...payload });

    const result = await adminService.updateAdmin(adminId, payload);

    expect(adminRepository.update).toHaveBeenCalledWith(adminId, payload);
    expect(result).toEqual({ affectedRows: 1, ...payload });
  });

  test("throws ServiceError 404 when admin not found", async () => {
    adminRepository.update.mockResolvedValue(null);

    await expect(adminService.updateAdmin(adminId, payload)).rejects.toThrow(
      "Admin không tồn tại"
    );
  });

  test("wraps repository errors with ServiceError (status 500)", async () => {
    adminRepository.update.mockRejectedValue(new Error("db down"));

    await expect(adminService.updateAdmin(adminId, payload)).rejects.toThrow(
      "Lỗi khi cập nhật admin"
    );
  });

  test("propagates repository error status if provided", async () => {
    const err = new Error("conflict");
    err.status = 409;
    adminRepository.update.mockRejectedValue(err);

    await expect(
      adminService.updateAdmin(adminId, payload)
    ).rejects.toMatchObject({ message: "Lỗi khi cập nhật admin", status: 409 });
  });

  test("returns 403 when repository signals PERMISSION_DENIED error", async () => {
    const err = new Error("Forbidden");
    err.code = "PERMISSION_DENIED";
    adminRepository.update.mockRejectedValue(err);

    await expect(
      adminService.updateAdmin(adminId, payload)
    ).rejects.toMatchObject({ message: "Lỗi khi cập nhật admin", status: 403 });
  });
});
