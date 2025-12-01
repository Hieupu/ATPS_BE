class LearnerDetail {
  constructor({
    LearnerID,
    FullName,
    ProfilePicture,
    Email,
    Phone,
    DateOfBirth = null,
    Gender = null,
    Job = null,
    Address = null,
    AccID = null,
    CreatedAt = null,
    Status = "ACTIVE",
  }) {
    this.LearnerID = LearnerID;
    this.FullName = FullName;
    this.ProfilePicture = ProfilePicture || "/default-avatar.png";
    this.Email = Email;
    this.Phone = Phone;
    this.DateOfBirth = DateOfBirth;
    this.Gender = Gender;
    this.Job = Job;
    this.Address = Address;
    this.AccID = AccID;
    this.CreatedAt = CreatedAt;
    this.Status = Status;
  }
}

module.exports = LearnerDetail;
