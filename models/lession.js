class Lession {
  constructor({
    LessionID,
    Title,
    Description,
    Type,
    FileURL,
    SessionID,
    UnitID,
  }) {
    this.LessionID = LessionID;
    this.Title = Title;
    this.Description = Description;
    this.Type = Type;
    this.FileURL = FileURL;
    this.SessionID = SessionID;
    this.UnitID = UnitID;
  }
}

module.exports = Lession;
