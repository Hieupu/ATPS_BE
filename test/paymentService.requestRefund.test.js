jest.mock("../repositories/paymentRepository", () => ({
  getEnrollmentDetails: jest.fn(),
  getExistingRefund: jest.fn(),
  getPaymentByEnrollment: jest.fn(),
  createRefundRequest: jest.fn(),
}));

const paymentRepository = require("../repositories/paymentRepository");
const PaymentService = require("../services/paymentService");

describe("paymentService - requestRefund", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("UTCID01 - enrollment tồn tại, lớp chưa bắt đầu, không có existing refund, payment success -> tạo refund request thành công", async () => {
    paymentRepository.getEnrollmentDetails.mockResolvedValue({
      EnrollmentID: 1001,
      ClassID: 10,
      ClassName: "TOEIC",
      Opendate: "2025-01-10",
    });
    paymentRepository.getExistingRefund.mockResolvedValue(null);
    paymentRepository.getPaymentByEnrollment.mockResolvedValue({
      PaymentID: 1,
      Status: "success",
    });
    paymentRepository.createRefundRequest.mockResolvedValue({
      RefundID: 1,
      EnrollmentID: 1001,
      Reason: "Muốn đổi lớp",
    });

    const result = await PaymentService.requestRefund(1001, "Muốn đổi lớp");

    expect(paymentRepository.getEnrollmentDetails).toHaveBeenCalledWith(1001);
    expect(paymentRepository.getExistingRefund).toHaveBeenCalledWith(1001);
    expect(paymentRepository.getPaymentByEnrollment).toHaveBeenCalledWith(1001);
    expect(paymentRepository.createRefundRequest).toHaveBeenCalledWith(
      1001,
      "Muốn đổi lớp"
    );
    expect(result).toEqual({
      success: true,
      message: "Yêu cầu hoàn tiền đã được gửi thành công",
      refundRequest: {
        RefundID: 1,
        EnrollmentID: 1001,
        Reason: "Muốn đổi lớp",
      },
    });
  });

  test("UTCID02 - enrollment không tồn tại -> ném Error 'Không tìm thấy thông tin đăng ký học'", async () => {
    paymentRepository.getEnrollmentDetails.mockResolvedValue(null);

    await expect(
      PaymentService.requestRefund(999999999, "Muốn đổi lớp")
    ).rejects.toThrow("Không tìm thấy thông tin đăng ký học");
    expect(paymentRepository.getExistingRefund).not.toHaveBeenCalled();
    expect(paymentRepository.createRefundRequest).not.toHaveBeenCalled();
  });

  test("UTCID03 - enrollment tồn tại nhưng ClassID hoặc ClassName null -> ném Error 'Không tìm thấy thông tin lớp học'", async () => {
    paymentRepository.getEnrollmentDetails.mockResolvedValue({
      EnrollmentID: 1002,
      ClassID: null,
      ClassName: null,
      Opendate: "2025-01-20",
    });

    await expect(
      PaymentService.requestRefund(1002, "Muốn đổi lớp")
    ).rejects.toThrow("Không tìm thấy thông tin lớp học");
    expect(paymentRepository.getExistingRefund).not.toHaveBeenCalled();
    expect(paymentRepository.createRefundRequest).not.toHaveBeenCalled();
  });

  test("UTCID04 - enrollment tồn tại nhưng lớp đã bắt đầu (Opendate <= currentDate) -> ném Error 'Không thể hoàn tiền cho lớp học đã bắt đầu'", async () => {
    paymentRepository.getEnrollmentDetails.mockResolvedValue({
      EnrollmentID: 1001,
      ClassID: 10,
      ClassName: "TOEIC",
      Opendate: "2024-12-01",
    });

    await expect(
      PaymentService.requestRefund(1001, "Muốn đổi lớp")
    ).rejects.toThrow("Không thể hoàn tiền cho lớp học đã bắt đầu");
    expect(paymentRepository.getExistingRefund).not.toHaveBeenCalled();
    expect(paymentRepository.createRefundRequest).not.toHaveBeenCalled();
  });

  test("UTCID05 - enrollment tồn tại nhưng đã có existing refund -> ném Error 'Đã có yêu cầu hoàn tiền cho khóa học này'", async () => {
    paymentRepository.getEnrollmentDetails.mockResolvedValue({
      EnrollmentID: 1003,
      ClassID: 11,
      ClassName: "IELTS",
      Opendate: "2025-01-15",
    });
    paymentRepository.getExistingRefund.mockResolvedValue({
      RefundID: 1,
      EnrollmentID: 1003,
    });

    await expect(
      PaymentService.requestRefund(1003, "Muốn đổi lớp")
    ).rejects.toThrow("Đã có yêu cầu hoàn tiền cho khóa học này");
    expect(paymentRepository.getPaymentByEnrollment).not.toHaveBeenCalled();
    expect(paymentRepository.createRefundRequest).not.toHaveBeenCalled();
  });

  test("UTCID06 - enrollment tồn tại, lớp chưa bắt đầu, không có existing refund, payment success -> tạo refund request thành công", async () => {
    paymentRepository.getEnrollmentDetails.mockResolvedValue({
      EnrollmentID: 1009,
      ClassID: 12,
      ClassName: "TOEFL",
      Opendate: "2025-02-01",
    });
    paymentRepository.getExistingRefund.mockResolvedValue(null);
    paymentRepository.getPaymentByEnrollment.mockResolvedValue({
      PaymentID: 2,
      Status: "success",
    });
    paymentRepository.createRefundRequest.mockResolvedValue({
      RefundID: 2,
      EnrollmentID: 1009,
      Reason: "Muốn đổi lớp",
    });

    const result = await PaymentService.requestRefund(1009, "Muốn đổi lớp");

    expect(paymentRepository.getEnrollmentDetails).toHaveBeenCalledWith(1009);
    expect(paymentRepository.getExistingRefund).toHaveBeenCalledWith(1009);
    expect(paymentRepository.getPaymentByEnrollment).toHaveBeenCalledWith(1009);
    expect(paymentRepository.createRefundRequest).toHaveBeenCalledWith(
      1009,
      "Muốn đổi lớp"
    );
    expect(result).toEqual({
      success: true,
      message: "Yêu cầu hoàn tiền đã được gửi thành công",
      refundRequest: {
        RefundID: 2,
        EnrollmentID: 1009,
        Reason: "Muốn đổi lớp",
      },
    });
  });
});

