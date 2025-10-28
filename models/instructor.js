class Instructor {
  constructor({
    InstructorID,
    FullName,
    DateOfBirth,
    ProfilePicture,
    Job,
    Address,
    CV,
    AccID,
    Major,
  }) {
    this.InstructorID = InstructorID;
    this.FullName = FullName;
    this.DateOfBirth = DateOfBirth;
    this.ProfilePicture = ProfilePicture;
    this.Job = Job;
    this.Address = Address;
    this.CV = CV;
    this.AccID = AccID;
    this.Major = Major;
  }
}

module.exports = Instructor;
