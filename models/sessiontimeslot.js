class SessionTimeslot {
  constructor({
    sessiontimeslotID,
    SessionID,
    TimeslotID,
  }) {
    this.sessiontimeslotID = sessiontimeslotID;
    this.SessionID = SessionID;
    this.TimeslotID = TimeslotID;
  }
}

module.exports = SessionTimeslot;