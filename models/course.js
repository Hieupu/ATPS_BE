class Course {
  constructor({
    CourseID,
    Title,
    Description,
    Duration,
    TuitionFee,
    Status,
    CreatedDate,
    UpdatedDate,
  }) {
    this.CourseID = CourseID;
    this.Title = Title;
    this.Description = Description;
    this.Duration = Duration;
    this.TuitionFee = TuitionFee;
    this.Status = Status || "draft";
    this.CreatedDate = CreatedDate;
    this.UpdatedDate = UpdatedDate;
  }
}

module.exports = Course;
