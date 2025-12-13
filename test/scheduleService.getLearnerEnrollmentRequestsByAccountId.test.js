jest.mock("../config/db", () => jest.fn());

const connectDB = require("../config/db");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getLearnerEnrollmentRequestsByAccountId", () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      query: jest.fn(),
    };
    connectDB.mockResolvedValue(mockDb);
  });

  test("UTCID01 - accountId=1, learnerRows return fully data, enrollment query trả data -> service trả correct data", async () => {
    mockDb.query
      .mockResolvedValueOnce([
        [
          {
            LearnerID: 10,
          },
        ],
      ])
      .mockResolvedValueOnce([
        [
          {
            EnrollmentID: 1,
            EnrollmentDate: "2025-11-20",
            EnrollmentStatus: "Pending",
            OrderCode: "ORD001",
            LearnerID: 10,
            LearnerName: "John Doe",
            LearnerAvatar: "avatar.jpg",
            ClassID: 5,
            ClassName: "Math Class",
            ClassStatus: "pending",
            ClassFee: 1000000,
            InstructorID: 2,
            InstructorName: "Jane Smith",
            TotalSessions: 10,
            FirstSessionDate: "2025-12-01",
            LastSessionDate: "2025-12-31",
          },
        ],
      ]);

    const result =
      await ScheduleService.getLearnerEnrollmentRequestsByAccountId(1);

    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalledTimes(2);
    expect(mockDb.query).toHaveBeenNthCalledWith(
      1,
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [1]
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("EnrollmentID", 1);
    expect(result[0]).toHaveProperty("LearnerID", 10);
    expect(result[0]).toHaveProperty("ClassName", "Math Class");
  });

  test("UTCID02 - accountId=2, learnerRows return [] (empty array) -> service throw Error 'Không có hồ sơ học viên'", async () => {
    mockDb.query.mockResolvedValueOnce([[]]);

    await expect(
      ScheduleService.getLearnerEnrollmentRequestsByAccountId(2)
    ).rejects.toThrow("Không có hồ sơ học viên");
    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalledTimes(1);
    expect(mockDb.query).toHaveBeenCalledWith(
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [2]
    );
  });

  test("UTCID03 - accountId=3, connectDB ném lỗi (DB error) -> service throw 'DB error'", async () => {
    connectDB.mockRejectedValue(new Error("DB error"));

    await expect(
      ScheduleService.getLearnerEnrollmentRequestsByAccountId(3)
    ).rejects.toThrow("DB error");
    expect(connectDB).toHaveBeenCalled();
  });
});

