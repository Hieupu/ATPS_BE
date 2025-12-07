jest.mock("../repositories/profileRepository", () => ({
  findAccountById: jest.fn(),
  findInstructorByAccountId: jest.fn(),
  findLearnerByAccountId: jest.fn(),
  findParentByAccountId: jest.fn(),
  updateInstructorAvatar: jest.fn(),
  updateLearnerAvatar: jest.fn(),
  updateParentAvatar: jest.fn(),
}));

jest.mock("../config/cloudinary", () => ({
  uploader: {
    upload: jest.fn(),
  },
}));

const profileRepository = require("../repositories/profileRepository");
const cloudinary = require("../config/cloudinary");
const profileService = require("../services/profileService");

describe("profileService - uploadAvatar", () => {
  const accountId = 1;

  const baseFile = {
    mimetype: "image/png",
    buffer: Buffer.from("fake-image"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockRole(role) {
    jest.spyOn(profileService, "determineRole").mockResolvedValueOnce(role);
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: `updated-${role}` });
  }

  test("UTCID01 - valid file, role instructor -> upload thành công, cập nhật avatar instructor và trả về profile mới", async () => {
    mockRole("instructor");
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "https://cdn.test/avatar-instructor.webp",
    });

    const result = await profileService.uploadAvatar(baseFile, accountId);

    expect(cloudinary.uploader.upload).toHaveBeenCalled();
    expect(profileRepository.updateInstructorAvatar).toHaveBeenCalledWith(
      accountId,
      "https://cdn.test/avatar-instructor.webp"
    );
    expect(profileRepository.updateLearnerAvatar).not.toHaveBeenCalled();
    expect(profileRepository.updateParentAvatar).not.toHaveBeenCalled();
    expect(result).toEqual({ profile: "updated-instructor" });
  });

  test("UTCID02 - valid file, role learner -> upload thành công, cập nhật avatar learner", async () => {
    mockRole("learner");
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "https://cdn.test/avatar-learner.webp",
    });

    const result = await profileService.uploadAvatar(baseFile, accountId);

    expect(profileRepository.updateLearnerAvatar).toHaveBeenCalledWith(
      accountId,
      "https://cdn.test/avatar-learner.webp"
    );
    expect(result).toEqual({ profile: "updated-learner" });
  });

  test("UTCID03 - valid file, role parent -> upload thành công, cập nhật avatar parent", async () => {
    mockRole("parent");
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "https://cdn.test/avatar-parent.webp",
    });

    const result = await profileService.uploadAvatar(baseFile, accountId);

    expect(profileRepository.updateParentAvatar).toHaveBeenCalledWith(
      accountId,
      "https://cdn.test/avatar-parent.webp"
    );
    expect(result).toEqual({ profile: "updated-parent" });
  });

  test("UTCID04 - Cloudinary upload lỗi -> ném lỗi 'Upload avatar failed'", async () => {
    mockRole("learner");
    cloudinary.uploader.upload.mockRejectedValue(new Error("Cloudinary error"));

    await expect(
      profileService.uploadAvatar(baseFile, accountId)
    ).rejects.toThrow("Upload avatar failed: Cloudinary error");

    expect(profileRepository.updateLearnerAvatar).not.toHaveBeenCalled();
    expect(profileRepository.updateInstructorAvatar).not.toHaveBeenCalled();
    expect(profileRepository.updateParentAvatar).not.toHaveBeenCalled();
  });

  test("UTCID05 - file không hợp lệ (thiếu buffer) -> Cloudinary ném lỗi, hàm ném lỗi chung", async () => {
    mockRole("learner");
    const invalidFile = { mimetype: "image/png", buffer: null };

    await expect(
      profileService.uploadAvatar(invalidFile, accountId)
    ).rejects.toThrow("Upload avatar failed:");
  });

  test("UTCID06 - determineRole ném lỗi -> không gọi Cloudinary, ném lỗi ra ngoài", async () => {
    mockRole("learner");
    cloudinary.uploader.upload.mockRejectedValue(new Error("Timeout error"));

    await expect(
      profileService.uploadAvatar(baseFile, accountId)
    ).rejects.toThrow("Upload avatar failed: Timeout error");
  });

  test("UTCID07 - valid file, role learner khác accountId -> vẫn upload thành công và cập nhật avatar", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: "https://cdn.test/avatar-learner-2.webp",
    });
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-learner-2" });

    const result = await profileService.uploadAvatar(baseFile, 2);

    expect(profileRepository.updateLearnerAvatar).toHaveBeenCalledWith(
      2,
      "https://cdn.test/avatar-learner-2.webp"
    );
    expect(result).toBeDefined();
  });
});
