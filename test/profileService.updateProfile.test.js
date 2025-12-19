jest.mock("../repositories/profileRepository", () => ({
  findAccountById: jest.fn(),
  findInstructorByAccountId: jest.fn(),
  findLearnerByAccountId: jest.fn(),
  findStaffByAccountId: jest.fn(),
  updateAccount: jest.fn(),
  updateInstructor: jest.fn(),
  updateLearner: jest.fn(),
  updateStaff: jest.fn(),
}));

const profileRepository = require("../repositories/profileRepository");
const profileService = require("../services/profileService");

describe("profileService - updateProfile", () => {
  const accountId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - role learner, chỉ cập nhật profile (FullName, DateOfBirth, Job, Address)", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("learner");

    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-learner" });

    const updateData = {
      FullName: "Nguyen Van A",
      DateOfBirth: "2000-01-01",
      Job: "Student",
      Address: "HN",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(profileRepository.updateAccount).not.toHaveBeenCalled();

    expect(profileRepository.updateLearner).toHaveBeenCalledWith(accountId, {
      FullName: "Nguyen Van A",
      DateOfBirth: "2000-01-01",
      Job: "Student",
      Address: "HN",
    });

    expect(profileRepository.updateInstructor).not.toHaveBeenCalled();
    expect(profileRepository.updateStaff).not.toHaveBeenCalled();
    });

    test("UTCID02 - role staff, cập nhật FullName, Phone, Address -> gọi updateAccount và updateStaff", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockResolvedValueOnce("staff");

    jest
      .spyOn(profileService, "getProfileByAccountId")
      .mockResolvedValueOnce({ profile: "updated-staff" });

    const updateData = {
      FullName: "Giao vien N",
      Phone: "0123456789",
      Address: "HN",
    };

    await profileService.updateProfile(accountId, updateData);

    expect(profileRepository.updateAccount).toHaveBeenCalledWith(accountId, {
      Phone: "0123456789",
    });

    expect(profileRepository.updateStaff).toHaveBeenCalledWith(accountId, {
      FullName: "Giao vien N",
      Address: "HN",
    });

    expect(profileRepository.updateLearner).not.toHaveBeenCalled();
    expect(profileRepository.updateInstructor).not.toHaveBeenCalled();
  });

  test("UTCID03 - role instructor, cập nhật các field chung + Major -> gọi updateInstructor với Major", async () => {
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

  test("UTCID04 - DateOfBirth không phải định dạng chuẩn -> formatDateForMySQL trả null, không update DateOfBirth", async () => {
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

  test("UTCID05 - không có field nào hợp lệ để update -> không gọi repository update, vẫn trả về profile", async () => {
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
    expect(profileRepository.updateStaff).not.toHaveBeenCalled();
    expect(getProfileSpy).toHaveBeenCalledWith(accountId);
    expect(result).toEqual({ profile: "no-change" });
  });

  test("UTCID06 - accountId không xác định role (determineRole throw) -> không update, ném lỗi Cannot update profile", async () => {
    jest
      .spyOn(profileService, "determineRole")
      .mockRejectedValueOnce(new Error("Role not found for this account"));

    await expect(
      profileService.updateProfile(accountId, { Username: "Hieu" })
    ).rejects.toThrow("Role not found for this account");

    expect(profileRepository.updateAccount).not.toHaveBeenCalled();
    expect(profileRepository.updateLearner).not.toHaveBeenCalled();
    expect(profileRepository.updateInstructor).not.toHaveBeenCalled();
    expect(profileRepository.updateStaff).not.toHaveBeenCalled();
  });
});