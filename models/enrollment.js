class Enrollment {
  constructor({
    EnrollmentID,
    LearnerID,
    CourseID,
    EnrollmentDate,
    Status,
    PaymentStatus,
  }) {
    this.EnrollmentID = EnrollmentID;
    this.LearnerID = LearnerID;
    this.CourseID = CourseID;
    this.EnrollmentDate = EnrollmentDate;
    this.Status = Status;
    this.PaymentStatus = PaymentStatus;
  }
}

module.exports = Enrollment;
