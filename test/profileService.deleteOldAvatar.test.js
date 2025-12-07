jest.mock("../config/cloudinary", () => ({
  uploader: {
    destroy: jest.fn(),
  },
}));

const cloudinary = require("../config/cloudinary");
const profileService = require("../services/profileService");

describe("profileService - deleteOldAvatar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - avatarUrl = null -> không gọi cloudinary.uploader.destroy, không lỗi", async () => {
    await profileService.deleteOldAvatar(null);

    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  test("UTCID02 - avatarUrl hợp lệ của Cloudinary -> gọi destroy với đúng publicId", async () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v123/avatars/abc123.webp";

    await profileService.deleteOldAvatar(url);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      "avatars/abc123"
    );
  });

  test("UTCID03 - cloudinary.destroy ném lỗi -> hàm không throw, chỉ log lỗi", async () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v123/avatars/err123.webp";
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    cloudinary.uploader.destroy.mockRejectedValueOnce(
      new Error("Cloudinary delete failed")
    );

    await profileService.deleteOldAvatar(url);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});


