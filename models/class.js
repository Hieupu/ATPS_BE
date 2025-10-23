class Class {
  constructor({
    ClassID,
    ClassName,
    StartDate,
    EndDate,
    MaxStudents,
    CurrentStudents,
    Status,
    CourseID,
    InstructorID,
  }) {
    this.ClassID = ClassID;
    this.ClassName = ClassName;
    this.StartDate = StartDate;
    this.EndDate = EndDate;
    this.MaxStudents = MaxStudents;
    this.CurrentStudents = CurrentStudents;
    this.Status = Status;
    this.CourseID = CourseID;
    this.InstructorID = InstructorID;
  }
}

module.exports = Class;
