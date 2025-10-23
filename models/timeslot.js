class Timeslot {
  constructor({ TimeslotID, StartTime, EndTime, Date }) {
    this.TimeslotID = TimeslotID;
    this.StartTime = StartTime;
    this.EndTime = EndTime;
    this.Date = Date;
  }
}

module.exports = Timeslot;
