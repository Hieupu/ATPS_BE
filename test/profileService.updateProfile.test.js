jest.mock("../repositories/profileRepository", () => ({
  findAccountById: jest.fn(),
  findInstructorByAccountId: jest.fn(),
  findLearnerByAccountId: jest.fn(),
  findParentByAccountId: jest.fn(),
  updateAccount: jest.fn(),
  updateInstructor: jest.fn(),
  updateLearner: jest.fn(),
  updateParent: jest.fn(),
}));

const profileRepository = require("../repositories/profileRepository");
const profileService = require("../services/profileService");

describe("profileService - updateProfile", () => {
  const accountId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - role learner, cập nhật Username + Phone + Gender -> gọi updateAccount và updateLearner, trả về profile mới", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-learner" });

    const updateData = {
      Username: "Hieu",
      Phone: "0395487742",
      Gender: "Male",
      FullName: "Tran Van Hieu",
      Address: "HN",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(profileRepository.updateAccount).toHaveBeenCalledWith(accountId, {
      Username: "Hieu",
      Phone: "0395487742",
      Gender: "Male",
    });
    expect(profileRepository.updateLearner).toHaveBeenCalledWith(accountId, {
      FullName: "Tran Van Hieu",
      Address: "HN",
    });
    expect(profileRepository.updateInstructor).not.toHaveBeenCalled();
    expect(profileRepository.updateParent).not.toHaveBeenCalled();
  });

  test("UTCID02 - role learner, chỉ cập nhật profile (FullName, DateOfBirth, Job, Address) -> không cập nhật account", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-learner-2" });

    const spyGenerate = jest.spyOn(profileService, "generateUsername");

    const updateData = {
      FullName: "Nguyen Van A",
      DateOfBirth: "2000-01-01",
      Job: "Student",
      Address: "HN",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(spyGenerate).toHaveBeenCalledWith("Nguyen Van A");
    const generated = spyGenerate.mock.results[0].value;

    expect(profileRepository.updateAccount).toHaveBeenCalledWith(accountId, {
      Username: generated,
    });
    expect(profileRepository.updateLearner).toHaveBeenCalledWith(accountId, {
      FullName: "Nguyen Van A",
      DateOfBirth: "2000-01-01",
      Job: "Student",
      Address: "HN",
    });
  });

  test("UTCID03 - role parent, cập nhật FullName, Phone, Address -> gọi updateAccount và updateParent", async () => {
    jest.spyOn(profileService, "determineRole").mockResolvedValueOnce("parent");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-parent" });

    const updateData = {
      FullName: "Giao vien N",
      Phone: "0123456789",
      Address: "HN",
    };

    const spyGenerate = jest.spyOn(profileService, "generateUsername");

    await profileService.updateProfile(accountId, updateData);

    expect(spyGenerate).toHaveBeenCalledWith("Giao vien N");
    const generated = spyGenerate.mock.results[0].value;

    expect(profileRepository.updateAccount).toHaveBeenCalledWith(accountId, {
      Phone: "0123456789",
      Username: generated,
    });
    expect(profileRepository.updateParent).toHaveBeenCalledWith(accountId, {
      FullName: "Giao vien N",
      Address: "HN",
    });
    expect(profileRepository.updateLearner).not.toHaveBeenCalled();
    expect(profileRepository.updateInstructor).not.toHaveBeenCalled();
  });

  test("UTCID04 - role instructor, cập nhật các field chung + Major -> gọi updateInstructor với Major", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("instructor");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-instructor" });

    const updateData = {
      FullName: "Nguyen Van A",
      Major: "CNTT",
      Address: "HN",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(profileRepository.updateInstructor).toHaveBeenCalledWith(accountId, {
      FullName: "Nguyen Van A",
      Address: "HN",
      Major: "CNTT",
    });
  });

  test("UTCID05 - có FullName nhưng không truyền Username -> generateUsername cho Username và updateAccount", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-username" });

    const spyGenerate = jest.spyOn(profileService, "generateUsername");

    const updateData = {
      FullName: "Tran Van Hieu",
      Phone: "0395487742",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(spyGenerate).toHaveBeenCalledWith("Tran Van Hieu");
    const generated = spyGenerate.mock.results[0].value;

    expect(profileRepository.updateAccount).toHaveBeenCalledWith(accountId, {
      Phone: "0395487742",
      Username: generated,
    });
  });

  test("UTCID06 - truyền cả FullName và Username -> không auto-generate Username", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-no-auto-username" });

    const spyGenerate = jest.spyOn(profileService, "generateUsername");

    const updateData = {
      FullName: "Tran Van Hieu",
      Username: "customUser",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(spyGenerate).not.toHaveBeenCalled();
    expect(profileRepository.updateAccount).toHaveBeenCalledWith(accountId, {
      Username: "customUser",
    });
  });

  test("UTCID07 - DateOfBirth không phải định dạng chuẩn -> formatDateForMySQL trả null, không update DateOfBirth", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-date" });

    const spyFormat = jest.spyOn(profileService, "formatDateForMySQL");

    const updateData = {
      FullName: "Nguyen Van A",
      DateOfBirth: "invalid-date",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(spyFormat).toHaveBeenCalledWith("invalid-date");
    expect(profileRepository.updateLearner).toHaveBeenCalledWith(accountId, {
      FullName: "Nguyen Van A",
      DateOfBirth: null,
    });
  });

  test("UTCID08 - không có field nào hợp lệ để update -> không gọi repository update, vẫn trả về profile", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");
    const getProfileSpy = jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "no-change" });

    const updateData = {};

    const result = await profileService.updateProfile(accountId, updateData);

    expect(profileRepository.updateAccount).not.toHaveBeenCalled();
    expect(profileRepository.updateLearner).not.toHaveBeenCalled();
    expect(profileRepository.updateInstructor).not.toHaveBeenCalled();
    expect(profileRepository.updateParent).not.toHaveBeenCalled();
    expect(getProfileSpy).toHaveBeenCalledWith(accountId);
    expect(result).toEqual({ profile: "no-change" });
  });

  test("UTCID09 - accountId không xác định role (determineRole throw) -> không update, ném lỗi Cannot update profile", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockRejectedValueOnce(new Error("Role not found for this account"));

    await expect(
      profileService.updateProfile(accountId, { Username: "Hieu" })
    ).rejects.toThrow("Role not found for this account");

    expect(profileRepository.updateAccount).not.toHaveBeenCalled();
    expect(profileRepository.updateLearner).not.toHaveBeenCalled();
    expect(profileRepository.updateInstructor).not.toHaveBeenCalled();
    expect(profileRepository.updateParent).not.toHaveBeenCalled();
  });

  test("UTCID10 - role parent, cập nhật Gender + DateOfBirth + Address -> account + parent cùng được update", async () => {
    jest.spyOn(profileService, "determineRole").mockResolvedValueOnce("parent");
    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-parent-2" });

    const updateData = {
      Gender: "Female",
      DateOfBirth: "2000-01-01T10:00:00Z",
      Address: "HN",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(profileRepository.updateAccount).toHaveBeenCalledWith(accountId, {
      Gender: "Female",
    });
    expect(profileRepository.updateParent).toHaveBeenCalledWith(accountId, {
      DateOfBirth: "2000-01-01",
      Address: "HN",
      FullName: undefined,
      Job: undefined,
    });
  });
});
