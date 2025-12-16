jest.mock("../repositories/staffRepository", () => ({
  findAll: jest.fn(),
}));

const staffRepository = require("../repositories/staffRepository");
const staffService = require("../services/staffService");

describe("staffService.getAllStaff", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - repository trả về mảng rỗng -> trả về mảng rỗng", async () => {
    staffRepository.findAll.mockResolvedValue([]);

    const result = await staffService.getAllStaff();

    expect(staffRepository.findAll).toHaveBeenCalledWith({});
    expect(result).toEqual([]);
  });

  test("UTCID02 - repository lỗi generic -> ServiceError 500 với message tiếng Việt", async () => {
    staffRepository.findAll.mockRejectedValue(new Error("db down"));

    await expect(staffService.getAllStaff()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách nhân viên",
      status: 500,
    });
  });

  test("UTCID03 - repository lỗi có status 404 -> ServiceError 404 với message tiếng Việt", async () => {
    const err = new Error("Not found");
    err.status = 404;
    staffRepository.findAll.mockRejectedValue(err);

    await expect(staffService.getAllStaff()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách nhân viên",
      status: 404,
    });
  });

  test("UTCID04 - repository PERMISSION_DENIED -> ServiceError 403 với message tiếng Việt", async () => {
    const err = new Error("Forbidden");
    err.code = "PERMISSION_DENIED";
    staffRepository.findAll.mockRejectedValue(err);

    await expect(staffService.getAllStaff()).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách nhân viên",
      status: 403,
    });
  });

  test("UTCID05 - gọi với null options -> gọi repository với null và trả về kết quả", async () => {
    const fakeStaff = [{ StaffID: 1, AccID: 10, FullName: "Staff A" }];
    staffRepository.findAll.mockResolvedValue(fakeStaff);

    const result = await staffService.getAllStaff(null);

    expect(staffRepository.findAll).toHaveBeenCalledWith(null);
    expect(result).toEqual(fakeStaff);
  });
});
