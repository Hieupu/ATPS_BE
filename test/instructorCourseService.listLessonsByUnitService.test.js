jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({
  listByUnit: jest.fn(),
}));

jest.mock("../repositories/InstructorMaterialRepository", () => ({}));

const unitRepository = require("../repositories/instructorUnitRepository");
const lessonRepository = require("../repositories/instructorLessonRepository");

const {
  listLessonsByUnitService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - listLessonsByUnitService", () => {
  const unitId = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - unitId hợp lệ, unit tồn tại -> trả message và danh sách lessons", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: unitId,
      Title: "Unit 1",
    });
    const lessons = [{ LessonID: 1 }, { LessonID: 2 }];
    lessonRepository.listByUnit.mockResolvedValue(lessons);

    const result = await listLessonsByUnitService(unitId);

    expect(unitRepository.findById).toHaveBeenCalledWith(unitId);
    expect(lessonRepository.listByUnit).toHaveBeenCalledWith(unitId);
    expect(result).toEqual({
      message: "Danh sách lesson theo unit",
      lessons,
    });
  });

  test("UTCID02 - unitId không tồn tại (null hoặc -5) -> ném ServiceError 'Unit không tồn tại'", async () => {
    unitRepository.findById.mockResolvedValue(null);

    await expect(listLessonsByUnitService(null)).rejects.toThrow(
      "Unit không tồn tại"
    );

    unitRepository.findById.mockResolvedValue(null);
    await expect(listLessonsByUnitService(-5)).rejects.toThrow(
      "Unit không tồn tại"
    );
  });

  test("UTCID03 - repo listByUnit ném lỗi -> service propagate lỗi", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: unitId,
      Title: "Unit 1",
    });
    lessonRepository.listByUnit.mockRejectedValue(new Error("DB error"));

    await expect(listLessonsByUnitService(unitId)).rejects.toThrow("DB error");
  });
});


