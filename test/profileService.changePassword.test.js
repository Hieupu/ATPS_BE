jest.mock("../repositories/profileRepository", () => ({
  findAccountById: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const profileRepository = require("../repositories/profileRepository");
const bcrypt = require("bcryptjs");
const profileService = require("../services/profileService");

describe("profileService - changePassword", () => {
  const accountId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - account local, currentPassword đúng, newPassword hợp lệ -> cập nhật mật khẩu thành công", async () => {
    profileRepository.findAccountById.mockResolvedValue({
      AccID: accountId,
      Provider: "local",
      Password: "oldHashed",
    });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("newHashed");

    await profileService.changePassword(
      accountId,
      "oldPassword",
      "newPassword"
    );

    expect(bcrypt.compare).toHaveBeenCalledWith("oldPassword", "oldHashed");
    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword", 12);
    expect(profileRepository.updatePassword).toHaveBeenCalledWith(
      accountId,
      "newHashed"
    );
  });

  test("UTCID02 - account local, currentPassword sai -> ném lỗi 'Current password is incorrect', không cập nhật", async () => {
    profileRepository.findAccountById.mockResolvedValue({
      AccID: accountId,
      Provider: "local",
      Password: "oldHashed",
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      profileService.changePassword(accountId, "wrongPassword", "newPassword")
    ).rejects.toThrow("Current password is incorrect");

    expect(profileRepository.updatePassword).not.toHaveBeenCalled();
  });

  test("UTCID03 - account provider != local (google) -> bỏ qua kiểm tra currentPassword, vẫn cập nhật mật khẩu", async () => {
    profileRepository.findAccountById.mockResolvedValue({
      AccID: accountId,
      Provider: "google",
      Password: null,
    });
    bcrypt.hash.mockResolvedValue("newHashed-google");

    await profileService.changePassword(accountId, "anything", "newPassword");
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword", 12);
    expect(profileRepository.updatePassword).toHaveBeenCalledWith(
      accountId,
      "newHashed-google"
    );
  });

  test("UTCID04 - account null (không tồn tại) -> findAccountById trả null, sẽ gây lỗi khi truy cập Provider", async () => {
    profileRepository.findAccountById.mockResolvedValue(null);

    await expect(
      profileService.changePassword(accountId, "oldPassword", "newPassword")
    ).rejects.toThrow();

    expect(profileRepository.updatePassword).not.toHaveBeenCalled();
  });

  test("UTCID05 - account local, currentPassword đúng nhưng updatePassword ném lỗi -> propagate lỗi", async () => {
    profileRepository.findAccountById.mockResolvedValue({
      AccID: accountId,
      Provider: "local",
      Password: "oldHashed",
    });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("newHashed");
    profileRepository.updatePassword.mockRejectedValue(
      new Error("DB update failed")
    );

    await expect(
      profileService.changePassword(accountId, "oldPassword", "newPassword")
    ).rejects.toThrow("DB update failed");
  });

  test("UTCID06 - account local, currentPassword đúng, newPassword trùng với currentPassword vẫn cho phép (hash lại & update)", async () => {
    profileRepository.findAccountById.mockResolvedValue({
      AccID: accountId,
      Provider: "local",
      Password: "oldHashed",
    });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("sameHashed");
    profileRepository.updatePassword.mockResolvedValue();

    await profileService.changePassword(
      accountId,
      "samePassword",
      "samePassword"
    );

    expect(bcrypt.compare).toHaveBeenCalledWith("samePassword", "oldHashed");
    expect(bcrypt.hash).toHaveBeenCalledWith("samePassword", 12);
    expect(profileRepository.updatePassword).toHaveBeenCalledWith(
      accountId,
      "sameHashed"
    );
  });
});
