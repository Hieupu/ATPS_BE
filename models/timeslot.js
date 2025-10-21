const pool = require("../config/db");

const Timeslot = {
  // Tạo timeslot mới
  create: async (timeslotData) => {
    const { StartTime, EndTime, Date: dateValue } = timeslotData;

    // Xử lý format ngày tháng
    let formattedDate = dateValue;
    if (dateValue && typeof dateValue === "string" && dateValue.includes("T")) {
      // Nếu là ISO format, chuyển thành YYYY-MM-DD
      try {
        const date = new Date(dateValue);
        // Sử dụng toLocaleDateString để tránh timezone issues
        formattedDate = date.toLocaleDateString("en-CA"); // Returns YYYY-MM-DD format
      } catch (error) {
        console.error("Error parsing date:", dateValue, error);
        formattedDate = dateValue; // Fallback to original
      }
    }

    const query = `
      INSERT INTO timeslot (StartTime, EndTime, Date)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      StartTime,
      EndTime,
      formattedDate,
    ]);

    return {
      TimeslotID: result.insertId,
      ...timeslotData,
      Date: formattedDate,
    };
  },

  // Lấy tất cả timeslots với pagination và IsAssigned flag
  findAll: async (options = {}) => {
    const { page = 1, limit = 10, date = "" } = options;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        CASE 
          WHEN st.sessiontimeslotID IS NOT NULL THEN true 
          ELSE false 
        END as IsAssigned
      FROM timeslot t
      LEFT JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      WHERE 1=1
    `;

    const params = [];

    if (date) {
      query += ` AND t.Date = ?`;
      params.push(date);
    }

    // Đếm tổng số bản ghi
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/i,
      "SELECT COUNT(*) as total FROM"
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Thêm phân trang
    query += ` ORDER BY t.Date DESC, t.StartTime ASC LIMIT ${limitNum} OFFSET ${offset}`;

    const [timeslots] = await pool.execute(query, params);

    return {
      data: timeslots,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  // Lấy timeslots theo ClassID (qua sessiontimeslot)
  findByClassId: async (classId) => {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        c.Title as courseTitle,
        cl.ZoomURL,
        st.sessiontimeslotID
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE s.ClassID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, [classId]);
    return timeslots;
  },

  // Lấy timeslots theo CourseID (qua sessiontimeslot)
  findByCourseId: async (courseId) => {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        s.SessionID,
        c.Title as courseTitle,
        st.sessiontimeslotID
      FROM timeslot t
      INNER JOIN sessiontimeslot st ON t.TimeslotID = st.TimeslotID
      INNER JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN \`class\` cl ON s.ClassID = cl.ClassID
      LEFT JOIN course c ON cl.CourseID = c.CourseID
      WHERE cl.CourseID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [timeslots] = await pool.execute(query, [courseId]);
    return timeslots;
  },

  // Lấy timeslot theo ID
  findById: async (id) => {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date
      FROM timeslot t
      WHERE t.TimeslotID = ?
    `;

    const [timeslots] = await pool.execute(query, [id]);
    return timeslots.length > 0 ? timeslots[0] : null;
  },

  // Cập nhật timeslot
  update: async (id, timeslotData) => {
    const { StartTime, EndTime, Date } = timeslotData;

    const query = `
      UPDATE timeslot 
      SET StartTime = ?, EndTime = ?, Date = ?
      WHERE TimeslotID = ?
    `;

    const [result] = await pool.execute(query, [
      StartTime || null,
      EndTime || null,
      Date || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return null;
    }

    return { TimeslotID: id, ...timeslotData };
  },

  // Xóa timeslot
  delete: async (id) => {
    const query = `DELETE FROM timeslot WHERE TimeslotID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra timeslot có tồn tại không
  exists: async (id) => {
    const [rows] = await pool.execute(
      `SELECT TimeslotID FROM timeslot WHERE TimeslotID = ?`,
      [id]
    );
    return rows.length > 0;
  },

  // Kiểm tra xung đột thời gian (Room conflict)
  checkRoomConflict: async (
    Date,
    StartTime,
    EndTime,
    Room,
    excludeId = null
  ) => {
    let query = `
      SELECT t.TimeslotID FROM timeslot t
      WHERE t.Date = ?
        AND t.StartTime < ? AND t.EndTime > ?
    `;

    const params = [Date, EndTime, StartTime];

    if (excludeId) {
      query += ` AND t.TimeslotID != ?`;
      params.push(excludeId);
    }

    const [conflicts] = await pool.execute(query, params);
    return conflicts.length > 0;
  },

  // Lấy lịch học của học viên (qua sessiontimeslot)
  getLearnerSchedule: async (learnerId) => {
    const query = `
      SELECT 
        t.TimeslotID,
        t.StartTime,
        t.EndTime,
        t.Date,
        s.Title as sessionTitle,
        s.Description as sessionDescription,
        c.Title as courseTitle,
        c.Duration as courseDuration,
        i.FullName as instructorName,
        cl.ZoomURL,
        st.sessiontimeslotID
      FROM enrollment e
      INNER JOIN \`class\` cl ON e.ClassID = cl.ClassID AND e.Status = 'Paid'
      INNER JOIN session s ON s.ClassID = cl.ClassID
      INNER JOIN sessiontimeslot st ON st.SessionID = s.SessionID
      INNER JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      INNER JOIN course c ON cl.CourseID = c.CourseID
      INNER JOIN instructor i ON s.InstructorID = i.InstructorID
      WHERE e.LearnerID = ?
      ORDER BY t.Date, t.StartTime
    `;

    const [schedule] = await pool.execute(query, [learnerId]);
    return schedule;
  },
};

module.exports = Timeslot;
