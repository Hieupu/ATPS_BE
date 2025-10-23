class Course {
  constructor({
    CourseID,
    Title,
    Description,
    Duration,
    Price,
    Status,
    CreatedAt,
  }) {
    this.CourseID = CourseID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
    this.Price = Price;
    this.Status = Status;
    this.CreatedAt = CreatedAt;
  }
}

module.exports = Course;
