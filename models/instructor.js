const pool = require("../config/db");

const Instructor = {
  // Lấy tất cả giảng viên
  findAll: async () => {
    const query = `
      SELECT 
        i.InstructorID,
        i.FullName,
        i.DateOfBirth,
        i.ProfilePicture,
        i.Job,
        i.Address,
        i.CV,
        i.Major,
        a.Email,
        a.Phone,
        a.Status as accountStatus
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      ORDER BY i.InstructorID DESC
    `;

    const [instructors] = await pool.execute(query);
    return instructors;
  },

  // Lấy giảng viên theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        i.InstructorID,
        i.FullName,
        i.DateOfBirth,
        i.ProfilePicture,
        i.Job,
        i.Address,
        i.CV,
        i.Major,
        a.Email,
        a.Phone,
        a.Status as accountStatus
      FROM instructor i
      LEFT JOIN account a ON i.AccID = a.AccID
      WHERE i.InstructorID = ?
    `;

    const [instructors] = await pool.execute(query, [id]);
    return instructors.length > 0 ? instructors[0] : null;
  },

  // Kiểm tra giảng viên có tồn tại không
  exists: async (id) => {
    const query = `SELECT InstructorID FROM instructor WHERE InstructorID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.length > 0;
  },
};

module.exports = Instructor;
