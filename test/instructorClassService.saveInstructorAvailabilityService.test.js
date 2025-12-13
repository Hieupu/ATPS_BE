jest.mock("../repositories/instructorClassRosterRepository", () => ({
  saveInstructorAvailability: jest.fn(),
}));

const instructorClassRosterRepository = require("../repositories/instructorClassRosterRepository");
const {
  saveInstructorAvailabilityService,
} = require("../services/instructorClassService");

describe("instructorClassService - saveInstructorAvailabilityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - instructorId=10, startDate=null, endDate='2025-12-31', slots=[] -> service throw ServiceError 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'", async () => {
    await expect(
      saveInstructorAvailabilityService(10, null, "2025-12-31", [])
    ).rejects.toThrow("Vui lòng cung cấp ngày bắt đầu và ngày kết thúc");
    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).not.toHaveBeenCalled();
  });

  test("UTCID02 - instructorId=10, startDate='2025-12-01', endDate=null, slots=[] -> service throw ServiceError 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'", async () => {
    await expect(
      saveInstructorAvailabilityService(10, "2025-12-01", null, [])
    ).rejects.toThrow("Vui lòng cung cấp ngày bắt đầu và ngày kết thúc");
    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).not.toHaveBeenCalled();
  });

  test("UTCID03 - instructorId=10, startDate='2025-12-01', endDate='2025-12-31', slots='invalid' -> service throw ServiceError 'Dữ liệu lịch đăng ký (slots) phải là một danh sách'", async () => {
    await expect(
      saveInstructorAvailabilityService(10, "2025-12-01", "2025-12-31", "invalid")
    ).rejects.toThrow("Dữ liệu lịch đăng ký (slots) phải là một danh sách");
    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).not.toHaveBeenCalled();
  });

  test("UTCID04 - instructorId=10, startDate='2020-01-01' (quá khứ), endDate='2025-12-31', slots=[] -> service throw ServiceError 'Không thể cập nhật lịch cho ngày trong quá khứ'", async () => {
    await expect(
      saveInstructorAvailabilityService(10, "2020-01-01", "2025-12-31", [])
    ).rejects.toThrow("Không thể cập nhật lịch cho ngày trong quá khứ");
    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).not.toHaveBeenCalled();
  });

  test("UTCID05 - instructorId=10, startDate='2026-12-01', endDate='2026-12-31', slots=[], repo resolve -> service return {success: true, message: 'Cập nhật lịch rảnh thành công'}", async () => {
    instructorClassRosterRepository.saveInstructorAvailability.mockResolvedValue();

    const result = await saveInstructorAvailabilityService(
      10,
      "2026-12-01",
      "2026-12-31",
      []
    );

    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).toHaveBeenCalledWith(10, "2026-12-01", "2026-12-31", []);
    expect(result).toEqual({
      success: true,
      message: "Cập nhật lịch rảnh thành công",
    });
  });

  test("UTCID06 - instructorId=10, startDate='2026-12-01', endDate='2026-12-31', slots=[], repo resolve -> service return {success: true, message: 'Cập nhật lịch rảnh thành công'}", async () => {
    instructorClassRosterRepository.saveInstructorAvailability.mockResolvedValue();

    const result = await saveInstructorAvailabilityService(
      10,
      "2026-12-01",
      "2026-12-31",
      []
    );

    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).toHaveBeenCalledWith(10, "2026-12-01", "2026-12-31", []);
    expect(result).toEqual({
      success: true,
      message: "Cập nhật lịch rảnh thành công",
    });
  });

  test("UTCID07 - instructorId=10, startDate=today, endDate=today, slots=[{start: '09:00', end:'10:00'}], repo resolve -> service return {success: true, message: 'Cập nhật lịch rảnh thành công'}", async () => {
    const today = new Date().toISOString().split("T")[0];
    instructorClassRosterRepository.saveInstructorAvailability.mockResolvedValue();

    const result = await saveInstructorAvailabilityService(
      10,
      today,
      today,
      [{ start: "09:00", end: "10:00" }]
    );

    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).toHaveBeenCalledWith(10, today, today, [{ start: "09:00", end: "10:00" }]);
    expect(result).toEqual({
      success: true,
      message: "Cập nhật lịch rảnh thành công",
    });
  });

  test("UTCID08 - instructorId=10, startDate=future, endDate=future, slots=[], repo resolve -> service return {success: true, message: 'Cập nhật lịch rảnh thành công'}", async () => {
    const future = "2026-12-01";
    instructorClassRosterRepository.saveInstructorAvailability.mockResolvedValue();

    const result = await saveInstructorAvailabilityService(10, future, future, []);

    expect(
      instructorClassRosterRepository.saveInstructorAvailability
    ).toHaveBeenCalledWith(10, future, future, []);
    expect(result).toEqual({
      success: true,
      message: "Cập nhật lịch rảnh thành công",
    });
  });
});

