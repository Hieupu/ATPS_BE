
class InstructorTimeslot {
  constructor({
    InstructortimeslotID,
    InstructorID,
    TimeslotID,
    Date,
    Status, 
    Note,
  }) {
    this.InstructortimeslotID = InstructortimeslotID;
    this.InstructorID = InstructorID;
    this.TimeslotID = TimeslotID;
    this.Date = Date;
    this.Status = Status || 'HOLIDAY';
    this.Note = Note || null;
  }
}

module.exports = InstructorTimeslot;

