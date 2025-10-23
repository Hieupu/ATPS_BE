class Session {
  constructor({ SessionID, Title, Description, InstructorID, ClassID }) {
    this.SessionID = SessionID;
    this.Title = Title;
    this.Description = Description;
    this.InstructorID = InstructorID;
    this.ClassID = ClassID;
  }
}

module.exports = Session;
