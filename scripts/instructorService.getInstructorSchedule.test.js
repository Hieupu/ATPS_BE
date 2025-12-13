jest.mock("../repositories/instructorRepository", () => ({
  findById: jest.fn(),
  getSchedule: jest.fn(),
}));

const instructorRepository = require("../repositories/instructorRepository");
const instructorService = require("../services/instructorService");

describe("instructorService.getInstructorSchedule", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const instructorId = 100;
  const startDate = "2025-01-01";
  const endDate = "2025-01-31";

  test("returns schedule when instructor exists with dates", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      FullName: "Instructor A",
      Type: "fulltime",
    };
    const mockSchedule = [
      {
        SessionID: 1,
        Date: "2025-01-05",
        TimeslotID: 10,
        Title: "Session 1",
      },
      {
        SessionID: 2,
        Date: "2025-01-07",
        TimeslotID: 11,
        Title: "Session 2",
      },
    ];

    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.getSchedule.mockResolvedValue(mockSchedule);

    const result = await instructorService.getInstructorSchedule(
      instructorId,
      startDate,
      endDate
    );

    expect(instructorRepository.findById).toHaveBeenCalledWith(instructorId);
    expect(instructorRepository.getSchedule).toHaveBeenCalledWith(
      instructorId,
      startDate,
      endDate,
      "fulltime"
    );
    expect(result).toHaveProperty("schedule");
    expect(result).toHaveProperty("instructorType");
    expect(result).toHaveProperty("instructor");
    expect(result.schedule).toEqual(mockSchedule);
    expect(result.instructorType).toBe("fulltime");
    expect(result.instructor.id).toBe(instructorId);
    expect(result.instructor.name).toBe("Instructor A");
    expect(result.instructor.type).toBe("fulltime");
  });

  test("returns schedule when instructor exists without dates", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      FullName: "Instructor A",
      Type: "parttime",
    };
    const mockSchedule = [];

    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.getSchedule.mockResolvedValue(mockSchedule);

    const result = await instructorService.getInstructorSchedule(instructorId);

    expect(instructorRepository.findById).toHaveBeenCalledWith(instructorId);
    expect(instructorRepository.getSchedule).toHaveBeenCalledWith(
      instructorId,
      null,
      null,
      "parttime"
    );
    expect(result.schedule).toEqual(mockSchedule);
    expect(result.instructorType).toBe("parttime");
  });

  test("defaults to parttime when Type is missing", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      FullName: "Instructor A",
    };
    const mockSchedule = [];

    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.getSchedule.mockResolvedValue(mockSchedule);

    const result = await instructorService.getInstructorSchedule(instructorId);

    expect(instructorRepository.getSchedule).toHaveBeenCalledWith(
      instructorId,
      null,
      null,
      "parttime"
    );
    expect(result.instructorType).toBe("parttime");
  });

  test("throws ServiceError 404 when instructor not found", async () => {
    instructorRepository.findById.mockResolvedValue(null);

    await expect(
      instructorService.getInstructorSchedule(instructorId, startDate, endDate)
    ).rejects.toMatchObject({
      message: "Giảng viên không tồn tại",
      status: 404,
    });
  });

  test("propagates repository errors from findById", async () => {
    const repoError = new Error("Database error");
    instructorRepository.findById.mockRejectedValue(repoError);

    await expect(
      instructorService.getInstructorSchedule(instructorId, startDate, endDate)
    ).rejects.toThrow("Database error");
  });

  test("propagates repository errors from getSchedule", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      FullName: "Instructor A",
      Type: "fulltime",
    };
    const repoError = new Error("Schedule query failed");
    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.getSchedule.mockRejectedValue(repoError);

    await expect(
      instructorService.getInstructorSchedule(instructorId, startDate, endDate)
    ).rejects.toThrow("Schedule query failed");
  });

  test("handles repository errors with status code", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      FullName: "Instructor A",
      Type: "fulltime",
    };
    const err = new Error("Permission denied");
    err.status = 403;
    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.getSchedule.mockRejectedValue(err);

    await expect(
      instructorService.getInstructorSchedule(instructorId, startDate, endDate)
    ).rejects.toMatchObject({
      message: "Permission denied",
      status: 403,
    });
  });

  test("handles invalid instructorId (null)", async () => {
    await expect(
      instructorService.getInstructorSchedule(null, startDate, endDate)
    ).rejects.toThrow();
  });

  test("handles invalid instructorId (0)", async () => {
    instructorRepository.findById.mockResolvedValue(null);

    await expect(
      instructorService.getInstructorSchedule(0, startDate, endDate)
    ).rejects.toThrow("Giảng viên không tồn tại");
  });

  test("handles only startDate provided", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      FullName: "Instructor A",
      Type: "fulltime",
    };
    const mockSchedule = [];

    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.getSchedule.mockResolvedValue(mockSchedule);

    const result = await instructorService.getInstructorSchedule(
      instructorId,
      startDate
    );

    expect(instructorRepository.getSchedule).toHaveBeenCalledWith(
      instructorId,
      startDate,
      null,
      "fulltime"
    );
    expect(result.schedule).toEqual(mockSchedule);
  });

  test("handles only endDate provided (startDate null)", async () => {
    const existingInstructor = {
      InstructorID: instructorId,
      FullName: "Instructor A",
      Type: "fulltime",
    };
    const mockSchedule = [];

    instructorRepository.findById.mockResolvedValue(existingInstructor);
    instructorRepository.getSchedule.mockResolvedValue(mockSchedule);

    const result = await instructorService.getInstructorSchedule(
      instructorId,
      null,
      endDate
    );

    expect(instructorRepository.getSchedule).toHaveBeenCalledWith(
      instructorId,
      null,
      endDate,
      "fulltime"
    );
    expect(result.schedule).toEqual(mockSchedule);
  });
});

