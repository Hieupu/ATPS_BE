class Log {
  constructor({ LogID, Action, Timestamp, AccID, Detail }) {
    this.LogID = LogID;
    this.Action = Action;
    this.Timestamp = Timestamp;
    this.AccID = AccID;
    this.Detail = Detail;
  }
}

module.exports = Log;

