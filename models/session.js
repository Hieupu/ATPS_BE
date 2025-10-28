class Session {
  constructor({ SessionID, Title, Description, InstructorID }) {
    this.SessionID = SessionID;
    this.Title = Title;
    this.Description = Description;
    this.InstructorID = InstructorID;
  }
}

module.exports = Session;
