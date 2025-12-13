jest.mock("../repositories/staffRepository", () => ({
  update: jest.fn(),
}));

const staffRepository = require("../repositories/staffRepository");
const staffService = require("../services/staffService");

describe("staffService.updateStaff", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const staffId = 99;
  const payload = { FullName: "Staff Updated" };

  test("updates staff successfully", async () => {
    const updatedStaff = {
      StaffID: staffId,
      AccID: 1,
      FullName: "Staff Updated",
    };
    staffRepository.update.mockResolvedValue(updatedStaff);

    const result = await staffService.updateStaff(staffId, payload);

    expect(staffRepository.update).toHaveBeenCalledWith(staffId, payload);
    expect(result).toEqual(updatedStaff);
    expect(result.FullName).toBe("Staff Updated");
  });

  test("throws ServiceError 404 when staff not found", async () => {
    staffRepository.update.mockResolvedValue(null);

    await expect(
      staffService.updateStaff(staffId, payload)
    ).rejects.toMatchObject({
      message: "Nhân viên không tồn tại",
      status: 404,
    });
  });

  test("wraps repository errors with ServiceError (status 500)", async () => {
    staffRepository.update.mockRejectedValue(new Error("db down"));

    await expect(
      staffService.updateStaff(staffId, payload)
    ).rejects.toMatchObject({
      message: "Lỗi khi cập nhật nhân viên",
      status: 500,
    });
  });

  test("propagates repository error status if provided", async () => {
    const err = new Error("conflict");
    err.status = 409;
    staffRepository.update.mockRejectedValue(err);

    await expect(
      staffService.updateStaff(staffId, payload)
    ).rejects.toMatchObject({
      message: "Lỗi khi cập nhật nhân viên",
      status: 409,
    });
  });

  test("returns 403 when repository signals PERMISSION_DENIED error", async () => {
    const err = new Error("Forbidden");
    err.code = "PERMISSION_DENIED";
    staffRepository.update.mockRejectedValue(err);

    await expect(
      staffService.updateStaff(staffId, payload)
    ).rejects.toMatchObject({
      message: "Lỗi khi cập nhật nhân viên",
      status: 403,
    });
  });

  test("handles invalid staffId (null)", async () => {
    await expect(
      staffService.updateStaff(null, payload)
    ).rejects.toThrow();
  });

  test("handles invalid staffId (0)", async () => {
    staffRepository.update.mockResolvedValue(null);

    await expect(
      staffService.updateStaff(0, payload)
    ).rejects.toMatchObject({
      message: "Nhân viên không tồn tại",
      status: 404,
    });
  });

  test("handles empty payload", async () => {
    const updatedStaff = { StaffID: staffId, AccID: 1, FullName: "Staff A" };
    staffRepository.update.mockResolvedValue(updatedStaff);

    const result = await staffService.updateStaff(staffId, {});

    expect(staffRepository.update).toHaveBeenCalledWith(staffId, {});
    expect(result).toEqual(updatedStaff);
  });
});

