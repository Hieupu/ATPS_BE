jest.mock("../config/db", () => jest.fn());

const connectDB = require("../config/db");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - cancelEnrollmentByLearner", () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      query: jest.fn(),
    };
    connectDB.mockResolvedValue(mockDb);
  });

  test("UTCID01 - enrollmentId=1001, accountId=1, learnerRows return correct data, enrollment query trả data -> service return success: true", async () => {
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
            EnrollmentID: 1001,
            ClassID: 5,
          },
        ],
      ])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await ScheduleService.cancelEnrollmentByLearner(1001, 1);

    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalledTimes(4);
    expect(mockDb.query).toHaveBeenNthCalledWith(
      1,
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [1]
    );
    expect(mockDb.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("SELECT e.EnrollmentID, e.ClassID"),
      [1001, 10]
    );
    expect(result).toEqual({ success: true });
  });

  test("UTCID02 - enrollmentId=2001, accountId=2, learnerRows return [] (empty array) -> service throw Error 'Không có hồ sơ học viên'", async () => {
    mockDb.query.mockResolvedValueOnce([[]]);

    await expect(
      ScheduleService.cancelEnrollmentByLearner(2001, 2)
    ).rejects.toThrow("Không có hồ sơ học viên");
    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalledTimes(1);
    expect(mockDb.query).toHaveBeenCalledWith(
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [2]
    );
  });

  test("UTCID03 - enrollmentId=3001, accountId=3, learnerRows return correct data, enrollment query trả [] -> service throw Error 'Không thể hủy: đơn không tồn tại hoặc đã được xử lý'", async () => {
    mockDb.query
      .mockResolvedValueOnce([
        [
          {
            LearnerID: 20,
          },
        ],
      ])
      .mockResolvedValueOnce([[]]);

    await expect(
      ScheduleService.cancelEnrollmentByLearner(3001, 3)
    ).rejects.toThrow("Không thể hủy: đơn không tồn tại hoặc đã được xử lý");
    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalledTimes(2);
    expect(mockDb.query).toHaveBeenNthCalledWith(
      1,
      "SELECT LearnerID FROM learner WHERE AccID = ?",
      [3]
    );
    expect(mockDb.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("SELECT e.EnrollmentID, e.ClassID"),
      [3001, 20]
    );
  });

  test("UTCID04 - enrollmentId=4001, accountId=4, connectDB ném lỗi (DB error) -> service throw 'DB error'", async () => {
    connectDB.mockRejectedValue(new Error("DB error"));

    await expect(
      ScheduleService.cancelEnrollmentByLearner(4001, 4)
    ).rejects.toThrow("DB error");
    expect(connectDB).toHaveBeenCalled();
  });
});

