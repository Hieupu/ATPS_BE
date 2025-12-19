jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/InstructorMaterialRepository", () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../utils/uploadCloudinary", () => jest.fn());

const courseRepository = require("../repositories/instructorCourseRepository");
const materialRepository = require("../repositories/InstructorMaterialRepository");
const uploadToCloudinary = require("../utils/uploadCloudinary");

const {
  updateMaterialService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - updateMaterialService", () => {
  const materialId = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - materialId không tồn tại -> ném ServiceError 'Material không tồn tại'", async () => {
    materialRepository.findById.mockResolvedValue(null);

    const data = {
      Title: "New Title",
    };

    await expect(updateMaterialService(materialId, data, null)).rejects.toThrow(
      "Material không tồn tại"
    );
    expect(materialRepository.update).not.toHaveBeenCalled();
  });

  test("UTCID02 - course của material không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: materialId,
      CourseID: 1,
      Title: "Doc A",
      FileURL: "old-url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue(null);

    const data = {
      Title: "New Title",
    };

    await expect(updateMaterialService(materialId, data, null)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(materialRepository.update).not.toHaveBeenCalled();
  });

  test("UTCID03 - course Status không phải DRAFT (PUBLISHED) và không gửi Status mới -> Trả về message không có thay đổi", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: materialId,
      CourseID: 1,
      Title: "Doc A",
      FileURL: "old-url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "PUBLISHED",
    });

    const data = {
      Title: "New Title",
    };

    const result = await updateMaterialService(materialId, data, null);

    expect(materialRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: "Không có thay đổi hợp lệ được cập nhật",
    });
  });

  test("UTCID04 - Status không hợp lệ -> ném ServiceError 'Status không hợp lệ (VISIBLE|HIDDEN|DELETED)'", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: materialId,
      CourseID: 1,
      Title: "Doc A",
      FileURL: "old-url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });

    const data = {
      Status: "INVALID",
    };

    await expect(updateMaterialService(materialId, data, null)).rejects.toThrow(
      "Status không hợp lệ (VISIBLE|HIDDEN|DELETED)"
    );
    expect(materialRepository.update).not.toHaveBeenCalled();
  });

  test("UTCID05 - không có field nào để cập nhật, không file -> trả message không có thay đổi và không gọi update", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: materialId,
      CourseID: 1,
      Title: "Doc A",
      FileURL: "old-url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });

    const data = {};

    const result = await updateMaterialService(materialId, data, null);

    expect(materialRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: "Không có thay đổi hợp lệ được cập nhật",
    });
  });

  test("UTCID06 - dữ liệu hợp lệ (Title, Status VISIBLE) và có file upload -> FileURL mới, gọi update và trả message 'Đã cập nhật material'", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: materialId,
      CourseID: 1,
      Title: "Doc A",
      FileURL: "old-url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "DRAFT",
    });
    uploadToCloudinary.mockResolvedValue("new-uploaded-url");
    materialRepository.update.mockResolvedValue();

    const data = {
      Title: "New Title",
      Status: "VISIBLE",
    };
    const file = { buffer: Buffer.from("file") };

    const result = await updateMaterialService(materialId, data, file);

    expect(uploadToCloudinary).toHaveBeenCalledWith(file.buffer, "materials");
    expect(materialRepository.update).toHaveBeenCalledWith(materialId, {
      Title: "New Title",
      FileURL: "new-uploaded-url",
      Status: "VISIBLE",
    });
    expect(result).toEqual({ message: "Đã cập nhật material" });
  });
});
