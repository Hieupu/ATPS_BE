jest.mock("../repositories/materialRepository", () => ({
  updateMaterial: jest.fn(),
}));

const materialRepository = require("../repositories/materialRepository");
const materialService = require("../services/materialService");

describe("materialService - updateMaterial", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - materialId = 10, dữ liệu hợp lệ (Title, FileURL) -> repo updateMaterial trả object đã cập nhật", async () => {
    const materialId = 10;
    const data = {
      Title: "New",
      FileURL: "new.pdf",
    };
    const updated = {
      MaterialID: materialId,
      Title: "New",
      FileURL: "new.pdf",
    };
    materialRepository.updateMaterial.mockResolvedValue(updated);

    const result = await materialService.updateMaterial(materialId, data);

    expect(materialRepository.updateMaterial).toHaveBeenCalledWith(
      materialId,
      data
    );
    expect(result).toEqual(updated);
  });

  test("UTCID02 - materialId = 3, dữ liệu bất kỳ -> repo trả object tương ứng", async () => {
    const materialId = 3;
    const data = {
      Title: "Another",
    };
    const updated = {
      MaterialID: materialId,
      Title: "Another",
    };
    materialRepository.updateMaterial.mockResolvedValue(updated);

    const result = await materialService.updateMaterial(materialId, data);

    expect(materialRepository.updateMaterial).toHaveBeenCalledWith(
      materialId,
      data
    );
    expect(result).toEqual(updated);
  });

  test("UTCID03 - materialId = null, repo vẫn xử lý và trả object -> service trả kết quả đó", async () => {
    const materialId = null;
    const data = {
      Title: "New",
    };
    const updated = {
      MaterialID: null,
      Title: "New",
    };
    materialRepository.updateMaterial.mockResolvedValue(updated);

    const result = await materialService.updateMaterial(materialId, data);

    expect(materialRepository.updateMaterial).toHaveBeenCalledWith(
      materialId,
      data
    );
    expect(result).toEqual(updated);
  });

  test("UTCID04 - repo ném lỗi -> service log error và ném lại", async () => {
    const error = new Error("DB error");
    materialRepository.updateMaterial.mockRejectedValue(error);

    await expect(
      materialService.updateMaterial(1, { Title: "X" })
    ).rejects.toThrow("DB error");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});


