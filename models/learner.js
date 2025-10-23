class Learner {
  constructor({
    LearnerID,
    AccID,
    FullName,
    DateOfBirth,
    ProfilePicture,
    Job,
    Address,
  }) {
    this.LearnerID = LearnerID;
    this.AccID = AccID;
    this.FullName = FullName;
    this.DateOfBirth = DateOfBirth;
    this.ProfilePicture = ProfilePicture;
    this.Job = Job;
    this.Address = Address;
  }
}

module.exports = Learner;