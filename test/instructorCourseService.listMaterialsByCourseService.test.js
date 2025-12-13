jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/InstructorMaterialRepository", () => ({
  listByCourse: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");
const materialRepository = require("../repositories/InstructorMaterialRepository");

const {
  listMaterialsByCourseService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - listMaterialsByCourseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(listMaterialsByCourseService(123)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(materialRepository.listByCourse).not.toHaveBeenCalled();
  });

  test("UTCID02 - course tồn tại, có materials -> trả message và danh sách materials", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Title: "Course 1",
    });
    materialRepository.listByCourse.mockResolvedValue([
      { id: 10 },
      { id: 11 },
    ]);

    const result = await listMaterialsByCourseService(1);

    expect(courseRepository.findById).toHaveBeenCalledWith(1);
    expect(materialRepository.listByCourse).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      message: "Danh sách material theo course",
      materials: [{ id: 10 }, { id: 11 }],
    });
  });

  test("UTCID03 - course tồn tại, không có materials -> trả message và materials rỗng", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Title: "Course 1",
    });
    materialRepository.listByCourse.mockResolvedValue([]);

    const result = await listMaterialsByCourseService(1);

    expect(courseRepository.findById).toHaveBeenCalledWith(1);
    expect(materialRepository.listByCourse).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      message: "Danh sách material theo course",
      materials: [],
    });
  });

  test("UTCID04 - courseId undefined -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(listMaterialsByCourseService(undefined)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(materialRepository.listByCourse).not.toHaveBeenCalled();
  });
});

