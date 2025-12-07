jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
  updateStatus: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");

const {
  approveCourseService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - approveCourseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(approveCourseService(2)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(courseRepository.updateStatus).not.toHaveBeenCalled();
  });

  test("UTCID02 - course Status DRAFT -> ném ServiceError 'Chỉ có thể duyệt khi course đang ở trạng thái IN_REVIEW'", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "DRAFT",
    });

    await expect(approveCourseService(5)).rejects.toThrow(
      "Chỉ có thể duyệt khi course đang ở trạng thái IN_REVIEW"
    );
    expect(courseRepository.updateStatus).not.toHaveBeenCalled();
  });

  test("UTCID03 - course Status IN_REVIEW -> updateStatus APPROVED và trả message, status đúng", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "IN_REVIEW",
    });
    courseRepository.updateStatus.mockResolvedValue();

    const result = await approveCourseService(5);

    expect(courseRepository.updateStatus).toHaveBeenCalledWith(5, "APPROVED");
    expect(result).toEqual({
      message: "Course đã được duyệt",
      status: "APPROVED",
    });
  });

  test("UTCID04 - course Status 'in_review' (lowercase) -> vẫn coi là IN_REVIEW, updateStatus APPROVED", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: "in_review",
    });
    courseRepository.updateStatus.mockResolvedValue();

    const result = await approveCourseService(5);

    expect(courseRepository.updateStatus).toHaveBeenCalledWith(5, "APPROVED");
    expect(result).toEqual({
      message: "Course đã được duyệt",
      status: "APPROVED",
    });
  });
});


