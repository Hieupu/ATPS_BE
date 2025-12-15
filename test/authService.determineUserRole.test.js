jest.mock("../config/db", () => jest.fn());

const connectDB = require("../config/db");
const { determineUserRole } = require("../services/authService");

describe("authService - determineUserRole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - accountId là instructor -> trả về 'instructor'", async () => {
    const mockQuery = jest
      .fn()
      .mockResolvedValueOnce([[{ InstructorID: 1 }]])
      .mockResolvedValue([[]]);

    connectDB.mockResolvedValue({ query: mockQuery });

    const role = await determineUserRole(1);
    expect(role).toBe("instructor");
  });

  test("UTCID02 - accountId là learner -> trả về 'learner'", async () => {
    const mockQuery = jest
      .fn()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ LearnerID: 2 }]])
      .mockResolvedValue([[]]);

    connectDB.mockResolvedValue({ query: mockQuery });

    const role = await determineUserRole(2);
    expect(role).toBe("learner");
  });

  test("UTCID03 - accountId là admin -> trả về 'admin'", async () => {
    const mockQuery = jest
      .fn()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ AdminID: 4 }]]);

    connectDB.mockResolvedValue({ query: mockQuery });

    const role = await determineUserRole(4);
    expect(role).toBe("admin");
  });

  test("UTCID04 - không phải instructor, learner, admin -> trả về 'unknown'", async () => {
    const mockQuery = jest
      .fn()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    connectDB.mockResolvedValue({ query: mockQuery });

    const role = await determineUserRole(5);
    expect(role).toBe("unknown");
  });
});
