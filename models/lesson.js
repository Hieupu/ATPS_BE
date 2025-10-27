// models/lesson.js
class Lesson {
  constructor({
    LessonID,
    Title,
    Description,
    Type,
    FileURL,
    UnitID,
    CreatedDate,
    UpdatedDate,
  }) {
    this.LessonID = LessonID;
    this.Title = Title;
    this.Description = Description;
    this.Type = Type;
    this.FileURL = FileURL;
    this.UnitID = UnitID;
    this.CreatedDate = CreatedDate;
    this.UpdatedDate = UpdatedDate;
  }
}

module.exports = Lesson;
