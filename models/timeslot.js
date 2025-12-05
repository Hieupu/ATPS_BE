class Timeslot {
  constructor({ TimeslotID, StartTime, EndTime, Day }) {
    this.TimeslotID = TimeslotID;
    this.StartTime = StartTime;
    this.EndTime = EndTime;
    this.Day = Day;
  }
}

module.exports = Timeslot;
