class Course {
  constructor({
    CourseID,
    InstructorID,
    Title,
    Description,
    Duration,
    Fee,
    Status,
  }) {
    this.CourseID = CourseID;
    this.InstructorID = InstructorID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
    this.Fee = Fee;
    this.Status = Status || "draft";
  }
}
module.exports = Course;
