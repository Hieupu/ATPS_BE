class Material {
  constructor({ MaterialID, CourseID, Title, FileURL, Status }) {
    this.MaterialID = MaterialID;
    this.CourseID = CourseID;
    this.Title = Title;
    this.FileURL = FileURL;
    this.Status = Status || "active";
  }
}

module.exports = Material;
