class Course {
  constructor({
    CourseID,
    InstructorID,
    Title,
    Description,
    Duration,
    TuitionFee,
    Status,
  }) {
    this.CourseID = CourseID;
    this.InstructorID = InstructorID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
    this.TuitionFee = TuitionFee;
    this.Status = Status || "draft";
  }
}

module.exports = Course;
