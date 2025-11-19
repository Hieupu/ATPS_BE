class Learner {
  constructor({
    LearnerID,
    FullName,
    DateOfBirth,
    ProfilePicture,
    Job,
    Address,
    AccID,
  }) {
    this.LearnerID = LearnerID;
    this.FullName = FullName;
    this.DateOfBirth = DateOfBirth;
    this.ProfilePicture = ProfilePicture || null;
    this.Job = Job || null;
    this.Address = Address || null;
    this.AccID = AccID;
  }
}

module.exports = Learner;
