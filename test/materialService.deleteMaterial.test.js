jest.mock("../repositories/materialRepository", () => ({
  deleteMaterial: jest.fn(),
}));

const materialRepository = require("../repositories/materialRepository");
const materialService = require("../services/materialService");

describe("materialService - deleteMaterial", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - materialId = 1, repo xóa thành công -> trả 'Deleted successfully'", async () => {
    materialRepository.deleteMaterial.mockResolvedValue({
      message: "Deleted successfully",
    });

    const result = await materialService.deleteMaterial(1);

    expect(materialRepository.deleteMaterial).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: "Deleted successfully" });
  });

  test("UTCID02 - materialId = 2, repo xóa thành công -> trả đối tượng repo trả về", async () => {
    materialRepository.deleteMaterial.mockResolvedValue({
      message: "Deleted successfully",
      id: 2,
    });

    const result = await materialService.deleteMaterial(2);

    expect(materialRepository.deleteMaterial).toHaveBeenCalledWith(2);
    expect(result).toEqual({ message: "Deleted successfully", id: 2 });
  });

  test("UTCID03 - materialId = null, repo vẫn xóa và trả kết quả -> service trả nguyên kết quả đó", async () => {
    materialRepository.deleteMaterial.mockResolvedValue({
      message: "Deleted successfully",
      id: null,
    });

    const result = await materialService.deleteMaterial(null);

    expect(materialRepository.deleteMaterial).toHaveBeenCalledWith(null);
    expect(result).toEqual({ message: "Deleted successfully", id: null });
  });

  test("UTCID04 - repo ném lỗi -> service log error và ném lại", async () => {
    const error = new Error("DB error");
    materialRepository.deleteMaterial.mockRejectedValue(error);

    await expect(materialService.deleteMaterial(1)).rejects.toThrow("DB error");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});


