jest.mock("../repositories/staffRepository", () => ({
  findAll: jest.fn(),
}));

const staffRepository = require("../repositories/staffRepository");
const staffService = require("../services/staffService");

describe("staffService.getAllStaff", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns empty array when repository returns empty", async () => {
    staffRepository.findAll.mockResolvedValue([]);

    const result = await staffService.getAllStaff();

    expect(staffRepository.findAll).toHaveBeenCalledWith({});
    expect(result).toEqual([]);
  });

  test("throws ServiceError (status 500) when repository fails with generic error", async () => {
    staffRepository.findAll.mockRejectedValue(new Error("db down"));

    await expect(staffService.getAllStaff()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách nhân viên",
      status: 500,
    });
  });

  test("propagates ServiceError status when repository throws with status", async () => {
    const err = new Error("Not found");
    err.status = 404;
    staffRepository.findAll.mockRejectedValue(err);

    await expect(staffService.getAllStaff()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách nhân viên",
      status: 404,
    });
  });

  test("returns 403 when repository signals PERMISSION_DENIED error", async () => {
    const err = new Error("Forbidden");
    err.code = "PERMISSION_DENIED";
    staffRepository.findAll.mockRejectedValue(err);

    await expect(staffService.getAllStaff()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách nhân viên",
      status: 403,
    });
  });

  test("handles null options", async () => {
    const fakeStaff = [{ StaffID: 1, AccID: 10, FullName: "Staff A" }];
    staffRepository.findAll.mockResolvedValue(fakeStaff);

    const result = await staffService.getAllStaff(null);

    expect(staffRepository.findAll).toHaveBeenCalledWith(null);
    expect(result).toEqual(fakeStaff);
  });
});
