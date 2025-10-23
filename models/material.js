class Material {
  constructor({
    MaterialID,
    Title,
    Description,
    FilePath,
    FileType,
    UploadDate,
    SessionID,
  }) {
    this.MaterialID = MaterialID;
    this.Title = Title;
    this.Description = Description;
    this.FilePath = FilePath;
    this.FileType = FileType;
    this.UploadDate = UploadDate;
    this.SessionID = SessionID;
  }
}

module.exports = Material;
