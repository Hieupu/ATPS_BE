
class Session {
  constructor({
    SessionID,
    Title,
    Description,
    InstructorID,
    ClassID,
    TimeslotID,
    Date,
    ZoomUUID, // dbver5: UUID phòng Zoom
  }) {
    this.SessionID = SessionID;
    this.Title = Title;
    this.Description = Description;
    this.InstructorID = InstructorID;
    this.ClassID = ClassID;
    this.TimeslotID = TimeslotID;
    this.Date = Date;
    this.ZoomUUID = ZoomUUID || null; // dbver5
  }
}

module.exports = Session;
