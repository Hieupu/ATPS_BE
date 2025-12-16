jest.mock("../repositories/instructorClassRepository", () => ({
  listByInstructor: jest.fn(),
}));

const instructorClassRepository = require("../repositories/instructorClassRepository");
const {
  listInstructorClassesService,
} = require("../services/instructorClassService");

describe("instructorClassService - listInstructorClassesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId=10, repo trả [{ ClassID: 1, Name: 'Math A'}] -> service trả array chứa classes", async () => {
    instructorClassRepository.listByInstructor.mockResolvedValue([
      {
        ClassID: 1,
        Name: "Math A",
      },
    ]);

    const result = await listInstructorClassesService(10);

    expect(instructorClassRepository.listByInstructor).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("ClassID", 1);
    expect(result[0]).toHaveProperty("Name", "Math A");
  });

  test("UTCID02 - instructorId=20, repo trả [] -> service trả empty array", async () => {
    instructorClassRepository.listByInstructor.mockResolvedValue([]);

    const result = await listInstructorClassesService(20);

    expect(instructorClassRepository.listByInstructor).toHaveBeenCalledWith(20);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test("UTCID03 - instructorId=null, repo throw error -> service throw error", async () => {
    instructorClassRepository.listByInstructor.mockRejectedValue(
      new Error("Invalid instructorId")
    );

    await expect(
      listInstructorClassesService(null)
    ).rejects.toThrow("Invalid instructorId");
    expect(instructorClassRepository.listByInstructor).toHaveBeenCalledWith(
      null
    );
  });

  test("UTCID04 - instructorId=5, repo throw 'DB error' -> service throw 'DB error'", async () => {
    instructorClassRepository.listByInstructor.mockRejectedValue(
      new Error("DB error")
    );

    await expect(listInstructorClassesService(5)).rejects.toThrow("DB error");
    expect(instructorClassRepository.listByInstructor).toHaveBeenCalledWith(5);
  });
});

