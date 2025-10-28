const connectDB = require("../config/db");
const Instructor = require("../models/instructor");

class InstructorRepository {
  async listAll() {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT InstructorID, FullName, DateOfBirth, ProfilePicture, Job, Address, CV, AccID, Major FROM instructor"
    );
    return rows.map((r) => new Instructor(r));
  }

  async findById(instructorId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT InstructorID, FullName, DateOfBirth, ProfilePicture, Job, Address, CV, AccID, Major FROM instructor WHERE InstructorID = ?",
      [instructorId]
    );
    if (!rows.length) return null;
    return new Instructor(rows[0]);
  }

  async findByAccountId(accId) {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT InstructorID, FullName, DateOfBirth, ProfilePicture, Job, Address, CV, AccID, Major FROM instructor WHERE AccID = ?",
      [accId]
    );
    if (!rows.length) return null;
    return new Instructor(rows[0]);
  }
}

module.exports = new InstructorRepository();
