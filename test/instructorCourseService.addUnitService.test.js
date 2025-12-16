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
  create: jest.fn(),
  update: jest.fn(),
  markAsDeleted: jest.fn(),
  getAssignmentsByUnitId: jest.fn(),
}));

jest.mock("../repositories/instructorLessonRepository", () => ({}));
jest.mock("../repositories/InstructorMaterialRepository", () => ({}));

const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");

const { addUnitService } = require("../services/instructorCourseService");

describe("instructorCourseService - addUnitService", () => {
  const courseId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockCourse(status = "DRAFT") {
    courseRepository.findById.mockResolvedValue({
      CourseID: courseId,
      Status: status,
    });
  }

  test("UTCID01 - course DRAFT, Title hợp lệ, Duration hợp lệ, Status hợp lệ -> tạo Unit với payload đúng", async () => {
    mockCourse("DRAFT");
    unitRepository.create.mockResolvedValue({ UnitID: 10 });

    const data = {
      Title: "Unit 1",
      Description: "Desc",
      Duration: 1.5,
      Status: "VISIBLE",
      OrderIndex: 2,
    };

    const result = await addUnitService(courseId, data);

    expect(unitRepository.create).toHaveBeenCalledWith(courseId, {
      Title: "Unit 1",
      Description: "Desc",
      Duration: 1.5,
      Status: "VISIBLE",
      OrderIndex: 2,
    });
    expect(result).toEqual({ UnitID: 10 });
  });

  test("UTCID02 - courseId không tồn tại -> ném ServiceError 'Course không tồn tại'", async () => {
    courseRepository.findById.mockResolvedValue(null);

    await expect(addUnitService(9999999, { Title: "Unit 1" })).rejects.toThrow(
      "Course không tồn tại"
    );
  });

  test("UTCID03 - course không ở trạng thái DRAFT -> ném ServiceError 'Chỉ có thể thêm Unit khi Course ở trạng thái DRAFT'", async () => {
    mockCourse("PUBLISHED");

    await expect(addUnitService(courseId, { Title: "Unit 1" })).rejects.toThrow(
      "Chỉ có thể thêm Unit khi Course ở trạng thái DRAFT"
    );
  });

  test("UTCID04 - Title rỗng hoặc null -> ném ServiceError 'Title là bắt buộc'", async () => {
    mockCourse("DRAFT");

    await expect(addUnitService(courseId, { Title: "   " })).rejects.toThrow(
      "Title là bắt buộc"
    );

    mockCourse("DRAFT");
    await expect(addUnitService(courseId, { Title: null })).rejects.toThrow(
      "Title là bắt buộc"
    );
  });

  test("UTCID05 - Duration không hợp lệ -> Duration = 0 trong payload", async () => {
    mockCourse("DRAFT");
    unitRepository.create.mockResolvedValue({ UnitID: 11 });

    await addUnitService(courseId, {
      Title: "Unit 1",
      Duration: "abc",
    });

    const payload = unitRepository.create.mock.calls[0][1];
    expect(payload.Duration).toBe(0);
  });

  test("UTCID06 - không truyền Status -> mặc định 'VISIBLE'", async () => {
    mockCourse("DRAFT");
    unitRepository.create.mockResolvedValue({ UnitID: 12 });

    await addUnitService(courseId, { Title: "Unit 1" });

    const payload = unitRepository.create.mock.calls[0][1];
    expect(payload.Status).toBe("VISIBLE");
  });

  test("UTCID07 - Status không hợp lệ -> ném ServiceError 'Status không hợp lệ (VISIBLE|HIDDEN|DELETED)'", async () => {
    mockCourse("DRAFT");

    await expect(
      addUnitService(courseId, { Title: "Unit 1", Status: "INVALID" })
    ).rejects.toThrow("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)");
  });

  test("UTCID08 - OrderIndex không phải số nguyên -> fallback 0", async () => {
    mockCourse("DRAFT");
    unitRepository.create.mockResolvedValue({ UnitID: 13 });

    await addUnitService(courseId, {
      Title: "Unit 1",
      OrderIndex: "5",
    });

    const payload = unitRepository.create.mock.calls[0][1];
    expect(payload.OrderIndex).toBe(0);
  });
});
