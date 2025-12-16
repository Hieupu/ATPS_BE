jest.mock("../repositories/progressRepository", () => ({
  getLearnerProgress: jest.fn(),
}));

const progressRepository = require("../repositories/progressRepository");
const ProgressService = require("../services/progressService");

describe("progressService - getLearnerProgress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - learnerId = 1, courseId = null, có classes -> trả đúng data của learner đã format", async () => {
    progressRepository.getLearnerProgress.mockResolvedValue([
      {
        EnrollmentIDs: "1,2",
        CourseID: 10,
        ClassIDs: "20,21",
        ClassNames: "TOEIC A1 | TOEIC A2",
        EnrollmentStatuses: "active|completed",
        ClassesDetailJSON: JSON.stringify([
          {
            ClassID: 20,
            ClassName: "TOEIC A1",
            EnrollmentStatus: "active",
            ClassProgress: 50,
            AttendanceRate: 80,
            AvgScore: 8.5,
            TotalAssignments: 10,
            CompletedAssignments: 5,
            TotalSessions: 20,
            AttendedSessions: 16,
            AbsentSessions: 4,
            TotalStudyMinutes: 1200,
            EnrollmentDate: "2024-01-01",
            ClassStart: "2024-01-15",
            ClassEnd: "2024-06-15",
          },
        ]),
        TotalEnrolledClasses: 2,
        CourseTitle: "TOEIC",
        CourseDescription: "Desc",
        CourseImage: "img.jpg",
        CourseDuration: 100,
        CourseLevel: "BEGINNER",
        InstructorID: 5,
        InstructorName: "John",
        InstructorAvatar: "avatar.jpg",
        ProgressPercentage: 50,
        CompletionRate: {
          lessons: 50,
          assignments: 50,
          exams: 50,
        },
        AttendanceRate: 80,
        TotalUnits: 5,
        TotalLessons: 20,
        TotalLessonHours: 50,
        TotalAssignments: 10,
        CompletedAssignments: 5,
        RemainingAssignments: 5,
        TotalExams: 5,
        CompletedExams: 2,
        RemainingExams: 3,
        TotalSessions: 20,
        AttendedSessions: 16,
        AbsentSessions: 4,
        TotalStudyHours: 20,
        AvgScore: 8.5,
        AvgAssignmentScore: 8.0,
        AvgExamScore: 9.0,
        IsCompleted: false,
        FirstEnrollmentDate: "2024-01-01",
        LatestEnrollmentDate: "2024-02-01",
        EarliestClassStart: "2024-01-15",
        LatestClassEnd: "2024-06-15",
        TotalClassFees: 1000000,
        TotalPaidAmount: 1000000,
        FirstPaymentDate: "2024-01-01",
      },
    ]);

    const result = await ProgressService.getLearnerProgress(1, null);

    expect(progressRepository.getLearnerProgress).toHaveBeenCalledWith(1, null);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("enrollmentIds");
    expect(result[0]).toHaveProperty("courseId", 10);
    expect(result[0]).toHaveProperty("classIds");
    expect(result[0]).toHaveProperty("course");
    expect(result[0]).toHaveProperty("classes");
    expect(result[0]).toHaveProperty("classesDetail");
    expect(result[0]).toHaveProperty("instructor");
    expect(result[0]).toHaveProperty("progress");
    expect(result[0]).toHaveProperty("stats");
    expect(result[0]).toHaveProperty("status");
    expect(result[0]).toHaveProperty("dates");
    expect(result[0]).toHaveProperty("payment");
  });

  test("UTCID02 - learnerId = 1, có classes -> trả tất cả elements, mỗi element được parse đầy đủ", async () => {
    progressRepository.getLearnerProgress.mockResolvedValue([
      {
        EnrollmentIDs: "1",
        CourseID: 10,
        ClassIDs: "20",
        ClassNames: "TOEIC A1",
        EnrollmentStatuses: "active",
        ClassesDetailJSON: JSON.stringify([
          {
            ClassID: 20,
            ClassName: "TOEIC A1",
            EnrollmentStatus: "active",
            ClassProgress: 75,
            AttendanceRate: 90,
            AvgScore: 9.0,
            TotalAssignments: 10,
            CompletedAssignments: 8,
            TotalSessions: 20,
            AttendedSessions: 18,
            AbsentSessions: 2,
            TotalStudyMinutes: 1500,
            EnrollmentDate: "2024-01-01",
            ClassStart: "2024-01-15",
            ClassEnd: "2024-06-15",
          },
        ]),
        TotalEnrolledClasses: 1,
        CourseTitle: "TOEIC",
        CourseDescription: "Desc",
        CourseImage: "img.jpg",
        CourseDuration: 100,
        CourseLevel: "BEGINNER",
        InstructorID: 5,
        InstructorName: "John",
        InstructorAvatar: "avatar.jpg",
        ProgressPercentage: 75,
        CompletionRate: {
          lessons: 75,
          assignments: 80,
          exams: 70,
        },
        AttendanceRate: 90,
        TotalUnits: 5,
        TotalLessons: 20,
        TotalLessonHours: 50,
        TotalAssignments: 10,
        CompletedAssignments: 8,
        RemainingAssignments: 2,
        TotalExams: 5,
        CompletedExams: 3,
        RemainingExams: 2,
        TotalSessions: 20,
        AttendedSessions: 18,
        AbsentSessions: 2,
        TotalStudyHours: 25,
        AvgScore: 9.0,
        AvgAssignmentScore: 8.5,
        AvgExamScore: 9.5,
        IsCompleted: false,
        FirstEnrollmentDate: "2024-01-01",
        LatestEnrollmentDate: "2024-01-01",
        EarliestClassStart: "2024-01-15",
        LatestClassEnd: "2024-06-15",
        TotalClassFees: 1000000,
        TotalPaidAmount: 1000000,
        FirstPaymentDate: "2024-01-01",
      },
    ]);

    const result = await ProgressService.getLearnerProgress(1);

    expect(progressRepository.getLearnerProgress).toHaveBeenCalledWith(1, null);
    expect(result).toHaveLength(1);
    expect(result[0].enrollmentIds).toEqual(["1"]);
    expect(result[0].classIds).toEqual(["20"]);
    expect(result[0].classes).toEqual([
      { id: "20", name: "TOEIC A1", status: "active" },
    ]);
    expect(result[0].classesDetail).toHaveLength(1);
    expect(result[0].classesDetail[0]).toHaveProperty("classId", 20);
    expect(result[0].classesDetail[0]).toHaveProperty("name", "TOEIC A1");
    expect(result[0].classesDetail[0]).toHaveProperty("status", "active");
    expect(result[0].classesDetail[0]).toHaveProperty("progress", 75);
    expect(result[0].classesDetail[0]).toHaveProperty("attendanceRate", 90);
    expect(result[0].classesDetail[0]).toHaveProperty("performanceLevel", "Xuất sắc");
    expect(result[0].classesDetail[0]).toHaveProperty("stats");
    expect(result[0].classesDetail[0]).toHaveProperty("dates");
  });

  test("UTCID03 - learnerId = 1, không có class (repo trả []) -> trả []", async () => {
    progressRepository.getLearnerProgress.mockResolvedValue([]);

    const result = await ProgressService.getLearnerProgress(1);

    expect(progressRepository.getLearnerProgress).toHaveBeenCalledWith(1, null);
    expect(result).toEqual([]);
  });

  test("UTCID04 - learnerId = null, repo trả [] -> trả []", async () => {
    progressRepository.getLearnerProgress.mockResolvedValue([]);

    const result = await ProgressService.getLearnerProgress(null);

    expect(progressRepository.getLearnerProgress).toHaveBeenCalledWith(null, null);
    expect(result).toEqual([]);
  });

  test("UTCID05 - learnerId = 999999, repo trả [] -> trả []", async () => {
    progressRepository.getLearnerProgress.mockResolvedValue([]);

    const result = await ProgressService.getLearnerProgress(999999);

    expect(progressRepository.getLearnerProgress).toHaveBeenCalledWith(999999, null);
    expect(result).toEqual([]);
  });
});

