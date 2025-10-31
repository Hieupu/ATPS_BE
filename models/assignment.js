class Assignment {
  constructor({
    AssignmentID,
    Title,
    Description,
    Deadline,
    Type,
    UnitID,
    Status,
  }) {
    this.AssignmentID = AssignmentID ?? null;
    this.Title = Title;
    this.Description = Description;
    this.Deadline = Deadline; 
    this.Type = Type; 
    this.UnitID = UnitID ?? null;
    this.Status = Status || "active";
  }
}

module.exports = Assignment;
