jest.mock("../repositories/notificationRepository", () => ({
  getNotificationsByAccount: jest.fn(),
}));

const notificationRepository = require("../repositories/notificationRepository");
const notificationService = require("../services/notificationService");

describe("notificationService - listByAccount", () => {
  const options = { page: 1, limit: 10 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - accId hợp lệ -> trả về danh sách notifications", async () => {
    const fakeList = [{ id: 1 }, { id: 2 }];
    notificationRepository.getNotificationsByAccount.mockResolvedValue(
      fakeList
    );

    const result = await notificationService.listByAccount(1, options);

    expect(
      notificationRepository.getNotificationsByAccount
    ).toHaveBeenCalledWith(1, options);
    expect(result).toBe(fakeList);
  });

  test("UTCID02 - accId = null -> repository trả về mảng rỗng, service trả về rỗng", async () => {
    notificationRepository.getNotificationsByAccount.mockResolvedValue([]);

    const result = await notificationService.listByAccount(null, options);

    expect(
      notificationRepository.getNotificationsByAccount
    ).toHaveBeenCalledWith(null, options);
    expect(result).toEqual([]);
  });

  test("UTCID03 - accId = undefined -> repository trả về mảng rỗng, service trả về rỗng", async () => {
    notificationRepository.getNotificationsByAccount.mockResolvedValue([]);

    const result = await notificationService.listByAccount(undefined, options);

    expect(
      notificationRepository.getNotificationsByAccount
    ).toHaveBeenCalledWith(undefined, options);
    expect(result).toEqual([]);
  });
});


