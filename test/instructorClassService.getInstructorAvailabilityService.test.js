jest.mock("../repositories/instructorClassRosterRepository", () => ({
  getInstructorAvailability: jest.fn(),
  getInstructorOccupiedSlots: jest.fn(),
}));

const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const {
  getInstructorAvailabilityService,
} = require("../services/instructorClassService");

describe("instructorClassService - getInstructorAvailabilityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId=10, startDate=null, endDate='2025-12-31' -> service throw ServiceError 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'", async () => {
    await expect(
      getInstructorAvailabilityService(10, null, "2025-12-31")
    ).rejects.toThrow("Vui lòng cung cấp ngày bắt đầu và ngày kết thúc");
    expect(
      instructorClassRosterRepository.getInstructorAvailability
    ).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorId=10, startDate='2025-12-01', endDate='2025-12-31', repo trả availability và occupied -> service return { availability:[{slotId:1}], occupied:[{slotId:2}]}", async () => {
    instructorClassRosterRepository.getInstructorAvailability.mockResolvedValue(
      [
        {
          slotId: 1,
          Date: "2025-12-01",
          StartTime: "09:00",
          EndTime: "11:00",
        },
      ]
    );
    instructorClassRosterRepository.getInstructorOccupiedSlots.mockResolvedValue(
      [
        {
          slotId: 2,
          Date: "2025-12-02",
          StartTime: "14:00",
          EndTime: "16:00",
        },
      ]
    );

    const result = await getInstructorAvailabilityService(
      10,
      "2025-12-01",
      "2025-12-31"
    );

    expect(
      instructorClassRosterRepository.getInstructorAvailability
    ).toHaveBeenCalledWith(10, "2025-12-01", "2025-12-31");
    expect(
      instructorClassRosterRepository.getInstructorOccupiedSlots
    ).toHaveBeenCalledWith(10, "2025-12-01", "2025-12-31");
    expect(result).toHaveProperty("availability");
    expect(result).toHaveProperty("occupied");
    expect(Array.isArray(result.availability)).toBe(true);
    expect(Array.isArray(result.occupied)).toBe(true);
    expect(result.availability).toHaveLength(1);
    expect(result.availability[0]).toHaveProperty("slotId", 1);
    expect(result.occupied).toHaveLength(1);
    expect(result.occupied[0]).toHaveProperty("slotId", 2);
  });

  test("UTCID03 - instructorId=10, startDate='2025-12-01', endDate='2025-12-31', repo.getInstructorAvailability throw Error('DB error') -> service throw Error('DB error')", async () => {
    instructorClassRosterRepository.getInstructorAvailability.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      getInstructorAvailabilityService(10, "2025-12-01", "2025-12-31")
    ).rejects.toThrow("DB error");
    expect(
      instructorClassRosterRepository.getInstructorAvailability
    ).toHaveBeenCalledWith(10, "2025-12-01", "2025-12-31");
  });

  test("UTCID04 - instructorId=10, startDate=null, endDate='2025-12-31' -> service throw ServiceError 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'", async () => {
    await expect(
      getInstructorAvailabilityService(10, null, "2025-12-31")
    ).rejects.toThrow("Vui lòng cung cấp ngày bắt đầu và ngày kết thúc");
    expect(
      instructorClassRosterRepository.getInstructorAvailability
    ).not.toHaveBeenCalled();
  });

  test("UTCID05 - instructorId=10, startDate='2025-12-01', endDate=null -> service throw ServiceError 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'", async () => {
    await expect(
      getInstructorAvailabilityService(10, "2025-12-01", null)
    ).rejects.toThrow("Vui lòng cung cấp ngày bắt đầu và ngày kết thúc");
    expect(
      instructorClassRosterRepository.getInstructorAvailability
    ).not.toHaveBeenCalled();
  });
});

