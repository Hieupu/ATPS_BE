class Class {
  constructor({
    ClassID,
    CourseID,
    InstructorID,
    ClassName,
    StartDate,
    EndDate,
  }) {
    this.ClassID = ClassID;
    this.CourseID = CourseID;
    this.InstructorID = InstructorID;
    this.ClassName = ClassName;
    this.StartDate = StartDate;
    this.EndDate = EndDate;
  }
}

module.exports = Class;
