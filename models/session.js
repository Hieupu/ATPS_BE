class Session {
  constructor({
    SessionID,
    Title,
    Description,
    InstructorID,
    ClassID,
    TimeslotID,
    CreatedDate,
    UpdatedDate,
  }) {
    this.SessionID = SessionID;
    this.Title = Title;
    this.Description = Description;
    this.InstructorID = InstructorID;
    this.ClassID = ClassID;
    this.TimeslotID = TimeslotID;
    this.CreatedDate = CreatedDate;
    this.UpdatedDate = UpdatedDate;
  }
}

module.exports = Session;
