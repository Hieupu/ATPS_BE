// models/Class.js

class Class {
  constructor({
    ClassID,
    Name,
    ZoomID,
    Zoompass,
    Status,
    CourseID,
    CourseTitle,
    CourseImage,
    CourseLevel,
    InstructorID,
    InstructorName,
    InstructorAvatar,
    Fee,
    Maxstudent,
    OpendatePlan,
    Opendate,
    EnddatePlan,
    Enddate,
    Numofsession,

    currentStudents,
    totalSessions,
    completedSessions,
    progress,
    scheduleSummary,
    hasSessionToday,
    nextSession,
  } = {}) {
    this.ClassID = ClassID || null;
    this.Name = Name || null;
    this.ZoomID = ZoomID || null;
    this.Zoompass = Zoompass || null;
    this.Status = Status || "ACTIVE";
    this.CourseID = CourseID || null;

    this.course = {
      id: this.CourseID,
      title: CourseTitle || "Chưa có khóa học",
      image: CourseImage || "/images/default-class.jpg",
      level: CourseLevel || null,
    };

    this.InstructorID = InstructorID || null;
    this.InstructorName = InstructorName || null;
    this.InstructorAvatar = InstructorAvatar || "";

    this.Fee = Fee || 0;
    this.Maxstudent = Maxstudent || 0;
    this.OpendatePlan = OpendatePlan || null;
    this.Opendate = Opendate || null;
    this.EnddatePlan = EnddatePlan || null;
    this.Enddate = Enddate || null;
    this.Numofsession = Numofsession || 0;

    this.currentStudents = this.StudentCount;

    this.totalSessions = totalSessions ?? this.Numofsession;
    this.completedSessions = completedSessions ?? 0;
    this.progress = progress ?? 0;
    this.scheduleSummary = scheduleSummary || "Chưa có lịch cố định";
    this.hasSessionToday = Boolean(hasSessionToday);
    this.nextSession = nextSession || "Chưa xếp lịch";

    this.zoomMeetingId = this.ZoomID;
    this.zoomPassword = this.Zoompass;
    this.maxStudents = this.Maxstudent;
    this.openPlan = this.OpendatePlan;
    this.openActual = this.Opendate;
    this.endPlan = this.EnddatePlan;
    this.endActual = this.Enddate;
  }
}

module.exports = Class;
