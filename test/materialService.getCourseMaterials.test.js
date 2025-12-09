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
      { CourseID: 21, MaterialID: 12, FileURL: "a.pdf", Status: "VISIBLE", Title: "Bài giảng Speaking IELTS 5.5 – 6.5",  FileURL: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample_pdf.pdf",},
    ]);

    const result = await materialService.getCourseMaterials(21);
    
    expect(materialRepository.getCourseMaterials).toHaveBeenCalledWith(21);
    expect(result).toEqual([
      {
      CourseID: 21,
      FileURL: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample_pdf.pdf",
      MaterialID: 12,
      Status: "VISIBLE",
      Title: "Bài giảng Speaking IELTS 5.5 – 6.5",
      canDownload: true,
      fileType: "pdf",
      FileType: "PDF",
      Description: 'Tài liệu học tập', 
      FileSize:  null, 
      UploadDate:  null, 
      canDownload: true,
    }
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


