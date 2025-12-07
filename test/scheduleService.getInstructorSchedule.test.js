jest.mock("../repositories/scheduleRepository", () => ({
  getInstructorSchedule: jest.fn(),
}));

const scheduleRepository = require("../repositories/scheduleRepository");
const ScheduleService = require("../services/scheduleService");

describe("scheduleService - getInstructorSchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId = 1, repo trả data hợp lệ -> service format đúng với formattedDate, timeRange, hasZoom", async () => {
    scheduleRepository.getInstructorSchedule.mockResolvedValue([
      {
        SessionID: 1,
        Date: "2025-11-23",
        StartTime: "09:00",
        EndTime: "11:00",
        ZoomURL: null,
      },
    ]);

    const result = await ScheduleService.getInstructorSchedule(1);

    expect(scheduleRepository.getInstructorSchedule).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 1);
    expect(result[0]).toHaveProperty("formattedDate");
    expect(result[0]).toHaveProperty("timeRange", "09:00 - 11:00");
    expect(result[0]).toHaveProperty("hasZoom", false);
  });

  test("UTCID02 - instructorId = 2, repo trả data với ZoomURL -> hasZoom = true", async () => {
    scheduleRepository.getInstructorSchedule.mockResolvedValue([
      {
        SessionID: 2,
        Date: "2025-12-01",
        StartTime: "14:00",
        EndTime: "16:00",
        ZoomURL: "zoom.com",
      },
    ]);

    const result = await ScheduleService.getInstructorSchedule(2);

    expect(scheduleRepository.getInstructorSchedule).toHaveBeenCalledWith(2);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 2);
    expect(result[0]).toHaveProperty("formattedDate");
    expect(result[0]).toHaveProperty("timeRange", "14:00 - 16:00");
    expect(result[0]).toHaveProperty("hasZoom", true);
  });

  test("UTCID03 - instructorId = 3, repo trả data với ZoomURL = null -> hasZoom = false", async () => {
    scheduleRepository.getInstructorSchedule.mockResolvedValue([
      {
        SessionID: 3,
        Date: "2025-11-24",
        StartTime: "10:00",
        EndTime: "12:00",
        ZoomURL: null,
      },
    ]);

    const result = await ScheduleService.getInstructorSchedule(3);

    expect(scheduleRepository.getInstructorSchedule).toHaveBeenCalledWith(3);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 3);
    expect(result[0]).toHaveProperty("formattedDate");
    expect(result[0]).toHaveProperty("timeRange", "10:00 - 12:00");
    expect(result[0]).toHaveProperty("hasZoom", false);
  });

  test("UTCID04 - instructorId = 4, repo trả data với Date = null -> formattedDate = null", async () => {
    scheduleRepository.getInstructorSchedule.mockResolvedValue([
      {
        SessionID: 4,
        Date: null,
        StartTime: "10:00",
        EndTime: "12:00",
        ZoomURL: null,
      },
    ]);

    const result = await ScheduleService.getInstructorSchedule(4);

    expect(scheduleRepository.getInstructorSchedule).toHaveBeenCalledWith(4);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("SessionID", 4);
    expect(result[0]).toHaveProperty("formattedDate", null);
    expect(result[0]).toHaveProperty("timeRange", "10:00 - 12:00");
    expect(result[0]).toHaveProperty("hasZoom", false);
  });
});

