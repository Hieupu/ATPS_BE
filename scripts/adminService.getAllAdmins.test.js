jest.mock("../repositories/adminRepository", () => ({
  findAll: jest.fn(),
}));

const adminRepository = require("../repositories/adminRepository");
const adminService = require("../services/adminService");

describe("adminService.getAllAdmins", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns list of admins from repository with options", async () => {
    const fakeAdmins = [{ AccID: 1, FullName: "Admin A" }];
    adminRepository.findAll.mockResolvedValue(fakeAdmins);

    const result = await adminService.getAllAdmins({ page: 1 });

    expect(adminRepository.findAll).toHaveBeenCalledWith({ page: 1 });
    expect(result).toEqual(fakeAdmins);
  });

  test("returns empty list when repository returns empty", async () => {
    adminRepository.findAll.mockResolvedValue([]);

    const result = await adminService.getAllAdmins();

    expect(adminRepository.findAll).toHaveBeenCalledWith({});
    expect(result).toEqual([]);
  });

  test("throws ServiceError (status 500) when repository fails with generic error", async () => {
    adminRepository.findAll.mockRejectedValue(new Error("db down"));

    await expect(adminService.getAllAdmins()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách admin",
      status: 500,
    });
  });

  test("propagates ServiceError status when repository throws with status", async () => {
    const err = new Error("Not found");
    err.status = 404;
    adminRepository.findAll.mockRejectedValue(err);

    await expect(adminService.getAllAdmins()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách admin",
      status: 404,
    });
  });

  test("returns 403 when repository signals permission error", async () => {
    const err = new Error("Forbidden");
    err.status = 403;
    adminRepository.findAll.mockRejectedValue(err);

    await expect(adminService.getAllAdmins()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách admin",
      status: 403,
    });
  });
});
