jest.mock("../repositories/instructorClassRepository", () => ({
  findById: jest.fn(),
}));

jest.mock("../repositories/instructorClassRosterRepository", () => ({
  getStudents: jest.fn(),
}));

const instructorClassRepository = require("../repositories/instructorClassRepository");
const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const {
  getInstructorClassRosterService,
} = require("../services/instructorClassService");

describe("instructorClassService - getInstructorClassRosterService", () => {
  const classId = 1;
  const instructorId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function buildClass(overrides = {}) {
    return {
      ClassID: classId,
      Name: "Lớp 1",
      InstructorID: instructorId,
      ...overrides,
    };
  }

  test("UTCID01 - class tồn tại, instructor đúng, có học viên -> trả về Students list", async () => {
    instructorClassRepository.findById.mockResolvedValue(buildClass());
    instructorClassRosterRepository.getStudents.mockResolvedValue([
      { LearnerID: 1 },
      { LearnerID: 2 },
    ]);

    const result = await getInstructorClassRosterService(classId, instructorId);

    expect(
      instructorClassRosterRepository.getStudents
    ).toHaveBeenCalledWith(classId);
    expect(result.Students).toHaveLength(2);
  });

  test("UTCID02 - class tồn tại, instructor đúng nhưng không có học viên -> Students = []", async () => {
    instructorClassRepository.findById.mockResolvedValue(buildClass());
    instructorClassRosterRepository.getStudents.mockResolvedValue([]);

    const result = await getInstructorClassRosterService(classId, instructorId);

    expect(result.Students).toEqual([]);
  });

  test("UTCID03 - class không tồn tại -> ném ServiceError 'Lớp học không tồn tại'", async () => {
    instructorClassRepository.findById.mockResolvedValue(null);

    await expect(
      getInstructorClassRosterService(classId, instructorId)
    ).rejects.toThrow("Lớp học không tồn tại");
  });

  test("UTCID04 - instructorId không khớp với class -> ném ServiceError 'Bạn không có quyền truy cập lớp này'", async () => {
    instructorClassRepository.findById.mockResolvedValue(
      buildClass({ InstructorID: 999999 })
    );

    await expect(
      getInstructorClassRosterService(classId, instructorId)
    ).rejects.toThrow("Bạn không có quyền truy cập lớp này");
  });
});


