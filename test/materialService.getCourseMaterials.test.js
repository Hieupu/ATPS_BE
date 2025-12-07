jest.mock("../repositories/materialRepository", () => ({
  getCourseMaterials: jest.fn(),
}));

const materialRepository = require("../repositories/materialRepository");
const materialService = require("../services/materialService");

describe("materialService - getCourseMaterials", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - repo trả [] -> service trả []", async () => {
    materialRepository.getCourseMaterials.mockResolvedValue([]);

    const result = await materialService.getCourseMaterials(10);

    expect(materialRepository.getCourseMaterials).toHaveBeenCalledWith(10);
    expect(result).toEqual([]);
  });

  test("UTCID02 - repo trả 1 material -> service format thêm fileType và canDownload", async () => {
    materialRepository.getCourseMaterials.mockResolvedValue([
      { MaterialID: 1, FileURL: "a.pdf" },
    ]);

    const result = await materialService.getCourseMaterials(1);

    expect(materialRepository.getCourseMaterials).toHaveBeenCalledWith(1);
    expect(result).toEqual([
      {
        MaterialID: 1,
        FileURL: "a.pdf",
        fileType: "PDF",
        canDownload: true,
      },
    ]);
  });

  test("UTCID03 - repo ném lỗi -> service log error và ném lại", async () => {
    const error = new Error("DB error");
    materialRepository.getCourseMaterials.mockRejectedValue(error);

    await expect(materialService.getCourseMaterials(1)).rejects.toThrow(
      "DB error"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});


