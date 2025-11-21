class Lesson {
  constructor({ LessonID, Title, Time, FileURL, Type, UnitID, Status }) {
    this.LessonID = LessonID;
    this.Title = Title;
    this.Time = Time;
    this.FileURL = FileURL;
    this.Type = Type;
    this.UnitID = UnitID;
    this.Status = Status;
  }
}

module.exports = Lesson;
