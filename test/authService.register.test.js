jest.mock("../repositories/accountRepository", () => ({
  findAccountByEmail: jest.fn(),
  createAccount: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const accountRepository = require("../repositories/accountRepository");
const bcrypt = require("bcryptjs");
const { registerService } = require("../services/authService");

describe("authService - registerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - throw lỗi khi thiếu username", async () => {
    await expect(
      registerService({
        username: "",
        email: "a@gmail.com",
        password: "abc123",
      })
    ).rejects.toThrow(
      "Please enter complete information: username, email, password!"
    );
  });

  test("UTCID02 - throw lỗi khi thiếu email", async () => {
    await expect(
      registerService({
        username: "John",
        email: "",
        password: "abc123",
      })
    ).rejects.toThrow(
      "Please enter complete information: username, email, password!"
    );
  });

  test("UTCID03 - throw lỗi khi thiếu password", async () => {
    await expect(
      registerService({
        username: "John",
        email: "a@gmail.com",
        password: "",
      })
    ).rejects.toThrow(
      "Please enter complete information: username, email, password!"
    );
  });

  test("UTCID04 - throw lỗi khi email không đúng format", async () => {
    await expect(
      registerService({
        username: "John",
        email: "abc@",
        password: "abc123",
      })
    ).rejects.toThrow("Invalid email!");
  });

  test("UTCID05 - throw lỗi khi password không đạt yêu cầu (ít nhất 6 ký tự, gồm chữ và số)", async () => {
    await expect(
      registerService({
        username: "John",
        email: "a@gmail.com",
        password: "ac",
      })
    ).rejects.toThrow(
      "Password must be at least 6 characters, including letters and numbers!"
    );
  });

  test("UTCID06 - throw lỗi khi phone không hợp lệ (không phải 9-11 chữ số)", async () => {
    await expect(
      registerService({
        username: "John",
        email: "a@gmail.com",
        phone: "123",
        password: "abc123",
      })
    ).rejects.toThrow("Invalid phone number (9–11 digits only)!");
  });

  test("UTCID07 - throw lỗi khi email đã tồn tại", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue({
      AccID: 1,
      Email: "john@gmail.com",
    });

    await expect(
      registerService({
        username: "John",
        email: "john@gmail.com",
        password: "abc123",
      })
    ).rejects.toThrow("Email has been registered!");

    expect(accountRepository.findAccountByEmail).toHaveBeenCalledWith(
      "john@gmail.com"
    );
  });

  test("UTCID08 - đăng ký thành công với dữ liệu hợp lệ, hash password và tạo account", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedPassword");
    accountRepository.createAccount.mockResolvedValue(123);

    const result = await registerService({
      username: "John",
      email: "USER@DOMAIN.COM",
      phone: "0987654321",
      password: "abc123",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("abc123", 10);
    expect(accountRepository.createAccount).toHaveBeenCalledWith({
      username: "John",
      email: "user@domain.com",
      phone: "0987654321",
      password: "hashedPassword",
      provider: "local",
    });
    expect(result).toEqual({ id: 123 });
  });

  test("UTCID09 - đăng ký thành công với email thường (không cần normalize đặc biệt)", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedPassword-2");
    accountRepository.createAccount.mockResolvedValue(124);

    const result = await registerService({
      username: "John",
      email: "a@gmail.com",
      phone: "0987654321",
      password: "abc123",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("abc123", 10);
    expect(accountRepository.createAccount).toHaveBeenCalledWith({
      username: "John",
      email: "a@gmail.com",
      phone: "0987654321",
      password: "hashedPassword-2",
      provider: "local",
    });
    expect(result).toEqual({ id: 124 });
  });

  test("UTCID00 - khi không truyền phone thì tạo account với phone rỗng", async () => {
    accountRepository.findAccountByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedPassword");
    accountRepository.createAccount.mockResolvedValue(5);

    const result = await registerService({
      username: "John",
      email: "a@gmail.com",
      password: "abc123",
    });

    expect(accountRepository.createAccount).toHaveBeenCalledWith({
      username: "John",
      email: "a@gmail.com",
      phone: "",
      password: "hashedPassword",
      provider: "local",
    });
    expect(result).toEqual({ id: 5 });
  });
});
