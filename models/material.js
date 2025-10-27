class Material {
  constructor({
    MaterialID,
    CourseID,
    Title,
    FileURL,
    Status,
    CreatedDate,
    UpdatedDate,
  }) {
    this.MaterialID = MaterialID;
    this.CourseID = CourseID;
    this.Title = Title;
    this.FileURL = FileURL;
    this.Status = Status || "active";
    this.CreatedDate = CreatedDate;
    this.UpdatedDate = UpdatedDate;
  }
}
module.exports = Material;
