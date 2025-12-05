class Learner {
  constructor({
    LearnerID,
    FullName,
    ProfilePicture,
    Email = null,
    Phone = null,
  }) {
    this.LearnerID = LearnerID;
    this.FullName = FullName;
    this.ProfilePicture = ProfilePicture;
    this.Email = Email;
    this.Phone = Phone;
  }
}

module.exports = Learner;
