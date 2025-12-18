jest.mock("../config/db", () => jest.fn());

const connectDB = require("../config/db");
const notificationService = require("../services/notificationService");

describe("notificationService - createRefundNotification", () => {
  const enrollmentId = 1;
  const refundId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setupDb(enrollmentRows) {
    const mockQuery = jest.fn().mockResolvedValueOnce([enrollmentRows]).mockResolvedValueOnce([{}]);
    connectDB.mockResolvedValue({ query: mockQuery });
    return mockQuery;
  }

  test("UTCID01 - enrollmentId không tồn tại -> không tạo notification, không throw lỗi", async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce([[]]);
    connectDB.mockResolvedValue({ query: mockQuery });

    await notificationService.createRefundNotification(enrollmentId, refundId, "requested");

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  test("UTCID02 - enrollment hợp lệ, action = requested", async () => {
    const enrollmentRows = [
      { RefundID: refundId, LearnerAccID: 9, Role: 'learner' },
      { RefundID: refundId, LearnerAccID: 1, Role: 'admin' }
    ];

    const mockQuery = setupDb(enrollmentRows);

    await notificationService.createRefundNotification(
      enrollmentId,
      refundId,
      "requested"
    );

    const insertCall = mockQuery.mock.calls.find(call =>
      call[0].includes("INSERT INTO notification")
    );

    expect(insertCall).toBeDefined();

    const insertedValues = insertCall[1][0];

    const learnerNotification = insertedValues.find(row => row[0] === 9);

    expect(learnerNotification).toEqual([
      9,
      `Yêu cầu hoàn tiền #${refundId} của bạn đã được gửi thành công và đang chờ xử lý.`,
      'refund',
      'unread'
    ]);
  });

  test("UTCID03 - enrollment hợp lệ, action = approved -> tạo notification nội dung approved", async () => {
    const enrollmentRows = [{ EnrollmentID: enrollmentId, AccID: 9 }];
    const mockQuery = setupDb(enrollmentRows);

    await notificationService.createRefundNotification(enrollmentId, refundId, "approved");

    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[1]).toEqual([
      9,
      `Yêu cầu hoàn tiền #${refundId} của bạn đã được chấp nhận.`,
    ]);
  });

  test("UTCID04 - enrollment hợp lệ, action = cancelled -> tạo notification nội dung cancelled", async () => {
    const enrollmentRows = [{ EnrollmentID: enrollmentId, AccID: 9 }];
    const mockQuery = setupDb(enrollmentRows);

    await notificationService.createRefundNotification(enrollmentId, refundId, "cancelled");

    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[1]).toEqual([
      9,
      `Yêu cầu hoàn tiền #${refundId} của bạn đã được hủy.`,
    ]);
  });

  test("UTCID05 - enrollment hợp lệ, action = rejected -> tạo notification nội dung rejected", async () => {
    const enrollmentRows = [{ EnrollmentID: enrollmentId, AccID: 9 }];
    const mockQuery = setupDb(enrollmentRows);

    await notificationService.createRefundNotification(enrollmentId, refundId, "rejected");

    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[1]).toEqual([
      9,
      `Yêu cầu hoàn tiền #${refundId} của bạn đã bị từ chối.`,
    ]);
  });
});


