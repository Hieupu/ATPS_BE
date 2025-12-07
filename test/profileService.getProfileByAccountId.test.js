jest.mock("../repositories/profileRepository", () => ({
  findAccountById: jest.fn(),
  findInstructorByAccountId: jest.fn(),
  findLearnerByAccountId: jest.fn(),
  findParentByAccountId: jest.fn(),
}));

const profileRepository = require("../repositories/profileRepository");
const profileService = require("../services/profileService");

describe("profileService - getProfileByAccountId", () => {
  const baseAccount = {
    AccID: 1,
    Username: "john",
    Email: "john@example.com",
    Phone: "0123456789",
    Gender: "M",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - account tồn tại, role instructor, có dữ liệu instructor -> trả về profile đầy đủ", async () => {
    profileRepository.findAccountById.mockResolvedValue(baseAccount);

    profileRepository.findInstructorByAccountId
      .mockResolvedValueOnce({ InstructorID: 10 })
      .mockResolvedValueOnce({ instructorProfile: { field: "value" } });

    profileRepository.findLearnerByAccountId.mockResolvedValue(null);
    profileRepository.findParentByAccountId.mockResolvedValue(null);

    const result = await profileService.getProfileByAccountId(1);

    expect(result).toEqual({
      account: {
        AccID: 1,
        Username: "john",
        Email: "john@example.com",
        Phone: "0123456789",
        Gender: "M",
        Role: "instructor",
      },
      instructorProfile: { field: "value" },
    });
  });

  test("UTCID02 - account tồn tại, role learner, có dữ liệu learner -> trả về profile đầy đủ", async () => {
    profileRepository.findAccountById.mockResolvedValue(baseAccount);

    profileRepository.findInstructorByAccountId.mockResolvedValue(null);
    profileRepository.findLearnerByAccountId
      .mockResolvedValueOnce({ LearnerID: 20 })
      .mockResolvedValueOnce({ learnerProfile: { field: "value" } });
    profileRepository.findParentByAccountId.mockResolvedValue(null);

    const result = await profileService.getProfileByAccountId(1);

    expect(result).toEqual({
      account: {
        AccID: 1,
        Username: "john",
        Email: "john@example.com",
        Phone: "0123456789",
        Gender: "M",
        Role: "learner",
      },
      learnerProfile: { field: "value" },
    });
  });

  test("UTCID03 - account tồn tại, role parent, có dữ liệu parent -> trả về profile đầy đủ", async () => {
    profileRepository.findAccountById.mockResolvedValue(baseAccount);

    profileRepository.findInstructorByAccountId.mockResolvedValue(null);
    profileRepository.findLearnerByAccountId.mockResolvedValue(null);
    profileRepository.findParentByAccountId
      .mockResolvedValueOnce({ ParentID: 30 })
      .mockResolvedValueOnce({ parentProfile: { field: "value" } });

    const result = await profileService.getProfileByAccountId(1);

    expect(result).toEqual({
      account: {
        AccID: 1,
        Username: "john",
        Email: "john@example.com",
        Phone: "0123456789",
        Gender: "M",
        Role: "parent",
      },
      parentProfile: { field: "value" },
    });
  });

  test("UTCID04 - account instructor nhưng không có dữ liệu instructor (chỉ account + role)", async () => {
    profileRepository.findAccountById.mockResolvedValue(baseAccount);

    profileRepository.findInstructorByAccountId
      .mockResolvedValueOnce({ InstructorID: 10 })
      .mockResolvedValueOnce({});
    profileRepository.findLearnerByAccountId.mockResolvedValue(null);
    profileRepository.findParentByAccountId.mockResolvedValue(null);

    const result = await profileService.getProfileByAccountId(1);

    expect(result).toEqual({
      account: {
        AccID: 1,
        Username: "john",
        Email: "john@example.com",
        Phone: "0123456789",
        Gender: "M",
        Role: "instructor",
      },
    });
  });

  test("UTCID05 - account learner nhưng không có dữ liệu learner (chỉ account + role)", async () => {
    profileRepository.findAccountById.mockResolvedValue(baseAccount);

    profileRepository.findInstructorByAccountId.mockResolvedValue(null);
    profileRepository.findLearnerByAccountId
      .mockResolvedValueOnce({ LearnerID: 20 })
      .mockResolvedValueOnce({});
    profileRepository.findParentByAccountId.mockResolvedValue(null);

    const result = await profileService.getProfileByAccountId(1);

    expect(result).toEqual({
      account: {
        AccID: 1,
        Username: "john",
        Email: "john@example.com",
        Phone: "0123456789",
        Gender: "M",
        Role: "learner",
      },
    });
  });

  test("UTCID06 - account parent nhưng không có dữ liệu parent (chỉ account + role)", async () => {
    profileRepository.findAccountById.mockResolvedValue(baseAccount);

    profileRepository.findInstructorByAccountId.mockResolvedValue(null);
    profileRepository.findLearnerByAccountId.mockResolvedValue(null);
    profileRepository.findParentByAccountId
      .mockResolvedValueOnce({ ParentID: 30 })
      .mockResolvedValueOnce({});

    const result = await profileService.getProfileByAccountId(1);

    expect(result).toEqual({
      account: {
        AccID: 1,
        Username: "john",
        Email: "john@example.com",
        Phone: "0123456789",
        Gender: "M",
        Role: "parent",
      },
    });
  });

  test("UTCID07 - account không tồn tại -> ném lỗi 'Account not found'", async () => {
    profileRepository.findAccountById.mockResolvedValue(null);

    await expect(profileService.getProfileByAccountId(999)).rejects.toThrow(
      "Account not found"
    );
  });

  test("UTCID08 - account tồn tại nhưng không thuộc instructor/learner/parent -> ném lỗi role", async () => {
    profileRepository.findAccountById.mockResolvedValue(baseAccount);

    profileRepository.findInstructorByAccountId.mockResolvedValue(null);
    profileRepository.findLearnerByAccountId.mockResolvedValue(null);
    profileRepository.findParentByAccountId.mockResolvedValue(null);

    await expect(profileService.getProfileByAccountId(1)).rejects.toThrow(
      "Role not found for this account"
    );
  });
});
