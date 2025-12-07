jest.mock("../repositories/materialRepository", () => ({
  createMaterial: jest.fn(),
}));

const materialRepository = require("../repositories/materialRepository");
const materialService = require("../services/materialService");

describe("materialService - createMaterial", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - dữ liệu hợp lệ (đủ Title, FileURL, CourseID) -> repo createMaterial được gọi và trả về material", async () => {
    const input = {
      Title: "X",
      FileURL: "url.pdf",
      CourseID: 1,
    };
    materialRepository.createMaterial.mockResolvedValue({
      MaterialID: 10,
      ...input,
    });

    const result = await materialService.createMaterial(input);

    expect(materialRepository.createMaterial).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      MaterialID: 10,
      Title: "X",
      FileURL: "url.pdf",
      CourseID: 1,
    });
  });

  test("UTCID02 - thiếu Title -> ném Error 'Thiếu thông tin bắt buộc'", async () => {
    const input = {
      FileURL: "url.pdf",
      CourseID: 1,
    };

    await expect(materialService.createMaterial(input)).rejects.toThrow(
      "Thiếu thông tin bắt buộc"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(materialRepository.createMaterial).not.toHaveBeenCalled();
  });

  test("UTCID03 - thiếu FileURL -> ném Error 'Thiếu thông tin bắt buộc'", async () => {
    const input = {
      Title: "X",
      CourseID: 1,
    };

    await expect(materialService.createMaterial(input)).rejects.toThrow(
      "Thiếu thông tin bắt buộc"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(materialRepository.createMaterial).not.toHaveBeenCalled();
  });

  test("UTCID04 - thiếu CourseID -> ném Error 'Thiếu thông tin bắt buộc'", async () => {
    const input = {
      Title: "X",
      FileURL: "url.pdf",
    };

    await expect(materialService.createMaterial(input)).rejects.toThrow(
      "Thiếu thông tin bắt buộc"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(materialRepository.createMaterial).not.toHaveBeenCalled();
  });
});


