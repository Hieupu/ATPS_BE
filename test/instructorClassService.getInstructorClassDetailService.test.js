jest.mock("../repositories/instructorClassRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorClassRosterRepository", () => ({
  getStudents: jest.fn(),
}));

const instructorClassRepository = require("../repositories/instructorClassRepository");
const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const {
  getInstructorClassDetailService,
} = require("../services/instructorClassService");

describe("instructorClassService - getInstructorClassDetailService", () => {
  const classId = 1;
  const instructorId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function buildRaw(overrides = {}) {
    return {
      ClassID: classId,
      Name: "Lớp 1",
      Status: "active",
      Fee: "1000000",
      ZoomID: "zoom1",
      Zoompass: "pass",
      CourseID: 10,
      CourseTitle: "Khóa A",
      CourseImage: "course.png",
      CourseLevel: "Cơ bản",
      InstructorID: instructorId,
      InstructorName: "GV A",
      ProfilePicture: "avatar.png",
      currentStudents: 20,
      Maxstudent: 30,
      OpendatePlan: "2025-01-01",
      Opendate: "2025-01-05",
      EnddatePlan: "2025-03-01",
      Enddate: "2025-03-05",
      Numofsession: 10,
      completedSessions: 5,
      ScheduleSummary: "Thứ 2, 4, 6",
      HasSessionToday: 1,
      NextSessionDate: new Date().toISOString(),
      ...overrides,
    };
  }

  test("UTCID01 - class tồn tại, instructor đúng -> trả về object với StudentCount = currentStudents", async () => {
    const raw = buildRaw();
    instructorClassRepository.findById.mockResolvedValue(raw);
    instructorClassRosterRepository.getStudents.mockResolvedValue([
      {
        LearnerID: 1,
        FullName: "SV 1",
        ProfilePicture: "sv1.png",
        Email: "sv1@example.com",
        Phone: "0123",
      },
      {
        LearnerID: 2,
        FullName: "SV 2",
        ProfilePicture: null,
        Email: "sv2@example.com",
        Phone: "0456",
      },
    ]);

    const result = await getInstructorClassDetailService(classId, instructorId);

    expect(result.classId).toBe(classId);
    expect(result.currentStudents).toBe(20);
    expect(result.maxStudents).toBe(30);
    expect(result.remainingSlots).toBe(10);
    expect(result.students).toHaveLength(2);
  });

  test("UTCID02 - class không tồn tại -> ném ServiceError status 404", async () => {
    instructorClassRepository.findById.mockResolvedValue(null);

    await expect(
      getInstructorClassDetailService(classId, instructorId)
    ).rejects.toThrow("Class không tồn tại");
  });

  test("UTCID03 - instructorId không khớp với class -> ném ServiceError 403", async () => {
    const raw = buildRaw({ InstructorID: 9999999 });
    instructorClassRepository.findById.mockResolvedValue(raw);

    await expect(
      getInstructorClassDetailService(classId, instructorId)
    ).rejects.toThrow("Bạn không có quyền truy cập lớp này");
  });

  test("UTCID04 - class có 0 học viên -> StudentCount = 0, remainingSlots = Maxstudent", async () => {
    const raw = buildRaw({ currentStudents: 0 });
    instructorClassRepository.findById.mockResolvedValue(raw);
    instructorClassRosterRepository.getStudents.mockResolvedValue([]);

    const result = await getInstructorClassDetailService(classId, instructorId);

    expect(result.currentStudents).toBe(0);
    expect(result.remainingSlots).toBe(raw.Maxstudent);
    expect(result.students).toEqual([]);
  });
});


