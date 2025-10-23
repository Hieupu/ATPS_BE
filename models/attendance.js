class Attendance {
  constructor({ AttendanceID, LearnerID, sessiontimeslotID, Status, Date }) {
    this.AttendanceID = AttendanceID;
    this.LearnerID = LearnerID;
    this.sessiontimeslotID = sessiontimeslotID;
    this.Status = Status;
    this.Date = Date;
  }
}

module.exports = Attendance;
