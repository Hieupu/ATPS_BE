
class Class {
  constructor({
    ClassID,
    Name,
    CourseID,
    InstructorID,
    Status,
    ZoomURL,
    ZoomID,
    Zoompass,
    Fee,
    OpendatePlan,
    Opendate,
    EnddatePlan,
    Enddate,
    Numofsession,
    Maxstudent,
  }) {
    this.ClassID = ClassID;
    this.Name = Name;
    this.CourseID = CourseID;
    this.InstructorID = InstructorID;
    this.Status = Status;
    this.ZoomURL = ZoomURL;
    this.ZoomID = ZoomID || null;
    this.Zoompass = Zoompass || null;
    this.Fee = Fee;
    this.OpendatePlan = OpendatePlan || null;
    this.Opendate = Opendate || null;
    this.EnddatePlan = EnddatePlan || null;
    this.Enddate = Enddate || null;
    this.Numofsession = Numofsession || 0;
    this.Maxstudent = Maxstudent || 0;
  }
}

module.exports = Class;
