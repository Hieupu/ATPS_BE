jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");

const {
  publishCourseService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - publishCourseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(publishCourseService(2)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(courseRepository.updateStatus).not.toHaveBeenCalled();
  });

  test("UTCID02 - course Status DRAFT -> ném ServiceError 'Chỉ có thể publish khi course đã ở trạng thái APPROVED'", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "DRAFT",
    });

    await expect(publishCourseService(5)).rejects.toThrow(
      "Chỉ có thể publish khi course đã ở trạng thái APPROVED"
    );
    expect(courseRepository.updateStatus).not.toHaveBeenCalled();
  });

  test("UTCID03 - course Status APPROVED -> updateStatus PUBLISHED và trả message, status đúng", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "APPROVED",
    });
    courseRepository.updateStatus.mockResolvedValue();

    const result = await publishCourseService(5);

    expect(courseRepository.updateStatus).toHaveBeenCalledWith(5, "PUBLISHED");
    expect(result).toEqual({
      message: "Course đã publish",
      status: "PUBLISHED",
    });
  });

  test("UTCID04 - course Status 'approved' (lowercase) -> vẫn coi là APPROVED, updateStatus PUBLISHED", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "approved",
    });
    courseRepository.updateStatus.mockResolvedValue();

    const result = await publishCourseService(5);

    expect(courseRepository.updateStatus).toHaveBeenCalledWith(5, "PUBLISHED");
    expect(result).toEqual({
      message: "Course đã publish",
      status: "PUBLISHED",
    });
  });
});


