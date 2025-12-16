jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
  listByInstructor: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  markAsDeleted: jest.fn(),
  updateStatus: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  listByCourse: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({
  listByUnit: jest.fn(),
}));

jest.mock("../repositories/InstructorMaterialRepository", () => ({
  listByCourse: jest.fn(),
}));

jest.mock("../utils/uploadCloudinary", () => jest.fn());

const courseRepository = require("../repositories/instructorCourseRepository");
const uploadToCloudinary = require("../utils/uploadCloudinary");

const {
  createCourseService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - createCourseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - dữ liệu hợp lệ, không upload file -> tạo course với payload đúng, Duration được convert, Image là chuỗi rỗng", async () => {
    courseRepository.create.mockResolvedValue({ CourseID: 1 });

    const data = {
      InstructorID: 1,
      Title: "Math",
      Description: "Desc",
      Duration: "1.234",
      Objectives: "Obj",
      Requirements: "Req",
      Level: "BEGINNER",
      Status: "DRAFT",
      Code: "MATH-0001",
      Image: "",
    };

    const result = await createCourseService(data, null);

    expect(courseRepository.create).toHaveBeenCalledTimes(1);
    const payload = courseRepository.create.mock.calls[0][0];
    expect(payload).toMatchObject({
      InstructorID: 1,
      Title: "Math",
      Description: "Desc",
      Duration: 1.23,
      Objectives: "Obj",
      Requirements: "Req",
      Level: "BEGINNER",
      Status: "DRAFT",
      Code: "MATH-0001",
      Image: "",
    });
    expect(result).toEqual({ CourseID: 1 });
  });

  test("UTCID02 - có file upload -> Image lấy path từ Cloudinary", async () => {
    courseRepository.create.mockResolvedValue({ CourseID: 2 });
    uploadToCloudinary.mockResolvedValue("cloud/path/course.png");

    const data = {
      InstructorID: 1,
      Title: "Physics",
      Level: "BEGINNER",
      Status: "DRAFT",
    };

    const file = { buffer: Buffer.from("image") };

    const result = await createCourseService(data, file);

    expect(uploadToCloudinary).toHaveBeenCalled();
    const payload = courseRepository.create.mock.calls[0][0];
    expect(payload.Image).toBe("cloud/path/course.png");
    expect(result).toEqual({ CourseID: 2 });
  });

  test("UTCID03 - thiếu InstructorID hoặc Title -> ném ServiceError 'InstructorID và Title là bắt buộc'", async () => {
    await expect(
      createCourseService(
        {
          InstructorID: null,
          Title: "Math",
        },
        null
      )
    ).rejects.toThrow("InstructorID và Title là bắt buộc");

    await expect(
      createCourseService(
        {
          InstructorID: 1,
          Title: "",
        },
        null
      )
    ).rejects.toThrow("InstructorID và Title là bắt buộc");
  });

  test("UTCID04 - Level không hợp lệ -> ném ServiceError 'Level không hợp lệ'", async () => {
    await expect(
      createCourseService(
        {
          InstructorID: 1,
          Title: "Math",
          Level: "EXPERT",
        },
        null
      )
    ).rejects.toThrow("Level không hợp lệ");
  });

  test("UTCID05 - Status không hợp lệ -> ném ServiceError 'Status không hợp lệ'", async () => {
    await expect(
      createCourseService(
        {
          InstructorID: 1,
          Title: "Math",
          Status: "INVALID",
        },
        null
      )
    ).rejects.toThrow("Status không hợp lệ");
  });

  test("UTCID06 - Duration không hợp lệ -> Duration = 0 vẫn tạo được course", async () => {
    courseRepository.create.mockResolvedValue({ CourseID: 3 });

    const data = {
      InstructorID: 1,
      Title: "Math",
      Duration: "abc",
      Level: "BEGINNER",
      Status: "DRAFT",
    };

    await createCourseService(data, null);

    const payload = courseRepository.create.mock.calls[0][0];
    expect(payload.Duration).toBe(0);
  });

  test("UTCID07 - repository.create ném lỗi -> propagate lỗi", async () => {
    courseRepository.create.mockRejectedValue(new Error("DB error"));

    await expect(
      createCourseService(
        {
          InstructorID: 1,
          Title: "Math",
          Level: "BEGINNER",
          Status: "DRAFT",
        },
        null
      )
    ).rejects.toThrow("DB error");
  });
});


