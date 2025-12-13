jest.mock("../repositories/accountRepository", () => ({
  findAccountByEmail: jest.fn(),
}));

jest.mock("../repositories/instructorRepository", () => ({
  getInstructorById: jest.fn(),
}));

jest.mock("../repositories/instructorCourseRepository", () => ({
  findInstructorIdByAccountId: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

jest.mock("../config/db", () =>
  jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([[], []]),
  })
);

const accountRepository = require("../repositories/accountRepository");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { loginService } = require("../services/authService");

describe("authService - loginService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - user không tồn tại -> báo lỗi Email hoặc mật khẩu không chính xác", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue(null);
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      loginService("a@gmail.com", "123456", "local", false)
    ).rejects.toThrow("Email hoặc mật khẩu không chính xác");
  });

  test("UTCID02 - tài khoản Google nhưng đăng nhập bằng local -> chỉ có thể đăng nhập qua Google", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue({
      AccID: 1,
      Email: "a@gmail.com",
      Username: "John",
      Password: null,
      Provider: "Google",
    });

    await expect(
      loginService("a@gmail.com", "123456", "local", false)
    ).rejects.toThrow("Tài khoản này chỉ có thể đăng nhập qua Google");
  });

  test("UTCID03 - tài khoản local nhưng đăng nhập bằng Google -> yêu cầu đăng nhập bằng mật khẩu", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue({
      AccID: 2,
      Email: "a@gmail.com",
      Username: "John",
      Password: "hashed",
      Provider: "local",
    });

    await expect(
      loginService("a@gmail.com", undefined, "google", false)
    ).rejects.toThrow("Tài khoản này yêu cầu đăng nhập bằng mật khẩu");
  });

  test("UTCID04 - đăng nhập local với mật khẩu sai -> Email hoặc mật khẩu không chính xác", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue({
      AccID: 3,
      Email: "a@gmail.com",
      Username: "John",
      Password: "hashed",
      Provider: "local",
    });

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      loginService("a@gmail.com", "sai-mat-khau", "local", false)
    ).rejects.toThrow("Email hoặc mật khẩu không chính xác");
  });

  test("UTCID05 - đăng nhập local nhưng không truyền mật khẩu -> yêu cầu nhập mật khẩu", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue({
      AccID: 4,
      Email: "a@gmail.com",
      Username: "John",
      Password: "hashed",
      Provider: "local",
    });

    await expect(
      loginService("a@gmail.com", undefined, "local", false)
    ).rejects.toThrow("Vui lòng nhập mật khẩu");
  });

  test("UTCID06 - đăng nhập local thành công -> trả về token, expiresIn và user", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue({
      AccID: 5,
      Email: "a@gmail.com",
      Username: "John",
      Password: "hashed",
      Provider: "local",
      Status: "active",
    });

    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("fake-jwt-token");

    const result = await loginService("a@gmail.com", "123456", "local", false);

    expect(jwt.sign).toHaveBeenCalledWith(
      {
        id: 5,
        email: "a@gmail.com",
        Username: "John",
        role: "unknown",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    expect(result).toEqual({
      token: "fake-jwt-token",
      expiresIn: 3600,
      user: {
        id: 5,
        email: "a@gmail.com",
        username: "John",
        role: "unknown",
        ProfilePicture: null,
      },
    });
  });
});
