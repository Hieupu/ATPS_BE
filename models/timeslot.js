class Timeslot {
  constructor({ TimeslotID, CourseID, LessonID, Date, StartTime, EndTime }) {
    this.TimeslotID = TimeslotID;
    this.CourseID = CourseID;
    this.LessonID = LessonID;
    this.Date = Date;
    this.StartTime = StartTime;
    this.EndTime = EndTime;
  }
}

module.exports = Timeslot;
