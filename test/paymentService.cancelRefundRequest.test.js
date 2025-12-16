jest.mock("../repositories/paymentRepository", () => ({
  getRefundRequestById: jest.fn(),
  updateRefundStatus: jest.fn(),
}));

const paymentRepository = require("../repositories/paymentRepository");
const PaymentService = require("../services/paymentService");

describe("paymentService - cancelRefundRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - refundId = 101, refund tồn tại và Status = 'pending' -> updateRefundStatus được gọi và trả success: true", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue({
      RefundID: 101,
      Status: "pending",
    });
    paymentRepository.updateRefundStatus.mockResolvedValue({
      RefundID: 101,
      Status: "cancelled",
    });

    const result = await PaymentService.cancelRefundRequest(101);

    expect(paymentRepository.getRefundRequestById).toHaveBeenCalledWith(101);
    expect(paymentRepository.updateRefundStatus).toHaveBeenCalledWith(
      101,
      "cancelled"
    );
    expect(result).toEqual({
      success: true,
      message: "Đã hủy yêu cầu hoàn tiền thành công",
      refundRequest: {
        RefundID: 101,
        Status: "cancelled",
      },
    });
  });

  test("UTCID02 - refundId = 99999999, refund không tồn tại -> ném Error 'Không tìm thấy yêu cầu hoàn tiền'", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue(null);

    await expect(
      PaymentService.cancelRefundRequest(99999999)
    ).rejects.toThrow("Không tìm thấy yêu cầu hoàn tiền");
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });

  test("UTCID03 - refundId = 102, Status = 'approved' -> ném Error 'Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý'", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue({
      RefundID: 102,
      Status: "approved",
    });

    await expect(
      PaymentService.cancelRefundRequest(102)
    ).rejects.toThrow("Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý");
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });

  test("UTCID04 - refundId = 103, Status = 'rejected' -> ném Error 'Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý'", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue({
      RefundID: 103,
      Status: "rejected",
    });

    await expect(
      PaymentService.cancelRefundRequest(103)
    ).rejects.toThrow("Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý");
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });

  test("UTCID05 - refundId = 0, refund không tồn tại -> ném Error 'Không tìm thấy yêu cầu hoàn tiền'", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue(null);

    await expect(PaymentService.cancelRefundRequest(0)).rejects.toThrow(
      "Không tìm thấy yêu cầu hoàn tiền"
    );
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });

  test("UTCID06 - refundId = null, refund không tồn tại -> ném Error 'Không tìm thấy yêu cầu hoàn tiền'", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue(null);

    await expect(PaymentService.cancelRefundRequest(null)).rejects.toThrow(
      "Không tìm thấy yêu cầu hoàn tiền"
    );
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });

  test("UTCID07 - refundId = 'abc', refund không tồn tại -> ném Error 'Không tìm thấy yêu cầu hoàn tiền'", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue(null);

    await expect(PaymentService.cancelRefundRequest("abc")).rejects.toThrow(
      "Không tìm thấy yêu cầu hoàn tiền"
    );
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });

  test("UTCID08 - refundId = '105', refund không tồn tại -> ném Error 'Không tìm thấy yêu cầu hoàn tiền'", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue(null);

    await expect(PaymentService.cancelRefundRequest("105")).rejects.toThrow(
      "Không tìm thấy yêu cầu hoàn tiền"
    );
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });

  test("UTCID09 - refundId hợp lệ, Status = 'pending' -> updateRefundStatus được gọi và trả success: true", async () => {
    paymentRepository.getRefundRequestById.mockResolvedValue({
      RefundID: 106,
      Status: "pending",
    });
    paymentRepository.updateRefundStatus.mockResolvedValue({
      RefundID: 106,
      Status: "cancelled",
    });

    const result = await PaymentService.cancelRefundRequest(106);

    expect(paymentRepository.getRefundRequestById).toHaveBeenCalledWith(106);
    expect(paymentRepository.updateRefundStatus).toHaveBeenCalledWith(
      106,
      "cancelled"
    );
    expect(result).toEqual({
      success: true,
      message: "Đã hủy yêu cầu hoàn tiền thành công",
      refundRequest: {
        RefundID: 106,
        Status: "cancelled",
      },
    });
  });

  test("UTCID10 - repo ném lỗi (DB error) -> service log error và ném lại", async () => {
    paymentRepository.getRefundRequestById.mockRejectedValue(
      new Error("DB connection error")
    );

    await expect(
      PaymentService.cancelRefundRequest(107)
    ).rejects.toThrow("DB connection error");
    expect(paymentRepository.updateRefundStatus).not.toHaveBeenCalled();
  });
});

