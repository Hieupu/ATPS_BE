class Lesson {
  constructor({ LessonID, Title, Time, Type, FileURL, UnitID }) {
    this.LessonID = LessonID;
    this.Title = Title;
    this.Time = Time;
    this.Type = Type;
    this.FileURL = FileURL;
    this.UnitID = UnitID;
  }
}
module.exports = Lesson;
