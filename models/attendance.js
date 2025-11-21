class Attendance {
  constructor({ AttendanceID, LearnerID, SessionID, Status, Date }) {
    this.AttendanceID = AttendanceID;
    this.LearnerID = LearnerID;
    this.SessionID = SessionID;
    this.Status = Status;
    this.Date = Date;
  }
}

module.exports = Attendance;
