class Assignment {
  constructor({
    AssignmentID,
    Title,
    Description,
    Deadline,
    Type,
    UnitID,
    Status,
    FileURL,
    MaxDuration,
    ShowAnswersAfter,
    MediaURL
  }) {
    this.AssignmentID = AssignmentID ?? null;
    this.Title = Title;
    this.Description = Description;
    this.Deadline = Deadline;
    this.Type = Type || "document";
    this.UnitID = UnitID ?? null;
    this.Status = Status || "active";
    this.FileURL = FileURL ?? null;
    this.MaxDuration = MaxDuration ?? null;
    this.ShowAnswersAfter = ShowAnswersAfter || "after_submission";
    this.MediaURL = MediaURL ?? null;
  }
}

module.exports = Assignment;