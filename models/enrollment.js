class Enrollment {
  constructor({
    EnrollmentID,
    EnrollmentDate,
    Status,
    OrderCode,
    LearnerID,
    ClassID,
  }) {
    this.id = EnrollmentID;
    this.date = EnrollmentDate;
    this.status = Status;
    this.orderCode = OrderCode;
    this.learnerId = LearnerID;
    this.classId = ClassID;
  }
}

module.exports = Enrollment;
