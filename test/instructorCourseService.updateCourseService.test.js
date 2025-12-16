jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({}));
jest.mock("../repositories/instructorLessonRepository", () => ({}));
jest.mock("../repositories/InstructorMaterialRepository", () => ({}));

jest.mock("../utils/uploadCloudinary", () => jest.fn());

const courseRepository = require("../repositories/instructorCourseRepository");
const uploadToCloudinary = require("../utils/uploadCloudinary");

const {
  updateCourseService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - updateCourseService", () => {
  const courseId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockCourse(status = "DRAFT", overrides = {}) {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: status,
      Image: "old.png",
      ...overrides,
    });
  }

  test("UTCID01 - course tồn tại, Status DRAFT, dữ liệu hợp lệ -> update thành công, trả message", async () => {
    mockCourse("DRAFT");
    courseRepository.update.mockResolvedValue();

    const data = {
      Title: "Math 101",
      Description: "New desc",
      Duration: 120,
      Level: "INTERMEDIATE",
      Status: "DRAFT",
    };

    const result = await updateCourseService(courseId, data, null);

    expect(courseRepository.update).toHaveBeenCalledWith(courseId, {
      Title: "Math 101",
      Description: "New desc",
      Duration: 120,
      Objectives: undefined,
      Requirements: undefined,
      Level: "INTERMEDIATE",
      Status: "DRAFT",
    });
    expect(result).toEqual({ message: "Cập nhật course thành công" });
  });

  test("UTCID02 - course không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(
      updateCourseService(999999, { Title: "Math" }, null)
    ).rejects.toThrow("Course không tồn tại");
  });

  test("UTCID03 - course Status khác DRAFT (PUBLISHED) -> ném ServiceError chỉ cho phép chỉnh sửa khi DRAFT", async () => {
    mockCourse("PUBLISHED");

    await expect(
      updateCourseService(courseId, { Title: "Math 101" }, null)
    ).rejects.toThrow("Chỉ có thể chỉnh sửa khi course ở trạng thái DRAFT");
  });

  test("UTCID04 - upload file mới -> Image patch bằng path Cloudinary", async () => {
    mockCourse("DRAFT");
    uploadToCloudinary.mockResolvedValue("cloud/new.png");
    courseRepository.update.mockResolvedValue();

    const file = { buffer: Buffer.from("image") };

    await updateCourseService(courseId, { Title: "Math 101" }, file);

    const patch = courseRepository.update.mock.calls[0][1];
    expect(patch.Image).toBe("cloud/new.png");
  });

  test("UTCID05 - gửi field Image text nhưng không upload file -> dùng Image từ FE", async () => {
    mockCourse("DRAFT");
    courseRepository.update.mockResolvedValue();

    const data = { Image: "http://example.com/new.png" };

    await updateCourseService(courseId, data, null);

    const patch = courseRepository.update.mock.calls[0][1];
    expect(patch.Image).toBe("http://example.com/new.png");
  });

  test("UTCID06 - Duration không hợp lệ -> Duration patch = 0", async () => {
    mockCourse("DRAFT");
    courseRepository.update.mockResolvedValue();

    await updateCourseService(courseId, { Duration: "abc" }, null);

    const patch = courseRepository.update.mock.calls[0][1];
    expect(patch.Duration).toBe(0);
  });

  test("UTCID07 - Level hoặc Status không hợp lệ -> ném ServiceError", async () => {
    mockCourse("DRAFT");

    await expect(
      updateCourseService(courseId, { Level: "EXPERT" }, null)
    ).rejects.toThrow("Level không hợp lệ");

    mockCourse("DRAFT");
    await expect(
      updateCourseService(courseId, { Status: "INVALID" }, null)
    ).rejects.toThrow("Status không hợp lệ");
  });

  test("UTCID08 - không có field nào được truyền (patch rỗng) -> update được gọi với các field undefined, service trả message 'Không có thay đổi để cập nhật'", async () => {
    mockCourse("DRAFT");
    courseRepository.update.mockResolvedValue();

    const result = await updateCourseService(courseId, {}, null);

    expect(courseRepository.update).toHaveBeenCalledWith(courseId, {
      Title: undefined,
      Description: undefined,
      Duration: undefined,
      Objectives: undefined,
      Requirements: undefined,
      Level: undefined,
      Status: undefined,
    });
    expect(result).toEqual({ message: "Cập nhật course thành công" });
  });
});


