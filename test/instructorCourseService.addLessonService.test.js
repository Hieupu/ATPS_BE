jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({
  create: jest.fn(),
}));

jest.mock("../utils/uploadCloudinary", () => jest.fn());

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const lessonRepository = require("../repositories/instructorLessonRepository");
const uploadToCloudinary = require("../utils/uploadCloudinary");

const { addLessonService } = require("../services/instructorCourseService");

describe("instructorCourseService - addLessonService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - course Status PUBLISHED -> ném ServiceError 'Không thể thêm Lesson khi course không ở trạng thái DRAFT'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 1,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "PUBLISHED",
    });

    const data = {
      Title: "Lesson 1",
      Status: "VISIBLE",
    };

    await expect(addLessonService(1, data, null)).rejects.toThrow(
      "Không thể thêm Lesson khi course không ở trạng thái DRAFT"
    );
    expect(lessonRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID02 - course của unit không tồn tại -> ném ServiceError", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 1,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue(null);

    const data = {
      Title: "Lesson 1",
      Status: "DRAFT",
    };

    await expect(addLessonService(1, data, null)).rejects.toThrow();
    expect(lessonRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID03 - Title rỗng hoặc không có -> ném ServiceError 'Title là bắt buộc'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 5,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });

    const data = {
      Title: "",
      Status: "DRAFT",
    };

    await expect(addLessonService(5, data, null)).rejects.toThrow(
      "Title là bắt buộc"
    );
    expect(lessonRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID04 - Type không hợp lệ -> ném ServiceError 'Type không hợp lệ (video|document|audio)'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 5,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });

    const data = {
      Title: "Test",
      Type: "aa",
      Status: "DRAFT",
    };

    await expect(addLessonService(5, data, null)).rejects.toThrow(
      "Type không hợp lệ (video|document|audio)"
    );
    expect(lessonRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID05 - dữ liệu hợp lệ, có file upload -> Repository receives payload with FileURL", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 5,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });
    uploadToCloudinary.mockResolvedValue("cloud/lesson/file.mp4");
    lessonRepository.create.mockResolvedValue({
      LessonID: 10,
      Title: "Test",
      FileURL: "cloud/lesson/file.mp4",
    });

    const data = {
      Title: "Test",
    };
    const file = { buffer: Buffer.from("fake file") };

    const result = await addLessonService(5, data, file);

    expect(uploadToCloudinary).toHaveBeenCalledWith(file.buffer, "lessons");
    expect(lessonRepository.create).toHaveBeenCalledWith(5, {
      Title: "Test",
      Duration: 0,
      Type: "video",
      FileURL: "cloud/lesson/file.mp4",
      OrderIndex: 0,
      Status: "VISIBLE",
    });
    expect(result).toEqual({
      LessonID: 10,
      Title: "Test",
      FileURL: "cloud/lesson/file.mp4",
    });
  });

  test("UTCID06 - Status không hợp lệ -> ném ServiceError 'Status không hợp lệ (VISIBLE|HIDDEN|DELETED)'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: 5,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });

    const data = {
      Title: "Test",
      Status: "invalid",
    };

    await expect(addLessonService(5, data, null)).rejects.toThrow(
      "Status không hợp lệ (VISIBLE|HIDDEN|DELETED)"
    );
    expect(lessonRepository.create).not.toHaveBeenCalled();
  });
});

