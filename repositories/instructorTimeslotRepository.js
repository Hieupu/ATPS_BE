const pool = require("../config/db");

/**
 * InstructorTimeslotRepository - dbver5
 *
 * Bảng mới: Quản lý Lịch NGHỈ của giảng viên
 * Khác với session (Lịch DẠY)
 */
class InstructorTimeslotRepository {
  // Tạo lịch nghỉ mới
  async create(instructorTimeslotData) {
    const { InstructorID, TimeslotID, Date, Status, Note } =
      instructorTimeslotData;

    const query = `
      INSERT INTO instructortimeslot (
        InstructorID, TimeslotID, Date, Status, Note
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      InstructorID,
      TimeslotID,
      Date,
      Status || "Holiday",
      Note || null,
    ]);

    return result;
  }

  // Lấy lịch nghỉ theo ID
  async findById(id) {
    if (!id) {
      throw new Error("InstructorTimeslotID là bắt buộc");
    }
    const query = `
      SELECT 
        it.*,
        t.StartTime,
        t.EndTime,
        t.Day,
        i.FullName as InstructorName
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON it.InstructorID = i.InstructorID
      WHERE it.InstructortimeslotID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  // Lấy tất cả lịch nghỉ
  async findAll(options = {}) {
    const { instructorId, date, status } = options;
    let query = `
      SELECT 
        it.*,
        t.StartTime,
        t.EndTime,
        t.Day,
        i.FullName as InstructorName
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON it.InstructorID = i.InstructorID
      WHERE 1=1
    `;

    const params = [];

    if (instructorId) {
      query += " AND it.InstructorID = ?";
      params.push(instructorId);
    }

    if (date) {
      query += " AND it.Date = ?";
      params.push(date);
    }

    if (status) {
      query += " AND it.Status = ?";
      params.push(status);
    }

    query += " ORDER BY it.Date ASC, t.StartTime ASC";

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Kiểm tra xung đột: Giảng viên có nghỉ vào ca này không
  async checkConflict(instructorId, timeslotId, date) {
    const query = `
      SELECT 
        it.*,
        t.StartTime,
        t.EndTime,
        t.Day,
        i.FullName as InstructorName
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON it.InstructorID = i.InstructorID
      WHERE it.InstructorID = ?
        AND it.TimeslotID = ?
        AND it.Date = ?
    `;

    const params = [instructorId, timeslotId, date];
    console.log(
      `[instructorTimeslotRepository.checkConflict] Query:`,
      query.replace(/\s+/g, " ").trim()
    );
    console.log(
      `[instructorTimeslotRepository.checkConflict] Params:`,
      params
    );

    const [rows] = await pool.execute(query, params);
    console.log(
      `[instructorTimeslotRepository.checkConflict] Kết quả: ${rows.length} rows`,
      rows.length > 0 ? rows[0] : "null"
    );

    return rows.length > 0 ? rows[0] : null;
  }

  // Kiểm tra xung đột với session (giảng viên đã có lịch dạy)
  async checkSessionConflict(instructorId, timeslotId, date) {
    const query = `
      SELECT 
        s.*,
        t.StartTime,
        t.EndTime,
        c.Name as ClassName
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      LEFT JOIN \`class\` c ON s.ClassID = c.ClassID
      WHERE s.InstructorID = ?
        AND s.TimeslotID = ?
        AND s.Date = ?
    `;

    const [rows] = await pool.execute(query, [instructorId, timeslotId, date]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Cập nhật lịch nghỉ
  async update(id, updateData) {
    if (!id) {
      throw new Error("InstructorTimeslotID là bắt buộc");
    }
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error("UpdateData không được rỗng");
    }
    const fields = Object.keys(updateData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const query = `
      UPDATE instructortimeslot 
      SET ${fields}
      WHERE InstructortimeslotID = ?
    `;

    const [result] = await pool.execute(query, values);
    return result;
  }

  // Xóa lịch nghỉ
  async delete(id) {
    if (!id) {
      throw new Error("InstructorTimeslotID là bắt buộc");
    }
    const query = `DELETE FROM instructortimeslot WHERE InstructortimeslotID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result;
  }

  // Lấy lịch nghỉ theo khoảng ngày
  async findByDateRange(startDate, endDate, instructorId = null) {
    let query = `
      SELECT 
        it.*,
        t.StartTime,
        t.EndTime,
        t.Day,
        i.FullName as InstructorName
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      LEFT JOIN instructor i ON it.InstructorID = i.InstructorID
      WHERE it.Date >= ? AND it.Date <= ?
    `;

    const params = [startDate, endDate];

    if (instructorId) {
      query += " AND it.InstructorID = ?";
      params.push(instructorId);
    }

    query += " ORDER BY it.Date ASC, t.StartTime ASC";

    const [rows] = await pool.execute(query, params);
    return rows;
  }
}

module.exports = new InstructorTimeslotRepository();
