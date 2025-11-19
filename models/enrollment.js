class Enrollment {
  constructor({
    EnrollmentID,
    EnrollmentDate,
    Status,
    LearnerID,
    ClassID,
    OrderCode,
  }) {
    this.EnrollmentID = EnrollmentID;
    this.EnrollmentDate = EnrollmentDate;
    this.Status = Status;
    this.LearnerID = LearnerID;
    this.ClassID = ClassID;
    this.OrderCode = OrderCode;
  }
}

module.exports = Enrollment;
