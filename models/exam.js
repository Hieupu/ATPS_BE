class Exam {
  constructor({
    ExamID,
    Title,
    Description,
    StartTime,
    EndTime,
    Status,
    CourseID,
    isRandomQuestion,
    isRandomAnswer,
    sections
  }) {
    this.ExamID = ExamID ?? null;
    this.Title = Title;
    this.Description = Description;
    this.StartTime = StartTime;
    this.EndTime = EndTime;
    this.Status = Status || "Pending";
    this.CourseID = CourseID ?? null;
    this.isRandomQuestion = isRandomQuestion ?? 0;
    this.isRandomAnswer = isRandomAnswer ?? 0;
    this.sections = sections ?? [];
  }
}

module.exports = Exam;
