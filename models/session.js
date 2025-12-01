class Session {
  constructor({
    SessionID,
    Title,
    Date,
    ZoomUUID,
    StartTime,
    EndTime,
    Day,
    attendedCount = 0,
    totalStudents = 0,
  }) {
    this.sessionId = SessionID;
    this.title = Title;
    this.date = Date;
    this.zoomLink = ZoomUUID;
    this.startTime = StartTime;
    this.endTime = EndTime;
    this.dayOfWeek = Day;
    this.attendedCount = Number(attendedCount);
    this.totalStudents = Number(totalStudents);
    this.isFullyMarked = false;
  }
}

module.exports = Session;
