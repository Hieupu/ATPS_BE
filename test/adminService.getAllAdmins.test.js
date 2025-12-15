jest.mock("../repositories/adminRepository", () => ({
  findAll: jest.fn(),
}));

const adminRepository = require("../repositories/adminRepository");
const adminService = require("../services/adminService");

describe("adminService.getAllAdmins", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - repository trả về danh sách admin với options -> trả về danh sách admin", async () => {
    const fakeAdmins = [{ AccID: 1, FullName: "Admin A" }];
    adminRepository.findAll.mockResolvedValue(fakeAdmins);

    const result = await adminService.getAllAdmins({ page: 1 });

    expect(adminRepository.findAll).toHaveBeenCalledWith({ page: 1 });
    expect(result).toEqual(fakeAdmins);
  });

  test("UTCID02 - repository trả về mảng rỗng -> trả về mảng rỗng", async () => {
    adminRepository.findAll.mockResolvedValue([]);

    const result = await adminService.getAllAdmins();

    expect(adminRepository.findAll).toHaveBeenCalledWith({});
    expect(result).toEqual([]);
  });

  test("UTCID03 - repository lỗi generic -> ServiceError 500 với message tiếng Việt", async () => {
    adminRepository.findAll.mockRejectedValue(new Error("db down"));

    await expect(adminService.getAllAdmins()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách admin",
      status: 500,
    });
  });

  test("UTCID04 - repository lỗi có status 404 -> ServiceError 404 với message tiếng Việt", async () => {
    const err = new Error("Not found");
    err.status = 404;
    adminRepository.findAll.mockRejectedValue(err);

    await expect(adminService.getAllAdmins()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách admin",
      status: 404,
    });
  });

  test("UTCID05 - repository lỗi có status 403 -> ServiceError 403 với message tiếng Việt", async () => {
    const err = new Error("Forbidden");
    err.status = 403;
    adminRepository.findAll.mockRejectedValue(err);

    await expect(adminService.getAllAdmins()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách admin",
      status: 403,
    });
  });
});
