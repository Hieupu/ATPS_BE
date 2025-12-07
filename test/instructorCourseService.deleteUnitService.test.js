jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  findById: jest.fn(),
  markAsDeleted: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({}));
jest.mock("../repositories/InstructorMaterialRepository", () => ({}));

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");

const {
  deleteUnitService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - deleteUnitService", () => {
  const unitId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockUnit(courseStatus = "DRAFT") {
    unitRepository.findById.mockResolvedValue({
      UnitID: unitId,
      CourseID: 5,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: courseStatus,
    });
  }

  test("UTCID01 - unit tồn tại, course DRAFT -> markAsDeleted được gọi và trả message DELETED", async () => {
    mockUnit("DRAFT");
    unitRepository.markAsDeleted.mockResolvedValue();

    const result = await deleteUnitService(unitId);

    expect(unitRepository.findById).toHaveBeenCalledWith(unitId);
    expect(courseRepository.findById).toHaveBeenCalledWith(5);
    expect(unitRepository.markAsDeleted).toHaveBeenCalledWith(unitId);
    expect(result).toEqual({
      message: "Đã chuyển Unit sang trạng thái DELETED",
    });
  });

  test("UTCID02 - unitId không tồn tại -> ném ServiceError 'Unit không tồn tại'", async () => {
    unitRepository.findById.mockResolvedValue(null);

    await expect(deleteUnitService(999999)).rejects.toThrow(
      "Unit không tồn tại"
    );
  });

  test("UTCID03 - course của unit không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: unitId,
      CourseID: 5,
    });
    courseRepository.findById.mockResolvedValue(null);

    await expect(deleteUnitService(unitId)).rejects.toThrow(
      "Course không tồn tại"
    );
  });

  test("UTCID04 - course Status khác DRAFT (PUBLISHED) -> ném ServiceError 'Không thể xóa Unit khi course không ở trạng thái DRAFT'", async () => {
    mockUnit("PUBLISHED");

    await expect(deleteUnitService(unitId)).rejects.toThrow(
      "Không thể xóa Unit khi course không ở trạng thái DRAFT"
    );
    expect(unitRepository.markAsDeleted).not.toHaveBeenCalled();
  });
});


