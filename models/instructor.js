
class Instructor {
  constructor({
    InstructorID,
    AccID,
    FullName,
    DateOfBirth,
    ProfilePicture,
    Job,
    Address,
    CV,
    Major,
    InstructorFee,
    Type, // dbver5: 'fulltime' hoặc 'parttime'
  }) {
    this.InstructorID = InstructorID;
    this.AccID = AccID;
    this.FullName = FullName;
    this.DateOfBirth = DateOfBirth;
    this.ProfilePicture = ProfilePicture;
    this.Job = Job;
    this.Address = Address;
    this.CV = CV;
    this.Major = Major;
    this.InstructorFee = InstructorFee;
    this.Type = Type || 'fulltime'; // dbver5
  }
}

module.exports = Instructor;
