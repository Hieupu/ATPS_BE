jest.mock("../repositories/instructorRepository", () => ({
  getAllInstructorsAdmin: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const instructorService = require("../services/instructorService");

describe("instructorService.getAllInstructorsAdmin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - repository trả về danh sách giảng viên -> trả về danh sách với Status và Gender", async () => {
    const fakeInstructors = [
      {
        InstructorID: 1,
        AccID: 10,
        FullName: "Instructor A",
        Status: "Active",
        Gender: "Male",
      },
      {
        InstructorID: 2,
        AccID: 11,
        FullName: "Instructor B",
        Status: "Active",
        Gender: "Female",
      },
    ];
    instructorRepository.getAllInstructorsAdmin.mockResolvedValue(
      fakeInstructors
    );

    const result = await instructorService.getAllInstructorsAdmin();

    expect(instructorRepository.getAllInstructorsAdmin).toHaveBeenCalledTimes(
      1
    );
    expect(result).toEqual(fakeInstructors);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("Status");
    expect(result[0]).toHaveProperty("Gender");
  });

  test("UTCID02 - repository trả về mảng rỗng -> trả về mảng rỗng", async () => {
    instructorRepository.getAllInstructorsAdmin.mockResolvedValue([]);

    const result = await instructorService.getAllInstructorsAdmin();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  test("UTCID03 - repository lỗi generic -> ServiceError 500 với message tiếng Việt", async () => {
    instructorRepository.getAllInstructorsAdmin.mockRejectedValue(
      new Error("db down")
    );

    await expect(
      instructorService.getAllInstructorsAdmin()
    ).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách giảng viên",
      status: 500,
    });
  });

  test("UTCID04 - repository lỗi có status 404 -> ServiceError 404 với message tiếng Việt", async () => {
    const err = new Error("Not found");
    err.status = 404;
    instructorRepository.getAllInstructorsAdmin.mockRejectedValue(err);

    await expect(
      instructorService.getAllInstructorsAdmin()
    ).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách giảng viên",
      status: 404,
    });
  });

  test("UTCID05 - repository PERMISSION_DENIED -> ServiceError 403 với message tiếng Việt", async () => {
    const err = new Error("Forbidden");
    err.code = "PERMISSION_DENIED";
    instructorRepository.getAllInstructorsAdmin.mockRejectedValue(err);

    await expect(
      instructorService.getAllInstructorsAdmin()
    ).rejects.toMatchObject({
      message: "Lỗi khi lấy danh sách giảng viên",
      status: 403,
    });
  });
});
