class Course {
  constructor({
    CourseID,
    Title,
    Description,
    Duration,
    Fee,
    Status,
    InstructorID,
  }) {
    this.CourseID = CourseID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
    this.Fee = Fee;
    this.Status = Status;
    this.InstructorID = InstructorID;
  }
}

module.exports = Course;
