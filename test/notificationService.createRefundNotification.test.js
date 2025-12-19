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
    const mockQuery = jest
      .fn()
      .mockResolvedValueOnce([enrollmentRows])
      .mockResolvedValueOnce([{}]);
    connectDB.mockResolvedValue({ query: mockQuery });
    return mockQuery;
  }

  test("UTCID01 - enrollmentId không tồn tại -> không tạo notification, không throw lỗi", async () => {
    const mockQuery = jest.fn().mockResolvedValueOnce([[]]);
    connectDB.mockResolvedValue({ query: mockQuery });

    await notificationService.createRefundNotification(
      enrollmentId,
      refundId,
      "requested"
    );

    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  test("UTCID02 - enrollment hợp lệ, action = requested", async () => {
    const enrollmentRows = [
      { RefundID: refundId, LearnerAccID: 9, Role: "learner" },
      { RefundID: refundId, LearnerAccID: 1, Role: "admin" },
    ];

    const mockQuery = setupDb(enrollmentRows);

    await notificationService.createRefundNotification(
      enrollmentId,
      refundId,
      "requested"
    );

    const insertCall = mockQuery.mock.calls.find((call) =>
      call[0].includes("INSERT INTO notification")
    );

    expect(insertCall).toBeDefined();

    const insertedValues = insertCall[1][0];

    const learnerNotification = insertedValues.find((row) => row[0] === 9);

    expect(learnerNotification).toEqual([
      9,
      `Yêu cầu hoàn tiền #${refundId} của bạn đã được gửi thành công và đang chờ xử lý.`,
      "refund",
      "unread",
    ]);
  });

  test("UTCID03 - enrollment hợp lệ, action = approved -> tạo notification approved", async () => {
    const selectRows = [
      { RefundID: refundId, LearnerAccID: 17, Role: "learner" },
      { RefundID: refundId, LearnerAccID: 1, Role: "admin" },
      { RefundID: refundId, LearnerAccID: 2, Role: "admin" },
    ];

    const mockQuery = setupDb(selectRows);

    await notificationService.createRefundNotification(
      enrollmentId,
      refundId,
      "approved"
    );

    const insertCall = mockQuery.mock.calls[1];

    expect(insertCall[1]).toEqual([
      [
        [
          17,
          `Yêu cầu hoàn tiền #${refundId} của bạn đã được chấp nhận.`,
          "refund",
          "unread",
        ],
        [
          1,
          `Yêu cầu hoàn tiền #${refundId} đã được phê duyệt.`,
          "refund_admin",
          "unread",
        ],
        [
          2,
          `Yêu cầu hoàn tiền #${refundId} đã được phê duyệt.`,
          "refund_admin",
          "unread",
        ],
      ],
    ]);
  });

  test("UTCID04 - enrollment hợp lệ, action = cancelled -> tạo notification cancelled", async () => {
    const selectRows = [
      { RefundID: refundId, LearnerAccID: 17, Role: "learner" },
      { RefundID: refundId, LearnerAccID: 1, Role: "admin" },
    ];

    const mockQuery = setupDb(selectRows);

    await notificationService.createRefundNotification(
      enrollmentId,
      refundId,
      "cancelled"
    );

    const insertCall = mockQuery.mock.calls[1];

    expect(insertCall[1]).toEqual([
      [
        [
          17,
          `Yêu cầu hoàn tiền #${refundId} của bạn đã được hủy.`,
          "refund",
          "unread",
        ],
        [
          1,
          `Yêu cầu hoàn tiền #${refundId} đã bị hủy bởi học viên.`,
          "refund_admin",
          "unread",
        ],
      ],
    ]);
  });

  test("UTCID05 - enrollment hợp lệ, action = rejected -> tạo notification rejected", async () => {
    const selectRows = [
      { RefundID: refundId, LearnerAccID: 17, Role: "learner" },
      { RefundID: refundId, LearnerAccID: 1, Role: "admin" },
    ];

    const mockQuery = setupDb(selectRows);

    await notificationService.createRefundNotification(
      enrollmentId,
      refundId,
      "rejected"
    );

    const insertCall = mockQuery.mock.calls[1];

    expect(insertCall[1]).toEqual([
      [
        [
          17,
          `Yêu cầu hoàn tiền #${refundId} của bạn đã bị từ chối.`,
          "refund",
          "unread",
        ],
        [
          1,
          `Yêu cầu hoàn tiền #${refundId} đã bị từ chối.`,
          "refund_admin",
          "unread",
        ],
      ],
    ]);
  });
});
