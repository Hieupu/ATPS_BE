jest.mock("../config/db", () => jest.fn());

const connectDB = require("../config/db");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getTimeslotById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - timeslotId = 1, DB trả data -> service trả object Timeslot", async () => {
    const mockDb = {
      execute: jest.fn().mockResolvedValue([
        [
          {
            TimeslotID: 1,
            StartTime: "09:00",
            EndTime: "11:00",
            Day: "Monday",
          },
        ],
      ]),
    };
    connectDB.mockResolvedValue(mockDb);

    const result = await ScheduleService.getTimeslotById(1);

    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      [1]
    );
    expect(result).toEqual({
      TimeslotID: 1,
      StartTime: "09:00",
      EndTime: "11:00",
      Day: "Monday",
    });
  });

  test("UTCID02 - timeslotId = 999999, DB trả [] -> service trả null", async () => {
    const mockDb = {
      execute: jest.fn().mockResolvedValue([[]]),
    };
    connectDB.mockResolvedValue(mockDb);

    const result = await ScheduleService.getTimeslotById(999999);

    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      [999999]
    );
    expect(result).toBeNull();
  });

  test("UTCID03 - timeslotId = null, DB trả [] -> service trả null", async () => {
    const mockDb = {
      execute: jest.fn().mockResolvedValue([[]]),
    };
    connectDB.mockResolvedValue(mockDb);

    const result = await ScheduleService.getTimeslotById(null);

    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      [null]
    );
    expect(result).toBeNull();
  });

  test("UTCID04 - timeslotId = 'abc', DB trả [] -> service trả null", async () => {
    const mockDb = {
      execute: jest.fn().mockResolvedValue([[]]),
    };
    connectDB.mockResolvedValue(mockDb);

    const result = await ScheduleService.getTimeslotById("abc");

    expect(connectDB).toHaveBeenCalled();
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      ["abc"]
    );
    expect(result).toBeNull();
  });

  test("UTCID05 - connectDB ném lỗi -> service log error và ném lại", async () => {
    connectDB.mockRejectedValue(new Error("DB connection error"));

    await expect(ScheduleService.getTimeslotById(1)).rejects.toThrow(
      "DB connection error"
    );
    expect(connectDB).toHaveBeenCalled();
  });
});
