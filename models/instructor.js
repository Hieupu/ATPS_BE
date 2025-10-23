class Instructor {
  constructor({
    InstructorID,
    AccID,
    FullName,
    DateOfBirth,
    ProfilePicture,
    Job,
    Address,
    Major,
  }) {
    this.InstructorID = InstructorID;
    this.AccID = AccID;
    this.FullName = FullName;
    this.DateOfBirth = DateOfBirth;
    this.ProfilePicture = ProfilePicture;
    this.Job = Job;
    this.Address = Address;
    this.Major = Major;
  }
}

module.exports = Instructor;
