jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({
  update: jest.fn(),
}));

jest.mock("../utils/uploadCloudinary", () => jest.fn());

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const lessonRepository = require("../repositories/instructorLessonRepository");
const uploadToCloudinary = require("../utils/uploadCloudinary");

const { updateLessonService } = require("../services/instructorCourseService");

describe("instructorCourseService - updateLessonService", () => {
  const lessonId = 1;
  const unitId = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockUnitAndCourse(status = "DRAFT") {
    unitRepository.findById.mockResolvedValue({
      UnitID: unitId,
      CourseID: 5,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 5,
      Status: status,
    });
  }

  test("UTCID01 - course Status PUBLISHED -> ném ServiceError 'Không thể sửa Lesson khi course không ở trạng thái DRAFT'", async () => {
    mockUnitAndCourse("PUBLISHED");

    const data = {
      Title: "New",
    };

    await expect(
      updateLessonService(lessonId, unitId, data, null)
    ).rejects.toThrow("Không thể sửa Lesson khi course không ở trạng thái DRAFT");
    expect(lessonRepository.update).not.toHaveBeenCalled();
  });

  test("UTCID02 - unitId không tồn tại -> ném ServiceError 'Unit không tồn tại'", async () => {
    unitRepository.findById.mockResolvedValue(null);

    const data = {
      Title: "New",
    };

    await expect(
      updateLessonService(lessonId, unitId, data, null)
    ).rejects.toThrow("Unit không tồn tại");
    expect(lessonRepository.update).not.toHaveBeenCalled();
  });

  test("UTCID03 - Type không hợp lệ -> ném ServiceError 'Type không hợp lệ (video|document|audio)'", async () => {
    mockUnitAndCourse("DRAFT");

    const data = {
      Type: "something",
    };

    await expect(
      updateLessonService(lessonId, unitId, data, null)
    ).rejects.toThrow("Type không hợp lệ (video|document|audio)");
    expect(lessonRepository.update).not.toHaveBeenCalled();
  });

  test("UTCID04 - Status không hợp lệ -> ném ServiceError 'Status không hợp lệ (VISIBLE|HIDDEN|DELETED)'", async () => {
    mockUnitAndCourse("DRAFT");

    const data = {
      Status: "xxx",
    };

    await expect(
      updateLessonService(lessonId, unitId, data, null)
    ).rejects.toThrow("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)");
    expect(lessonRepository.update).not.toHaveBeenCalled();
  });

  test("UTCID05 - dữ liệu hợp lệ (Title, Type, Status VISIBLE) -> update thành công, trả message 'Đã cập nhật lesson'", async () => {
    mockUnitAndCourse("DRAFT");
    lessonRepository.update.mockResolvedValue();

    const data = {
      Title: "New",
      Type: "video",
      Status: "VISIBLE",
      Duration: 1.5,
      OrderIndex: 3,
    };

    const result = await updateLessonService(lessonId, unitId, data, null);

    expect(lessonRepository.update).toHaveBeenCalledWith(lessonId, unitId, {
      Title: "New",
      Duration: 1.5,
      Type: "video",
      FileURL: undefined,
      OrderIndex: 3,
      Status: "VISIBLE",
    });
    expect(result).toEqual({ message: "Đã cập nhật lesson" });
  });

  test("UTCID06 - có file upload -> FileURL lấy từ Cloudinary, trả message 'Đã cập nhật lesson'", async () => {
    mockUnitAndCourse("DRAFT");
    lessonRepository.update.mockResolvedValue();
    uploadToCloudinary.mockResolvedValue("cloud/lesson/new-file.mp4");

    const data = {
      Title: "A",
    };
    const file = { buffer: Buffer.from("file") };

    const result = await updateLessonService(lessonId, unitId, data, file);

    expect(uploadToCloudinary).toHaveBeenCalledWith(file.buffer, "lessons");
    expect(lessonRepository.update).toHaveBeenCalledWith(lessonId, unitId, {
      Title: "A",
      Duration: undefined,
      Type: undefined,
      FileURL: "cloud/lesson/new-file.mp4",
      OrderIndex: undefined,
      Status: undefined,
    });
    expect(result).toEqual({ message: "Đã cập nhật lesson" });
  });

  test("UTCID07 - không có field nào để cập nhật, không file -> trả message 'Không có thay đổi để cập nhật', không gọi update", async () => {
    mockUnitAndCourse("DRAFT");

    const data = {};

    const result = await updateLessonService(lessonId, unitId, data, null);

    expect(lessonRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Không có thay đổi để cập nhật" });
  });
});


