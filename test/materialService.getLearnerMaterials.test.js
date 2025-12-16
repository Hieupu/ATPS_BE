jest.mock("../repositories/materialRepository", () => ({
  getLearnerMaterials: jest.fn(),
}));

const materialRepository = require("../repositories/materialRepository");
const materialService = require("../services/materialService");

describe("materialService - getLearnerMaterials", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("UTCID01 - repo trả [] -> service trả []", async () => {
    materialRepository.getLearnerMaterials.mockResolvedValue([]);

    const result = await materialService.getLearnerMaterials(10);

    expect(materialRepository.getLearnerMaterials).toHaveBeenCalledWith(10);
    expect(result).toEqual([]);
  });

  test("UTCID02 - repo trả 1 material -> trả về 1 course object với 1 material đã format", async () => {
    materialRepository.getLearnerMaterials.mockResolvedValue([
      {
        CourseTitle: "Course A",
        CourseID: 1,
        CourseDescription: "Desc",
        InstructorName: "Inst A",
        MaterialID: 1,
        Title: "Doc 1",
        FileURL: "a.pdf",
      },
    ]);

    const result = await materialService.getLearnerMaterials(1);

    expect(materialRepository.getLearnerMaterials).toHaveBeenCalledWith(1);
    expect(result).toEqual([
      {
        CourseTitle: "Course A",
        CourseID: 1,
        CourseDescription: "Desc",
        InstructorName: "Inst A",
        Materials: [
          {
            MaterialID: 1,
            Title: "Doc 1",
            FileURL: "a.pdf",
            fileType: "PDF",
            canDownload: true,
          },
        ],
      },
    ]);
  });

  test("UTCID03 - repo trả nhiều material cùng một course -> gom thành 1 course, Materials chứa tất cả", async () => {
    materialRepository.getLearnerMaterials.mockResolvedValue([
      {
        CourseTitle: "Course A",
        CourseID: 1,
        CourseDescription: "Desc",
        InstructorName: "Inst A",
        MaterialID: 1,
        Title: "Doc 1",
        FileURL: "a.pdf",
      },
      {
        CourseTitle: "Course A",
        CourseID: 1,
        CourseDescription: "Desc",
        InstructorName: "Inst A",
        MaterialID: 2,
        Title: "Doc 2",
        FileURL: "b.docx",
      },
    ]);

    const result = await materialService.getLearnerMaterials(1);

    expect(result).toEqual([
      {
        CourseTitle: "Course A",
        CourseID: 1,
        CourseDescription: "Desc",
        InstructorName: "Inst A",
        Materials: [
          {
            MaterialID: 1,
            Title: "Doc 1",
            FileURL: "a.pdf",
            fileType: "PDF",
            canDownload: true,
          },
          {
            MaterialID: 2,
            Title: "Doc 2",
            FileURL: "b.docx",
            fileType: "Word",
            canDownload: true,
          },
        ],
      },
    ]);
  });

  test("UTCID04 - repo trả materials của nhiều course khác nhau -> group theo CourseTitle", async () => {
    materialRepository.getLearnerMaterials.mockResolvedValue([
      {
        CourseTitle: "Course A",
        CourseID: 1,
        CourseDescription: "Desc A",
        InstructorName: "Inst A",
        MaterialID: 1,
        Title: "Doc 1",
        FileURL: "a.pdf",
      },
      {
        CourseTitle: "Course B",
        CourseID: 2,
        CourseDescription: "Desc B",
        InstructorName: "Inst B",
        MaterialID: 2,
        Title: "Doc 2",
        FileURL: "b.pdf",
      },
    ]);

    const result = await materialService.getLearnerMaterials(1);

    expect(result).toEqual([
      {
        CourseTitle: "Course A",
        CourseID: 1,
        CourseDescription: "Desc A",
        InstructorName: "Inst A",
        Materials: [
          {
            MaterialID: 1,
            Title: "Doc 1",
            FileURL: "a.pdf",
            fileType: "PDF",
            canDownload: true,
          },
        ],
      },
      {
        CourseTitle: "Course B",
        CourseID: 2,
        CourseDescription: "Desc B",
        InstructorName: "Inst B",
        Materials: [
          {
            MaterialID: 2,
            Title: "Doc 2",
            FileURL: "b.pdf",
            fileType: "PDF",
            canDownload: true,
          },
        ],
      },
    ]);
  });

  test("UTCID05 - repo ném lỗi -> service log error và ném lại", async () => {
    const error = new Error("DB error");
    materialRepository.getLearnerMaterials.mockRejectedValue(error);

    await expect(materialService.getLearnerMaterials(1)).rejects.toThrow(
      "DB error"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});


