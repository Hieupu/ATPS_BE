const MaterialService = require("../services/materialService");

describe("materialService - getFileType", () => {
  test("UTCID01 - fileURL = 'file.pdf' -> trả 'PDF'", () => {
    const result = MaterialService.getFileType("file.pdf");
    expect(result).toBe("PDF");
  });

  test("UTCID02 - fileURL = 'file.doc' -> trả 'Word'", () => {
    const result = MaterialService.getFileType("file.doc");
    expect(result).toBe("Word");
  });

  test("UTCID03 - fileURL = 'file.DOCX' -> trả 'Word'", () => {
    const result = MaterialService.getFileType("file.DOCX");
    expect(result).toBe("Word");
  });

  test("UTCID04 - fileURL = 'spreadsheet.xlsx' -> trả 'Excel'", () => {
    const result = MaterialService.getFileType("spreadsheet.xlsx");
    expect(result).toBe("Excel");
  });

  test("UTCID05 - fileURL = 'presentation.ppt' -> trả 'PowerPoint'", () => {
    const result = MaterialService.getFileType("presentation.ppt");
    expect(result).toBe("PowerPoint");
  });

  test("UTCID06 - fileURL = 'video.MP4' -> trả 'Video'", () => {
    const result = MaterialService.getFileType("video.MP4");
    expect(result).toBe("Video");
  });

  test("UTCID07 - fileURL = 'archive.rar' -> trả 'Archive'", () => {
    const result = MaterialService.getFileType("archive.rar");
    expect(result).toBe("Archive");
  });

  test("UTCID08 - fileURL = 'audio.mp3' -> trả 'Audio'", () => {
    const result = MaterialService.getFileType("audio.mp3");
    expect(result).toBe("Audio");
  });

  test("UTCID09 - fileURL = 'unknownfile.xyz' -> trả 'File'", () => {
    const result = MaterialService.getFileType("unknownfile.xyz");
    expect(result).toBe("File");
  });

  test("UTCID10 - fileURL = 'file' (không có extension) -> trả 'File'", () => {
    const result = MaterialService.getFileType("file");
    expect(result).toBe("File");
  });

  test("UTCID11 - fileURL = '' (empty string) -> trả 'File'", () => {
    const result = MaterialService.getFileType("");
    expect(result).toBe("File");
  });

  test("UTCID12 - fileURL = null -> ném error", () => {
    expect(() => MaterialService.getFileType(null)).toThrow();
  });
});

