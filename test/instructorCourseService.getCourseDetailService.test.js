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
  create: jest.fn(),
  update: jest.fn(),
  markAsDeleted: jest.fn(),
  getAssignmentsByUnitId: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({
  listByUnit: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  markAsDeleted: jest.fn(),
}));

jest.mock("../repositories/InstructorMaterialRepository", () => ({
  listByCourse: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  markAsDeleted: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const lessonRepository = require("../repositories/instructorLessonRepository");
const materialRepository = require("../repositories/InstructorMaterialRepository");

const {
  getCourseDetailService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - getCourseDetailService", () => {
  const courseId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - course tồn tại -> trả về course với Units (mỗi unit có Lessons[]) và Materials[]", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Title: "Khóa A",
    });
    unitRepository.listByCourse.mockResolvedValue([
      { UnitID: 10, Title: "Unit 1" },
      { UnitID: 11, Title: "Unit 2" },
    ]);
    lessonRepository.listByUnit
      .mockResolvedValueOnce([{ LessonID: 100 }])
      .mockResolvedValueOnce([{ LessonID: 200 }, { LessonID: 201 }]);
    materialRepository.listByCourse.mockResolvedValue([
      { MaterialID: 300 },
    ]);

    const result = await getCourseDetailService(courseId);

    expect(courseRepository.findById).toHaveBeenCalledWith(courseId);
    expect(unitRepository.listByCourse).toHaveBeenCalledWith(courseId);
    expect(lessonRepository.listByUnit).toHaveBeenCalledTimes(2);
    expect(materialRepository.listByCourse).toHaveBeenCalledWith(courseId);

    expect(result.CourseID).toBe(courseId);
    expect(result.Units).toHaveLength(2);
    expect(result.Units[0].Lessons).toEqual([{ LessonID: 100 }]);
    expect(result.Units[1].Lessons).toEqual([
      { LessonID: 200 },
      { LessonID: 201 },
    ]);
    expect(result.Materials).toEqual([{ MaterialID: 300 }]);
  });

  test("UTCID02 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(getCourseDetailService(9999)).rejects.toThrow(
      "Course không tồn tại"
    );
  });

  test("UTCID03 - course tồn tại nhưng repo trả Units rỗng và Materials rỗng -> vẫn trả về course với Units=[], Materials=[]", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Title: "Khóa B",
    });
    unitRepository.listByCourse.mockResolvedValue([]);
    materialRepository.listByCourse.mockResolvedValue([]);

    const result = await getCourseDetailService(courseId);

    expect(result.Units).toEqual([]);
    expect(result.Materials).toEqual([]);
  });
});


