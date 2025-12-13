jest.mock("../repositories/progressRepository", () => ({
  getCourseDetailProgress: jest.fn(),
}));

const progressRepository = require("../repositories/progressRepository");
const ProgressService = require("../services/progressService");

describe("progressService - getCourseDetailProgress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - learnerId = 1, repo trả data hợp lệ -> service format và trả đúng data", async () => {
    progressRepository.getCourseDetailProgress.mockResolvedValue([
      {
        UnitID: 1,
        UnitTitle: "Unit 1",
        UnitDescription: "Description",
        UnitOrder: 1,
        UnitDuration: 10,
        UnitProgress: 50,
        IsCompleted: false,
        TotalLessons: 5,
        TotalLessonHours: 10,
        TotalAssignments: 3,
        CompletedAssignments: 1,
        AvgUnitScore: 8.5,
      },
      {
        UnitID: 2,
        UnitTitle: "Unit 2",
        UnitDescription: "Description 2",
        UnitOrder: 2,
        UnitDuration: 15,
        UnitProgress: 100,
        IsCompleted: true,
        TotalLessons: 6,
        TotalLessonHours: 12,
        TotalAssignments: 4,
        CompletedAssignments: 4,
        AvgUnitScore: 9.0,
      },
    ]);

    const result = await ProgressService.getCourseDetailProgress(1, 10);

    expect(progressRepository.getCourseDetailProgress).toHaveBeenCalledWith(1, 10);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      unitId: 1,
      title: "Unit 1",
      description: "Description",
      order: 1,
      duration: 10,
      progress: 50,
      isCompleted: false,
      stats: {
        totalLessons: 5,
        totalLessonHours: 10,
        totalAssignments: 3,
        completedAssignments: 1,
        avgScore: 8.5,
      },
    });
    expect(result[1]).toEqual({
      unitId: 2,
      title: "Unit 2",
      description: "Description 2",
      order: 2,
      duration: 15,
      progress: 100,
      isCompleted: true,
      stats: {
        totalLessons: 6,
        totalLessonHours: 12,
        totalAssignments: 4,
        completedAssignments: 4,
        avgScore: 9.0,
      },
    });
  });

  test("UTCID02 - learnerId = 2, repo ném lỗi -> service log error và ném lại", async () => {
    progressRepository.getCourseDetailProgress.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      ProgressService.getCourseDetailProgress(2, 10)
    ).rejects.toThrow("DB error");
    expect(progressRepository.getCourseDetailProgress).toHaveBeenCalledWith(2, 10);
  });
});

