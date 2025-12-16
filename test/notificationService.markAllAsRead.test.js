jest.mock("../repositories/notificationRepository", () => ({
  markAllAsRead: jest.fn(),
}));

const notificationRepository = require("../repositories/notificationRepository");
const notificationService = require("../services/notificationService");

describe("notificationService - markAllAsRead", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - accId hợp lệ -> trả về response từ repository", async () => {
    notificationRepository.markAllAsRead.mockResolvedValue({
      affectedRows: 5,
    });

    const result = await notificationService.markAllAsRead(1);

    expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(1);
    expect(result).toEqual({ affectedRows: 5 });
  });

  test("UTCID02 - accId không hợp lệ -> repository ném lỗi, service propagate lỗi", async () => {
    notificationRepository.markAllAsRead.mockRejectedValue(
      new Error("Invalid account ID")
    );

    await expect(notificationService.markAllAsRead(-1)).rejects.toThrow(
      "Invalid account ID"
    );
  });
});


