jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
  markAsDeleted: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({}));
jest.mock("../repositories/instructorLessonRepository", () => ({}));
jest.mock("../repositories/InstructorMaterialRepository", () => ({}));

const courseRepository = require("../repositories/instructorCourseRepository");
const { deleteCourseService } = require("../services/instructorCourseService");

describe("instructorCourseService - deleteCourseService", () => {
  const courseId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - course tồn tại, Status DRAFT -> markAsDeleted được gọi và trả message DELETED", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: "DRAFT",
    });
    courseRepository.markAsDeleted.mockResolvedValue();

    const result = await deleteCourseService(courseId);

    expect(courseRepository.findById).toHaveBeenCalledWith(courseId);
    expect(courseRepository.markAsDeleted).toHaveBeenCalledWith(courseId);
    expect(result).toEqual({
      message: "Khóa học đã được chuyển sang trạng thái DELETED",
    });
  });

  test("UTCID02 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(deleteCourseService(9999999)).rejects.toThrow(
      "Course không tồn tại"
    );
  });

  test("UTCID03 - course Status khác DRAFT (PUBLISHED) -> ném ServiceError 'Chỉ có thể xóa khi course ở trạng thái DRAFT'", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: "PUBLISHED",
    });

    await expect(deleteCourseService(courseId)).rejects.toThrow(
      "Chỉ có thể xóa khi course ở trạng thái DRAFT"
    );
    expect(courseRepository.markAsDeleted).not.toHaveBeenCalled();
  });

  test("UTCID04 - markAsDeleted ném lỗi -> service propagate lỗi", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: "DRAFT",
    });
    courseRepository.markAsDeleted.mockRejectedValue(new Error("DB error"));

    await expect(deleteCourseService(courseId)).rejects.toThrow("DB error");
  });
});
