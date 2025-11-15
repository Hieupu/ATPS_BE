class Course {
  constructor({
    CourseID,
    InstructorID,
    InstructorName,
    Title,
    Description,
    Image,
    Duration,
    Ojectives,
    Requirements,
    Level, // 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    Status, // 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'DELETED'
    Code,
  }) {
    this.CourseID = CourseID;
    this.InstructorID = InstructorID;
    this.InstructorName = InstructorName;
    this.Title = Title;
    this.Description = Description;
    this.Image = Image;
    this.Duration = Duration;
    this.Ojectives = Ojectives;
    this.Requirements = Requirements;
    this.Level = Level;
    this.Status = Status || "DRAFT";
    this.Code = Code;
  }
}
module.exports = Course;
