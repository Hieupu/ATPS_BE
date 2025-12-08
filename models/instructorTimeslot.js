
class InstructorTimeslot {
  constructor({
    InstructortimeslotID,
    InstructorID,
    TimeslotID,
    Date,
    Status,  // 'Holiday', 'PersonalLeave', ...
    Note,
  }) {
    this.InstructortimeslotID = InstructortimeslotID;
    this.InstructorID = InstructorID;
    this.TimeslotID = TimeslotID;
    this.Date = Date;
    this.Status = Status || 'Holiday';
    this.Note = Note || null;
  }
}

module.exports = InstructorTimeslot;

