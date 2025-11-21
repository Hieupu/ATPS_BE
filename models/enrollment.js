class Enrollment {
  constructor({ EnrollmentID, EnrollmentDate, Status, LearnerID, ClassID }) {
    this.EnrollmentID = EnrollmentID;
    this.EnrollmentDate = EnrollmentDate;
    this.Status = Status;
    this.LearnerID = LearnerID;
    this.ClassID = ClassID;
  }
}

module.exports = Enrollment;
