class Unit {
  constructor({
    UnitID,
    CourseID,
    Title,
    Description,
    Duration,
    CreatedDate,
    UpdatedDate,
  }) {
    this.UnitID = UnitID;
    this.CourseID = CourseID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
    this.CreatedDate = CreatedDate;
    this.UpdatedDate = UpdatedDate;
  }
}
module.exports = Unit;
