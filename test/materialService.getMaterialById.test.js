jest.mock("../repositories/materialRepository", () => ({
  getMaterialById: jest.fn(),
}));

const materialRepository = require("../repositories/materialRepository");
const materialService = require("../services/materialService");

describe("materialService - getMaterialById", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - material không tồn tại (repo trả null) -> ném Error 'Material not found'", async () => {
    materialRepository.getMaterialById.mockResolvedValue(null);

    await expect(materialService.getMaterialById(10)).rejects.toThrow(
      "Material not found"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("UTCID02 - material tồn tại, FileURL = 'file.unknown' -> fileType 'File', canDownload true, canView false", async () => {
    materialRepository.getMaterialById.mockResolvedValue({
      MaterialID: 10,
      Title: "Doc",
      FileURL: "file.unknown",
    });

    const result = await materialService.getMaterialById(10);

    expect(result).toEqual({
      MaterialID: 10,
      Title: "Doc",
      FileURL: "file.unknown",
      fileType: "File",
      canDownload: true,
      canView: false,
    });
  });

  test("UTCID03 - material tồn tại, FileURL = 'file.pdf' -> fileType 'PDF', canDownload true, canView true", async () => {
    materialRepository.getMaterialById.mockResolvedValue({
      MaterialID: 10,
      Title: "Doc",
      FileURL: "file.pdf",
    });

    const result = await materialService.getMaterialById(10);

    expect(result).toEqual({
      MaterialID: 10,
      Title: "Doc",
      FileURL: "file.pdf",
      fileType: "PDF",
      canDownload: true,
      canView: true,
    });
  });

  test("UTCID04 - material tồn tại, FileURL rỗng -> fileType 'File', canDownload true, canView false", async () => {
    materialRepository.getMaterialById.mockResolvedValue({
      MaterialID: 10,
      Title: "Doc",
      FileURL: "",
    });

    const result = await materialService.getMaterialById(10);

    expect(result).toEqual({
      MaterialID: 10,
      Title: "Doc",
      FileURL: "",
      fileType: "File",
      canDownload: true,
      canView: false,
    });
  });

  test("UTCID05 - repo ném lỗi -> service log error và ném lại", async () => {
    const error = new Error("DB error");
    materialRepository.getMaterialById.mockRejectedValue(error);

    await expect(materialService.getMaterialById(10)).rejects.toThrow(
      "DB error"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});


