jest.mock("../repositories/instructorRepository", () => ({
  getInstructorById: jest.fn(),
  getInstructorReviews: jest.fn(),
}));

jest.mock("../repositories/courseRepository", () => ({
  getInstructorStats: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const courseRepository = require("../repositories/courseRepository");

const instructorService = require("../services/instructorService");

describe("instructorService - getInstructor", () => {
  const instructorId = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructor không tồn tại (getInstructorById trả null) -> trả null", async () => {
    instructorRepository.getInstructorById.mockResolvedValue(null);

    const result = await instructorService.getInstructor(instructorId);

    expect(instructorRepository.getInstructorById).toHaveBeenCalledWith(
      instructorId
    );
    expect(courseRepository.getInstructorStats).not.toHaveBeenCalled();
    expect(instructorRepository.getInstructorReviews).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test("UTCID02 - instructor tồn tại, stats trả về, reviews có 3 items -> merge đủ stats và reviews", async () => {
    instructorRepository.getInstructorById.mockResolvedValue({
      InstructorID: instructorId,
      Name: "A",
      Email: "a@example.com",
    });
    courseRepository.getInstructorStats.mockResolvedValue({
      TotalCourses: 5,
      TotalStudents: 50,
    });
    const reviews = [{ id: 1 }, { id: 2 }, { id: 3 }];
    instructorRepository.getInstructorReviews.mockResolvedValue(reviews);

    const result = await instructorService.getInstructor(instructorId);

    expect(courseRepository.getInstructorStats).toHaveBeenCalledWith(
      instructorId
    );
    expect(instructorRepository.getInstructorReviews).toHaveBeenCalledWith(
      instructorId,
      20
    );
    expect(result).toEqual({
      InstructorID: instructorId,
      Name: "A",
      Email: "a@example.com",
      TotalCourses: 5,
      TotalStudents: 50,
      Reviews: reviews,
    });
  });

  test("UTCID03 - instructor tồn tại, stats throw error -> TotalCourses=0, TotalStudents=0, reviews vẫn trả về", async () => {
    instructorRepository.getInstructorById.mockResolvedValue({
      InstructorID: instructorId,
      Name: "A",
    });
    courseRepository.getInstructorStats.mockRejectedValue(
      new Error("stats error")
    );
    const reviews = [{ id: 1 }];
    instructorRepository.getInstructorReviews.mockResolvedValue(reviews);

    const result = await instructorService.getInstructor(instructorId);

    expect(result).toEqual({
      InstructorID: instructorId,
      Name: "A",
      TotalCourses: 0,
      TotalStudents: 0,
      Reviews: reviews,
    });
  });

  test("UTCID04 - instructor tồn tại, stats trả về nhưng không có review (getInstructorReviews trả []) -> Reviews là []", async () => {
    instructorRepository.getInstructorById.mockResolvedValue({
      InstructorID: instructorId,
      Name: "A",
    });
    courseRepository.getInstructorStats.mockResolvedValue({
      TotalCourses: 2,
      TotalStudents: 20,
    });
    instructorRepository.getInstructorReviews.mockResolvedValue([]);

    const result = await instructorService.getInstructor(instructorId);

    expect(result).toEqual({
      InstructorID: instructorId,
      Name: "A",
      TotalCourses: 2,
      TotalStudents: 20,
      Reviews: [],
    });
  });
});


