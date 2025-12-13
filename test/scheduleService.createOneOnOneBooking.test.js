jest.mock("../repositories/scheduleRepository", () => ({
  createOneOnOneBooking: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - createOneOnOneBooking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - bookingData có đầy đủ LearnerID=1, InstructorID=10, Date='2025-11-25', TimeslotID=5, Description='Test', Topic='Math' -> repo trả booking object, service trả về booking object", async () => {
    const bookingData = {
      LearnerID: 1,
      InstructorID: 10,
      Date: "2025-11-25",
      TimeslotID: 5,
      Description: "Test",
      Topic: "Math",
    };

    const mockBooking = {
      BookingID: 100,
      LearnerID: 1,
      InstructorID: 10,
      Date: "2025-11-25",
      TimeslotID: 5,
      Description: "Test",
      Topic: "Math",
    };

    scheduleRepository.createOneOnOneBooking.mockResolvedValue(mockBooking);

    const result = await ScheduleService.createOneOnOneBooking(bookingData);

    expect(
      scheduleRepository.createOneOnOneBooking
    ).toHaveBeenCalledWith(bookingData);
    expect(result).toEqual(mockBooking);
  });

  test("UTCID02 - bookingData có LearnerID=0, InstructorID=10, Date='2025-11-25' -> service throw Error 'Missing required booking information'", async () => {
    const bookingData = {
      LearnerID: 0,
      InstructorID: 10,
      Date: "2025-11-25",
    };

    await expect(
      ScheduleService.createOneOnOneBooking(bookingData)
    ).rejects.toThrow("Missing required booking information");
    expect(
      scheduleRepository.createOneOnOneBooking
    ).not.toHaveBeenCalled();
  });

  test("UTCID03 - bookingData có LearnerID=1, InstructorID=0, Date='2025-11-25' -> service throw Error 'Missing required booking information'", async () => {
    const bookingData = {
      LearnerID: 1,
      InstructorID: 0,
      Date: "2025-11-25",
    };

    await expect(
      ScheduleService.createOneOnOneBooking(bookingData)
    ).rejects.toThrow("Missing required booking information");
    expect(
      scheduleRepository.createOneOnOneBooking
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - bookingData có LearnerID=1, InstructorID=10 (thiếu Date, TimeslotID, Description, Topic) -> repo trả booking object, service trả về repo result", async () => {
    const bookingData = {
      LearnerID: 1,
      InstructorID: 10,
    };

    const mockBooking = {
      BookingID: 101,
      LearnerID: 1,
      InstructorID: 10,
      Date: null,
      TimeslotID: null,
      Description: null,
      Topic: null,
    };

    scheduleRepository.createOneOnOneBooking.mockResolvedValue(mockBooking);

    const result = await ScheduleService.createOneOnOneBooking(bookingData);

    expect(
      scheduleRepository.createOneOnOneBooking
    ).toHaveBeenCalledWith(bookingData);
    expect(result).toEqual(mockBooking);
  });

  test("UTCID05 - bookingData có LearnerID=1, InstructorID=10, repo ném lỗi (DB error) -> service throw 'DB error'", async () => {
    const bookingData = {
      LearnerID: 1,
      InstructorID: 10,
    };

    scheduleRepository.createOneOnOneBooking.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      ScheduleService.createOneOnOneBooking(bookingData)
    ).rejects.toThrow("DB error");
    expect(
      scheduleRepository.createOneOnOneBooking
    ).toHaveBeenCalledWith(bookingData);
  });
});

