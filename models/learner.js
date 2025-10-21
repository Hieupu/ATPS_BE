const pool = require("../config/db");

const Learner = {
  // Lấy tất cả học viên
  findAll: async () => {
    const query = `
      SELECT 
        l.LearnerID,
        l.FullName,
        l.DateOfBirth,
        l.ProfilePicture,
        l.Job,
        l.Address,
        a.Email,
        a.Phone,
        a.Status as accountStatus
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      ORDER BY l.LearnerID DESC
    `;

    const [learners] = await pool.execute(query);
    return learners;
  },

  // Lấy học viên theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        l.LearnerID,
        l.FullName,
        l.DateOfBirth,
        l.ProfilePicture,
        l.Job,
        l.Address,
        a.Email,
        a.Phone,
        a.Status as accountStatus
      FROM learner l
      LEFT JOIN account a ON l.AccID = a.AccID
      WHERE l.LearnerID = ?
    `;

    const [learners] = await pool.execute(query, [id]);
    return learners.length > 0 ? learners[0] : null;
  },

  // Kiểm tra học viên có tồn tại không
  exists: async (id) => {
    const query = `SELECT LearnerID FROM learner WHERE LearnerID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.length > 0;
  },
};

module.exports = Learner;
