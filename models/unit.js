class Unit {
  constructor({ UnitID, CourseID, Title, Description, Duration }) {
    this.UnitID = UnitID;
    this.CourseID = CourseID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
  }
}

module.exports = Unit;
