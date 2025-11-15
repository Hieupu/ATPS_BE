class Unit {
  constructor({
    UnitID,
    CourseID,
    Title,
    Description,
    Duration,
    Status,
    OrderIndex,
  }) {
    this.UnitID = UnitID;
    this.CourseID = CourseID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
    this.Status = Status;
    this.OrderIndex = OrderIndex;
  }
}
module.exports = Unit;
