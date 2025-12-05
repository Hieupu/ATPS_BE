class Attendance {
  constructor({
    AttendanceID = null,
    LearnerID,
    SessionID,
    Status, // "PRESENT" | "ABSENT"
    Date,
  }) {
    this.AttendanceID = AttendanceID;
    this.LearnerID = LearnerID;
    this.SessionID = SessionID;
    this.Status = Status;
    this.Date = Date;
  }
}

module.exports = Attendance;
