jest.mock("../repositories/notificationRepository", () => ({
  createNotification: jest.fn(),
}));

const notificationRepository = require("../repositories/notificationRepository");
const notificationService = require("../services/notificationService");

describe("notificationService - create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - accId hợp lệ, content hợp lệ, type hợp lệ -> gọi createNotification và trả về kết quả", async () => {
    const payload = {
      accId: 1,
      content: "New message",
      type: "info",
    };
    notificationRepository.createNotification.mockResolvedValue({
      id: 10,
      ...payload,
    });

    const result = await notificationService.create(payload);

    expect(notificationRepository.createNotification).toHaveBeenCalledWith(
      payload
    );
    expect(result).toEqual({ id: 10, ...payload });
  });

  test("UTCID02 - accId không hợp lệ (null) -> ném lỗi Missing accId or content", async () => {
    await expect(
      notificationService.create({
        accId: null,
        content: "New message",
        type: "info",
      })
    ).rejects.toThrow("Missing accId or content");

    expect(notificationRepository.createNotification).not.toHaveBeenCalled();
  });

  test('UTCID03 - content rỗng "" -> ném lỗi Missing accId or content', async () => {
    await expect(
      notificationService.create({
        accId: 1,
        content: "",
        type: "info",
      })
    ).rejects.toThrow("Missing accId or content");

    expect(notificationRepository.createNotification).not.toHaveBeenCalled();
  });

  test("UTCID04 - cả accId và content đều không truyền -> ném lỗi Missing accId or content", async () => {
    await expect(
      notificationService.create({
        accId: undefined,
        content: undefined,
        type: "info",
      })
    ).rejects.toThrow("Missing accId or content");

    expect(notificationRepository.createNotification).not.toHaveBeenCalled();
  });
});
