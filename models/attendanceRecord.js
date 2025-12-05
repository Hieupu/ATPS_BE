class AttendanceRecord {
  constructor({ LearnerID, FullName, ProfilePicture, Status = "ABSENT" }) {
    this.learnerId = LearnerID;
    this.fullName = FullName;
    this.avatar = ProfilePicture || "/default-avatar.png";
    this.status = Status; // "PRESENT" | "ABSENT"
  }
}

module.exports = AttendanceRecord;
