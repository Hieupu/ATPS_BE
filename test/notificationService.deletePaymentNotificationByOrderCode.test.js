jest.mock("../repositories/notificationRepository", () => ({
  deletePaymentNotificationByOrderCode: jest.fn(),
}));

const notificationRepository = require("../repositories/notificationRepository");
const notificationService = require("../services/notificationService");

describe("notificationService - deletePaymentNotificationByOrderCode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - accId hợp lệ, orderCode hợp lệ -> trả về response từ repository", async () => {
    notificationRepository.deletePaymentNotificationByOrderCode.mockResolvedValue(
      { affectedRows: 2 }
    );

    const result =
      await notificationService.deletePaymentNotificationByOrderCode(
        1,
        "ORDER123"
      );

    expect(
      notificationRepository.deletePaymentNotificationByOrderCode
    ).toHaveBeenCalledWith(1, "ORDER123");
    expect(result).toEqual({ affectedRows: 2 });
  });

  test("UTCID02 - accId không hợp lệ hoặc orderCode không tìm thấy -> repository ném lỗi, service propagate lỗi", async () => {
    notificationRepository.deletePaymentNotificationByOrderCode.mockRejectedValue(
      new Error("Delete failed")
    );

    await expect(
      notificationService.deletePaymentNotificationByOrderCode(
        -1,
        "INVALID_ORDER"
      )
    ).rejects.toThrow("Delete failed");
  });
});


