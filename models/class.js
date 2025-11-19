class Class {
  constructor({
    ClassID,
    Name,
    ZoomID,
    Zoompass,
    Status,
    CourseID,
    CourseTitle,
    InstructorID,
    InstructorName,
    Fee,
    Maxstudent,
    OpendatePlan,
    Opendate,
    EnddatePlan,
    Enddate,
    Numofsession,
    StudentCount,
  }) {
    this.ClassID = ClassID;
    this.Name = Name;
    this.ZoomID = ZoomID;
    this.Zoompass = Zoompass;
    this.Status = Status;
    this.CourseID = CourseID;
    this.CourseTitle = CourseTitle || null;
    this.InstructorID = InstructorID;
    this.InstructorName = InstructorName || null;
    this.Fee = Fee;
    this.Maxstudent = Maxstudent;
    this.OpendatePlan = OpendatePlan;
    this.Opendate = Opendate || null;
    this.EnddatePlan = EnddatePlan;
    this.Enddate = Enddate || null;
    this.Numofsession = Numofsession;
    this.StudentCount = StudentCount ?? 0;
  }
}

module.exports = Class;
