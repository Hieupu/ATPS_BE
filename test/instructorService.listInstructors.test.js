jest.mock("../repositories/instructorRepository", () => ({
  getAllInstructors: jest.fn(),
}));

jest.mock("../repositories/courseRepository", () => ({
  getInstructorStats: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const courseRepository = require("../repositories/courseRepository");

const instructorService = require("../services/instructorService");

describe("instructorService - listInstructors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - không có instructor nào (getAllInstructors trả []) -> trả []", async () => {
    instructorRepository.getAllInstructors.mockResolvedValue([]);

    const result = await instructorService.listInstructors();

    expect(instructorRepository.getAllInstructors).toHaveBeenCalled();
    expect(courseRepository.getInstructorStats).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test("UTCID02 - một instructor, stats trả về TotalCourses và TotalStudents -> merge đúng vào kết quả", async () => {
    instructorRepository.getAllInstructors.mockResolvedValue([
      { InstructorID: 1, Name: "A", Email: "a@example.com" },
    ]);
    courseRepository.getInstructorStats.mockResolvedValue({
      TotalCourses: 5,
      TotalStudents: 50,
    });

    const result = await instructorService.listInstructors();

    expect(instructorRepository.getAllInstructors).toHaveBeenCalled();
    expect(courseRepository.getInstructorStats).toHaveBeenCalledWith(1);
    expect(result).toEqual([
      {
        InstructorID: 1,
        Name: "A",
        Email: "a@example.com",
        TotalCourses: 5,
        TotalStudents: 50,
      },
    ]);
  });

  test("UTCID03 - nhiều instructor, stats trả về đúng cho từng instructor -> merge tương ứng", async () => {
    instructorRepository.getAllInstructors.mockResolvedValue([
      { InstructorID: 1, Name: "A" },
      { InstructorID: 2, Name: "B" },
    ]);
    courseRepository.getInstructorStats
      .mockResolvedValueOnce({ TotalCourses: 5, TotalStudents: 50 })
      .mockResolvedValueOnce({ TotalCourses: 3, TotalStudents: 30 });

    const result = await instructorService.listInstructors();

    expect(courseRepository.getInstructorStats).toHaveBeenCalledWith(1);
    expect(courseRepository.getInstructorStats).toHaveBeenCalledWith(2);
    expect(result).toEqual([
      {
        InstructorID: 1,
        Name: "A",
        TotalCourses: 5,
        TotalStudents: 50,
      },
      {
        InstructorID: 2,
        Name: "B",
        TotalCourses: 3,
        TotalStudents: 30,
      },
    ]);
  });

  test("UTCID04 - nhiều instructor, stats cho một instructor bị lỗi -> instructor đó nhận TotalCourses=0, TotalStudents=0", async () => {
    instructorRepository.getAllInstructors.mockResolvedValue([
      { InstructorID: 1, Name: "A" },
      { InstructorID: 2, Name: "B" },
    ]);
    courseRepository.getInstructorStats
      .mockResolvedValueOnce({ TotalCourses: 5, TotalStudents: 50 })
      .mockRejectedValueOnce(new Error("stats error"));

    const result = await instructorService.listInstructors();

    expect(result).toEqual([
      {
        InstructorID: 1,
        Name: "A",
        TotalCourses: 5,
        TotalStudents: 50,
      },
      {
        InstructorID: 2,
        Name: "B",
        TotalCourses: 0,
        TotalStudents: 0,
      },
    ]);
  });

  test("UTCID05 - stats cho tất cả instructor đều lỗi -> tất cả nhận TotalCourses=0, TotalStudents=0", async () => {
    instructorRepository.getAllInstructors.mockResolvedValue([
      { InstructorID: 1, Name: "A" },
      { InstructorID: 2, Name: "B" },
    ]);
    courseRepository.getInstructorStats.mockRejectedValue(
      new Error("stats error")
    );

    const result = await instructorService.listInstructors();

    expect(result).toEqual([
      { InstructorID: 1, Name: "A", TotalCourses: 0, TotalStudents: 0 },
      { InstructorID: 2, Name: "B", TotalCourses: 0, TotalStudents: 0 },
    ]);
  });
});
