jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
  listByInstructor: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  markAsDeleted: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  listByCourse: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({}));
jest.mock("../repositories/InstructorMaterialRepository", () => ({}));

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");

const {
  listUnitsByCourseService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - listUnitsByCourseService", () => {
  const courseId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - courseId hợp lệ, course tồn tại, repo trả units -> trả message và units", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Title: "Math",
    });
    const units = [{ UnitID: 10 }, { UnitID: 11 }];
    unitRepository.listByCourse.mockResolvedValue(units);

    const result = await listUnitsByCourseService(courseId);

    expect(courseRepository.findById).toHaveBeenCalledWith(courseId);
    expect(unitRepository.listByCourse).toHaveBeenCalledWith(courseId);
    expect(result).toEqual({
      message: "Danh sách unit theo course",
      units,
    });
  });

  test("UTCID02 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(listUnitsByCourseService(9999999)).rejects.toThrow(
      "Course không tồn tại"
    );
  });

  test("UTCID03 - courseId là null, findById trả null hoặc lỗi -> ném ServiceError", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(listUnitsByCourseService(null)).rejects.toThrow(
      "Course không tồn tại"
    );
  });

  test("UTCID04 - repo listByCourse trả [] -> vẫn trả message với units = []", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Title: "Math",
    });
    unitRepository.listByCourse.mockResolvedValue([]);

    const result = await listUnitsByCourseService(courseId);

    expect(result).toEqual({
      message: "Danh sách unit theo course",
      units: [],
    });
  });

  test("UTCID05 - repo listByCourse ném lỗi -> propagate lỗi", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Title: "Math",
    });
    unitRepository.listByCourse.mockRejectedValue(new Error("DB error"));

    await expect(listUnitsByCourseService(courseId)).rejects.toThrow(
      "DB error"
    );
  });

  test("UTCID06 - findById ném lỗi -> propagate lỗi", async () => {
    courseRepository.findById.mockRejectedValue(new Error("DB error 2"));

    await expect(listUnitsByCourseService(courseId)).rejects.toThrow(
      "DB error 2"
    );
  });
});


