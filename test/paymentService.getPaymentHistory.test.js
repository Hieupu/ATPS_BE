jest.mock("../repositories/paymentRepository", () => ({
  getPaymentHistory: jest.fn(),
}));

const paymentRepository = require("../repositories/paymentRepository");
const paymentService = require("../services/paymentService");

describe("paymentService - getPaymentHistory", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - learnerId = 'L001', repo trả mảng 1 payment -> service trả đúng data", async () => {
    const learnerId = "L001";
    const payments = [{ id: 1, Amount: 500000 }];
    paymentRepository.getPaymentHistory.mockResolvedValue(payments);

    const result = await paymentService.getPaymentHistory(learnerId);

    expect(paymentRepository.getPaymentHistory).toHaveBeenCalledWith(learnerId);
    expect(result).toEqual(payments);
  });

  test("UTCID02 - learnerId = 'L002', repo trả [] -> service trả []", async () => {
    const learnerId = "L002";
    paymentRepository.getPaymentHistory.mockResolvedValue([]);

    const result = await paymentService.getPaymentHistory(learnerId);

    expect(paymentRepository.getPaymentHistory).toHaveBeenCalledWith(learnerId);
    expect(result).toEqual([]);
  });

  test("UTCID03 - learnerId = 'L003', repo ném lỗi -> service log error và ném lại", async () => {
    const learnerId = "L003";
    const error = new Error("DB error");
    paymentRepository.getPaymentHistory.mockRejectedValue(error);

    await expect(
      paymentService.getPaymentHistory(learnerId)
    ).rejects.toThrow("DB error");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("UTCID04 - learnerId = null, repo trả [{ id: 2 }] -> service trả đúng data", async () => {
    const learnerId = null;
    const payments = [{ id: 2 }];
    paymentRepository.getPaymentHistory.mockResolvedValue(payments);

    const result = await paymentService.getPaymentHistory(learnerId);

    expect(paymentRepository.getPaymentHistory).toHaveBeenCalledWith(learnerId);
    expect(result).toEqual(payments);
  });

  test("UTCID05 - learnerId = 123, repo trả [] -> service trả []", async () => {
    const learnerId = 123;
    paymentRepository.getPaymentHistory.mockResolvedValue([]);

    const result = await paymentService.getPaymentHistory(learnerId);

    expect(paymentRepository.getPaymentHistory).toHaveBeenCalledWith(learnerId);
    expect(result).toEqual([]);
  });
});


