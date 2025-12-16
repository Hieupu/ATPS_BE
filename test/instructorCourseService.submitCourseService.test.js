jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");

const {
  submitCourseService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - submitCourseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(submitCourseService(2)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(courseRepository.updateStatus).not.toHaveBeenCalled();
  });

  test("UTCID02 - course Status PUBLISHED -> ném ServiceError 'Chỉ có thể gửi duyệt khi course đang ở trạng thái DRAFT'", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "PUBLISHED",
    });

    await expect(submitCourseService(5)).rejects.toThrow(
      "Chỉ có thể gửi duyệt khi course đang ở trạng thái DRAFT"
    );
    expect(courseRepository.updateStatus).not.toHaveBeenCalled();
  });

  test("UTCID03 - course Status DRAFT -> updateStatus IN_REVIEW và trả message, status đúng", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "DRAFT",
    });
    courseRepository.updateStatus.mockResolvedValue();

    const result = await submitCourseService(5);

    expect(courseRepository.updateStatus).toHaveBeenCalledWith(5, "IN_REVIEW");
    expect(result).toEqual({
      message: "Khóa học đã gửi duyệt",
      status: "IN_REVIEW",
    });
  });

  test("UTCID04 - course Status 'draft' (lowercase) -> vẫn coi là DRAFT, updateStatus IN_REVIEW", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "draft",
    });
    courseRepository.updateStatus.mockResolvedValue();

    const result = await submitCourseService(5);

    expect(courseRepository.updateStatus).toHaveBeenCalledWith(5, "IN_REVIEW");
    expect(result).toEqual({
      message: "Khóa học đã gửi duyệt",
      status: "IN_REVIEW",
    });
  });
});


