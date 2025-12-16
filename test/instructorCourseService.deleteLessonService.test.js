jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({
  markAsDeleted: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const lessonRepository = require("../repositories/instructorLessonRepository");

const { deleteLessonService } = require("../services/instructorCourseService");

describe("instructorCourseService - deleteLessonService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - course Status PUBLISHED -> ném ServiceError 'Không thể xóa Lesson khi course không ở trạng thái DRAFT'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 10,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "PUBLISHED",
    });

    await expect(deleteLessonService(1, 10)).rejects.toThrow(
      "Không thể xóa Lesson khi course không ở trạng thái DRAFT"
    );
    expect(lessonRepository.markAsDeleted).not.toHaveBeenCalled();
  });

  test("UTCID02 - course Status DRAFT -> markAsDeleted được gọi và trả message 'Đã chuyển lesson sang trạng thái DELETED'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 10,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });
    lessonRepository.markAsDeleted.mockResolvedValue();

    const result = await deleteLessonService(1, 10);

    expect(lessonRepository.markAsDeleted).toHaveBeenCalledWith(1, 10);
    expect(result).toEqual({
      message: "Đã chuyển lesson sang trạng thái DELETED",
    });
  });

  test("UTCID03 - unitId không tồn tại -> ném ServiceError 'Unit không tồn tại'", async () => {
    unitRepository.findById.mockResolvedValue(null);

    await expect(deleteLessonService(99999, 10)).rejects.toThrow(
      "Unit không tồn tại"
    );
    expect(lessonRepository.markAsDeleted).not.toHaveBeenCalled();
  });
});

