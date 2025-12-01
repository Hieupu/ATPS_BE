class Assignment {
  constructor({
    AssignmentID,
    InstructorID,
    UnitID,
    Title,
    Description,
    Deadline,
    FileURL,
    Status = "draft",
    Type = "document",
    ShowAnswersAfter = "after_submission",
    MaxDuration,
    MediaURL,
  } = {}) {
    this.AssignmentID = AssignmentID ?? null;
    this.InstructorID = InstructorID ?? null;
    this.UnitID = UnitID ?? null;
    this.Title = Title || "";
    this.Description = Description || "";
    this.Deadline = Deadline || null;
    this.FileURL = FileURL || null;
    this.Status = Status;
    this.Type = Type;
    this.ShowAnswersAfter = ShowAnswersAfter;
    this.MaxDuration = MaxDuration ?? null;
    this.MediaURL = MediaURL || null;
  }
}

module.exports = Assignment;
