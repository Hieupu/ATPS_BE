jest.mock("../repositories/instructorRepository", () => ({
  getAllInstructorsAdmin: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const instructorService = require("../services/instructorService");

describe("instructorService.getAllInstructorsAdmin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns list of instructors from repository", async () => {
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

  test("returns empty array when repository returns empty", async () => {
    instructorRepository.getAllInstructorsAdmin.mockResolvedValue([]);

    const result = await instructorService.getAllInstructorsAdmin();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  test("throws ServiceError (status 500) when repository fails with generic error", async () => {
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

  test("propagates ServiceError status when repository throws with status", async () => {
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

  test("returns 403 when repository signals PERMISSION_DENIED error", async () => {
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

  test("handles large result set", async () => {
    const largeInstructorList = Array.from({ length: 100 }, (_, i) => ({
      InstructorID: i + 1,
      AccID: i + 10,
      FullName: `Instructor ${i + 1}`,
      Status: "Active",
      Gender: i % 2 === 0 ? "Male" : "Female",
    }));
    instructorRepository.getAllInstructorsAdmin.mockResolvedValue(
      largeInstructorList
    );

    const result = await instructorService.getAllInstructorsAdmin();

    expect(result).toHaveLength(100);
    expect(result[0].InstructorID).toBe(1);
    expect(result[99].InstructorID).toBe(100);
  });
});
