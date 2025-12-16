jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/InstructorMaterialRepository", () => ({
  findById: jest.fn(),
  markAsDeleted: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");
const materialRepository = require("../repositories/InstructorMaterialRepository");

const {
  deleteMaterialService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - deleteMaterialService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - materialId không tồn tại -> ném ServiceError 'Material không tồn tại'", async () => {
    materialRepository.findById.mockResolvedValue(null);

    await expect(deleteMaterialService(10)).rejects.toThrow(
      "Material không tồn tại"
    );
    expect(courseRepository.findById).not.toHaveBeenCalled();
    expect(materialRepository.markAsDeleted).not.toHaveBeenCalled();
  });

  test("UTCID02 - course của material không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: 5,
      CourseID: 1,
      Title: "Doc A",
      FileURL: "url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue(null);

    await expect(deleteMaterialService(5)).rejects.toThrow(
      "Course không tồn tại"
    );
    expect(materialRepository.markAsDeleted).not.toHaveBeenCalled();
  });

  test("UTCID03 - course Status PUBLISHED -> ném ServiceError 'Không thể xóa Material khi course không ở trạng thái DRAFT'", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: 7,
      CourseID: 1,
      Title: "Doc A",
      FileURL: "url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: "PUBLISHED",
    });

    await expect(deleteMaterialService(7)).rejects.toThrow(
      "Không thể xóa Material khi course không ở trạng thái DRAFT"
    );
    expect(materialRepository.markAsDeleted).not.toHaveBeenCalled();
  });

  test("UTCID04 - course Status DRAFT -> markAsDeleted được gọi và trả message 'Đã chuyển material sang trạng thái DELETED'", async () => {
    materialRepository.findById.mockResolvedValue({
      MaterialID: 10,
      CourseID: 3,
      Title: "Doc A",
      FileURL: "url",
      Status: "VISIBLE",
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 3,
      Status: "DRAFT",
    });
    materialRepository.markAsDeleted.mockResolvedValue();

    const result = await deleteMaterialService(10);

    expect(materialRepository.markAsDeleted).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      message: "Đã chuyển material sang trạng thái DELETED",
    });
  });
});


