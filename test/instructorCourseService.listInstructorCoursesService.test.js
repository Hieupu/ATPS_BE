jest.mock("../repositories/instructorCourseRepository", () => ({
  listByInstructor: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  markAsDeleted: jest.fn(),
  updateStatus: jest.fn(),
}));

const courseRepository = require("../repositories/instructorCourseRepository");
const {
  listInstructorCoursesService,
} = require("../services/instructorCourseService");

describe("instructorCourseService - listInstructorCoursesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId hợp lệ, repo trả list > 0 -> trả về courses", async () => {
    const courses = [{ CourseID: 1 }, { CourseID: 2 }];
    courseRepository.listByInstructor.mockResolvedValue(courses);

    const result = await listInstructorCoursesService(1);

    expect(courseRepository.listByInstructor).toHaveBeenCalledWith(1);
    expect(result).toBe(courses);
  });

  test("UTCID02 - repo trả [] -> ném ServiceError 'Không tìm thấy khóa học nào'", async () => {
    courseRepository.listByInstructor.mockResolvedValue([]);

    await expect(listInstructorCoursesService(2)).rejects.toThrow(
      "Không tìm thấy khóa học nào"
    );
  });

  test("UTCID03 - repo trả null -> ném ServiceError 'Không tìm thấy khóa học nào'", async () => {
    courseRepository.listByInstructor.mockResolvedValue(null);

    await expect(listInstructorCoursesService(null)).rejects.toThrow(
      "Không tìm thấy khóa học nào"
    );
  });
});


