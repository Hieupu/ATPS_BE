jest.mock("../repositories/instructorCourseRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorUnitRepository", () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({}));
jest.mock("../repositories/InstructorMaterialRepository", () => ({}));

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");

const { updateUnitService } = require("../services/instructorCourseService");

describe("instructorCourseService - updateUnitService", () => {
  const unitId = 4;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockUnit(status = "VISIBLE", courseStatus = "DRAFT") {
    unitRepository.findById.mockResolvedValue({
      UnitID: unitId,
      Title: "Old unit",
      Description: "Old desc",
      Duration: 1,
      Status: status,
      OrderIndex: 0,
      CourseID: 1,
    });
    courseRepository.findById.mockResolvedValue({
      CourseID: 1,
      Status: courseStatus,
    });
  }

  test("UTCID01 - unit tồn tại, course DRAFT, patch hợp lệ -> update thành công, trả message", async () => {
    mockUnit("VISIBLE", "DRAFT");
    unitRepository.update.mockResolvedValue();

    const data = {
      Title: "New",
      Description: "New desc",
      Duration: 2,
      Status: "VISIBLE",
      OrderIndex: 1,
    };

    const result = await updateUnitService(unitId, data);

    expect(unitRepository.update).toHaveBeenCalledWith(unitId, {
      Title: "New",
      Description: "New desc",
      Duration: 2,
      Status: "VISIBLE",
      OrderIndex: 1,
    });
    expect(result).toEqual({ message: "Cập nhật Unit thành công" });
  });

  test("UTCID02 - unitId không tồn tại -> ném ServiceError 'Unit không tồn tại'", async () => {
    unitRepository.findById.mockResolvedValue(null);

    await expect(updateUnitService(999999, { Title: "New" })).rejects.toThrow(
      "Unit không tồn tại"
    );
  });

  test("UTCID03 - course của unit không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    unitRepository.findById.mockResolvedValue({
      UnitID: unitId,
      CourseID: 3,
    });
    courseRepository.findById.mockResolvedValue(null);

    await expect(updateUnitService(unitId, { Title: "New" })).rejects.toThrow(
      "Course không tồn tại"
    );
  });

  test("UTCID04 - course Status khác DRAFT -> Không cho phép sửa thông tin (Title,...) mà trả về thông báo không thay đổi", async () => {
    mockUnit("VISIBLE", "PUBLISHED");

    const result = await updateUnitService(unitId, { Title: "New Title" });

    expect(unitRepository.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: "Không có thay đổi hợp lệ được cập nhật (Do Course đã Public)",
    });
  });

  test("UTCID05 - patch rỗng (không field hợp lệ) -> trả message tương ứng", async () => {
    mockUnit("VISIBLE", "DRAFT");

    const result = await updateUnitService(unitId, {});

    expect(unitRepository.update).not.toHaveBeenCalled();

    expect(result).toEqual({
      message: "Không có thay đổi hợp lệ được cập nhật (Do Course đã Public)",
    });
  });

  test("UTCID06 - Duration không hợp lệ, Status không hợp lệ -> ném ServiceError tương ứng", async () => {
    mockUnit("VISIBLE", "DRAFT");

    await expect(
      updateUnitService(unitId, { Duration: "abc" })
    ).resolves.toEqual({ message: "Cập nhật Unit thành công" });

    const patch = unitRepository.update.mock.calls[0][1];
    expect(patch.Duration).toBe(0);

    mockUnit("VISIBLE", "DRAFT");
    unitRepository.update.mockClear();

    await expect(
      updateUnitService(unitId, { Status: "INVALID" })
    ).rejects.toThrow("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)");
  });
});
