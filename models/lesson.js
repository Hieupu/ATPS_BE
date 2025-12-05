class Lesson {
  constructor({
    LessonID,
    OrderIndex,
    Title,
    Duration,
    Type,
    FileURL,
    UnitID,
    Status,
  }) {
    this.LessonID = LessonID;
    this.OrderIndex = OrderIndex;
    this.Title = Title;
    this.Duration = Duration; // DECIMAL(10,2)
    this.Type = Type; // 'video' | 'document' | 'audio'
    this.FileURL = FileURL;
    this.UnitID = UnitID;
    this.Status = Status; // 'VISIBLE' | 'HIDDEN' | 'DELETED'
  }
}
module.exports = Lesson;
