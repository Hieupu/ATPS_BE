const connectDB = require("../config/db");

class ClassRepository {
  async create(classData) {
    const pool = await connectDB();
    const {
      Name,
      CourseID,
      InstructorID,
      Status,
      ZoomID,
      Zoompass,
      Fee,
      OpendatePlan,
      EnddatePlan,
      Numofsession,
      Maxstudent,
      CreatedByStaffID, // Thêm CreatedByStaffID
    } = classData;

    const query = `
      INSERT INTO \`class\` (
        Name, CourseID, InstructorID, Status, ZoomID, Zoompass, Fee, 
        OpendatePlan, Opendate, EnddatePlan, Enddate,
        Numofsession, Maxstudent, CreatedByStaffID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      Name,
      CourseID,
      InstructorID,
      Status || "DRAFT",
      ZoomID || null,
      Zoompass || null,
      Fee || 0,
      OpendatePlan || null,
      null, // Opendate sẽ được sync từ session
      EnddatePlan || null,
      null, // Enddate sẽ được sync từ session
      Numofsession || 0,
      Maxstudent || 0,
      CreatedByStaffID || null, // Thêm CreatedByStaffID
    ]);

    return result;
  }

  async findById(id) {
    const pool = await connectDB();
    if (!id) {
      throw new Error("ID is required");
    }
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        COUNT(e.EnrollmentID) as currentLearners,
        s.FullName as createdByStaffName
      FROM class c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'Enrolled'
      LEFT JOIN staff s ON c.CreatedByStaffID = s.StaffID
      WHERE c.ClassID = ?
      GROUP BY c.ClassID
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows;
  }

  async findAll(options = {}) {
    const pool = await connectDB();
    const { userRole, staffID } = options;

    let query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName,
        s.FullName as createdByStaffName
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN staff s ON c.CreatedByStaffID = s.StaffID
      WHERE 1=1
    `;

    // Filter theo role:
    // - Admin: Không hiển thị DRAFT (vì DRAFT chỉ là bản nháp của staff)
    // - Staff: CHỈ hiển thị các lớp do mình tạo (CreatedByStaffID = staffID)
    if (userRole === "admin") {
      query += ` AND c.Status != 'DRAFT'`;
    } else if (userRole === "staff" && staffID) {
      // Staff CHỈ thấy các lớp do mình tạo
      query += ` AND c.CreatedByStaffID = ?`;
    }

    query += ` ORDER BY c.ClassID DESC`;

    const params = userRole === "staff" && staffID ? [staffID] : [];
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async findByCourseId(courseId) {
    const pool = await connectDB();
    const query = `
      SELECT 
        c.*,
        i.FullName as instructorName
      FROM \`class\` c
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      WHERE c.CourseID = ?
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query, [courseId]);
    return rows;
  }

  async findByInstructorId(instructorId) {
    const pool = await connectDB();
    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      WHERE c.InstructorID = ?
      ORDER BY c.ClassID DESC
    `;

    const [rows] = await pool.execute(query, [instructorId]);
    return rows;
  }

  async update(id, updateData) {
    const pool = await connectDB();

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error("No fields provided for update");
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE class SET ${setClause} WHERE ClassID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async exists(id) {
    const pool = await connectDB();
    const query = `SELECT 1 FROM class WHERE ClassID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  // Cập nhật lớp (workflow method - override update above)
  async updateWorkflow(classId, updateData) {
    const pool = await connectDB();
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);
    values.push(classId);

    const query = `
      UPDATE \`class\` 
      SET ${fields}
      WHERE ClassID = ?
    `;

    const [result] = await pool.execute(query, values);
    return result;
  }

  // Lấy lớp theo status
  async findByStatus(status, options = {}) {
    const pool = await connectDB();
    const { limit = 10, offset = 0 } = options;

    const query = `
      SELECT 
        c.*,
        co.Title as courseTitle,
        co.Description as courseDescription,
        i.FullName as instructorName,
        i.Major as instructorMajor,
        COUNT(e.EnrollmentID) as currentLearners
      FROM \`class\` c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
      LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'Enrolled'
      WHERE c.Status = ?
      GROUP BY c.ClassID
      ORDER BY c.ClassID DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [status, limit, offset]);
    return rows;
  }

  // Đếm lớp theo status
  async countByStatus(status) {
    const pool = await connectDB();
    const query = `
      SELECT COUNT(*) as total
      FROM class 
      WHERE Status = ?
    `;

    const [rows] = await pool.execute(query, [status]);
    return rows[0].total;
  }
  // Lấy lớp có thể đăng ký (ACTIVE, ONGOING - dbver7)
  async findAvailableClasses(options = {}) {
    const pool = await connectDB();
    const { limit = 10, offset = 0, search = "" } = options;

    let query = `
      SELECT 
    c.*,
    co.Title AS courseTitle,
    co.Description AS courseDescription,
    i.FullName AS instructorName,
    i.Major AS instructorMajor,
    COUNT(e.EnrollmentID) AS currentLearners
FROM class c
LEFT JOIN course co ON c.CourseID = co.CourseID
LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
LEFT JOIN enrollment e 
       ON c.ClassID = e.ClassID 
      AND e.Status = 'Enrolled'
WHERE c.Status IN ('ACTIVE', 'ONGOING')
GROUP BY c.ClassID;
    `;

    const params = [];

    if (search) {
      query += ` AND (c.Name LIKE ? OR co.Title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY c.ClassID
      ORDER BY c.ClassID DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async countAvailableClasses(search = "") {
    const pool = await connectDB();
    let query = `
      SELECT COUNT(*) as total
      FROM class c
      LEFT JOIN course co ON c.CourseID = co.CourseID
      LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'Enrolled'
      WHERE c.Status = 'ACTIVE'
    `;

    const params = [];

    if (search) {
      query += ` AND (c.Name LIKE ? OR co.Title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows.length;
  }
}

module.exports = new ClassRepository();
