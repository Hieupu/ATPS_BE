jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/InstructorMaterialRepository", () => ({
  create: jest.fn(),
}));

jest.mock("../utils/uploadCloudinary", () => jest.fn());

const courseRepository = require("../repositories/instructorCourseRepository");
const materialRepository = require("../repositories/InstructorMaterialRepository");
const uploadToCloudinary = require("../utils/uploadCloudinary");

const {
  addMaterialService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - addMaterialService", () => {
  const courseId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    const data = {
      Title: "Doc A",
      Status: "DRAFT",
    };

    await expect(addMaterialService(courseId, data, null)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(materialRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID02 - course Status không phải DRAFT (PUBLISHED) -> ném ServiceError 'Không thể thêm Material khi course không ở trạng thái DRAFT'", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: "PUBLISHED",
    });

    const data = {
      Title: "Doc A",
      Status: "VISIBLE",
    };

    await expect(addMaterialService(courseId, data, null)).rejects.toThrow(
      "Không thể thêm Material khi course không ở trạng thái DRAFT"
    );
    expect(materialRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID03 - Title rỗng -> ném ServiceError 'Title là bắt buộc'", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: "DRAFT",
    });

    const data = {
      Title: "",
      Status: "VISIBLE",
    };

    await expect(addMaterialService(courseId, data, null)).rejects.toThrow(
      "Title là bắt buộc"
    );
    expect(materialRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID04 - Status không hợp lệ -> ném ServiceError 'Status không hợp lệ (VISIBLE|HIDDEN|DELETED)'", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: "DRAFT",
    });

    const data = {
      Title: "A",
      Status: "INVALID",
    };

    await expect(addMaterialService(courseId, data, null)).rejects.toThrow(
      "Status không hợp lệ (VISIBLE|HIDDEN|DELETED)"
    );
    expect(materialRepository.create).not.toHaveBeenCalled();
  });

  test("UTCID05 - dữ liệu hợp lệ, có file upload -> FileURL lấy từ Cloudinary và create được gọi với payload đúng", async () => {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: "DRAFT",
    });
    uploadToCloudinary.mockResolvedValue("uploaded-url");
    materialRepository.create.mockResolvedValue({
      MaterialID: 10,
      Title: "Doc A",
      FileURL: "uploaded-url",
      Status: "VISIBLE",
    });

    const data = {
      Title: "Doc A",
      Status: "VISIBLE",
    };
    const file = { buffer: Buffer.from("file") };

    const result = await addMaterialService(courseId, data, file);

    expect(uploadToCloudinary).toHaveBeenCalledWith(file.buffer, "materials");
    expect(materialRepository.create).toHaveBeenCalledWith(courseId, {
      Title: "Doc A",
      FileURL: "uploaded-url",
      Status: "VISIBLE",
    });
    expect(result).toEqual({
      MaterialID: 10,
      Title: "Doc A",
      FileURL: "uploaded-url",
      Status: "VISIBLE",
    });
  });
});


