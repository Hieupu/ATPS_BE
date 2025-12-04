const pool = require("../config/db");

/**
 * InstructorTimeslotRepository - dbver5
 *
 * Bảng mới: Quản lý Lịch BẬN ĐỂ DẠY của giảng viên
 * Status:
 *   - AVAILABLE: Giảng viên chọn để dạy (parttime tự thêm lịch dạy)
 *   - OTHER: Lịch dạy đã được book và chuyển vào session
 *   - HOLIDAY: Ngày nghỉ lễ
 * Khác với session (Lịch DẠY đã được book)
 */
class InstructorTimeslotRepository {
  // Tạo lịch bận để dạy mới
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
      Status || "AVAILABLE",
      Note || null,
    ]);

    return result;
  }

  // Tạo nhiều lịch bận để dạy cùng lúc (bulk insert)
  async createBulk(instructorTimeslots) {
    if (!instructorTimeslots || instructorTimeslots.length === 0) {
      return { affectedRows: 0 };
    }

    const placeholders = instructorTimeslots
      .map(() => "(?, ?, ?, ?, ?)")
      .join(", ");
    const values = instructorTimeslots.flatMap((it) => [
      it.InstructorID,
      it.TimeslotID,
      it.Date,
      it.Status || "AVAILABLE",
      it.Note || null,
    ]);

    const query = `
      INSERT INTO instructortimeslot (
        InstructorID, TimeslotID, Date, Status, Note
      ) VALUES ${placeholders}
    `;

    const [result] = await pool.execute(query, values);
    return result;
  }

  // Xóa tất cả lịch bận để dạy trong khoảng ngày (trừ HOLIDAY và OTHER)
  async deleteByDateRange(
    instructorId,
    startDate,
    endDate,
    excludeStatuses = ["HOLIDAY", "OTHER"]
  ) {
    let query = `
      DELETE FROM instructortimeslot 
      WHERE InstructorID = ? 
        AND Date >= ? 
        AND Date <= ?
    `;

    const params = [instructorId, startDate, endDate];

    if (excludeStatuses && excludeStatuses.length > 0) {
      const placeholders = excludeStatuses.map(() => "?").join(", ");
      query += ` AND UPPER(Status) NOT IN (${placeholders})`;
      params.push(...excludeStatuses.map((s) => s.toUpperCase()));
    }

    const [result] = await pool.execute(query, params);
    return result;
  }

  // Lấy lịch bận để dạy theo khoảng ngày với status cụ thể
  async findByDateRangeWithStatus(
    startDate,
    endDate,
    instructorId = null,
    status = null
  ) {
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

    if (status) {
      query += " AND UPPER(it.Status) = ?";
      params.push(status.toUpperCase());
    }

    query += " ORDER BY it.Date ASC, t.StartTime ASC";

    const [rows] = await pool.execute(query, params);
    return rows;
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
      query += " AND UPPER(it.Status) = ?";
      params.push(status.toUpperCase());
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
    const [rows] = await pool.execute(query, params);

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

  async findLeaves({
    instructorId,
    status,
    startDate,
    endDate,
    limit = 20,
    offset = 0,
  }) {
    let query = `
      SELECT 
        it.InstructortimeslotID,
        it.InstructorID,
        it.TimeslotID,
        it.Date,
        it.Status,
        it.Note,
        t.Day,
        t.StartTime,
        t.EndTime
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      WHERE 1=1
    `;

    const params = [];

    if (instructorId) {
      query += " AND it.InstructorID = ?";
      params.push(instructorId);
    }

    if (status) {
      query += " AND UPPER(it.Status) = ?";
      params.push(status.toUpperCase());
    }

    if (startDate) {
      query += " AND it.Date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND it.Date <= ?";
      params.push(endDate);
    }

    query += " ORDER BY it.Date DESC, t.StartTime ASC";
    query += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async countLeaves({ instructorId, status, startDate, endDate }) {
    let query = `
      SELECT COUNT(*) as total
      FROM instructortimeslot it
      WHERE 1=1
    `;
    const params = [];

    if (instructorId) {
      query += " AND it.InstructorID = ?";
      params.push(instructorId);
    }

    if (status) {
      query += " AND it.Status = ?";
      params.push(status);
    }

    if (startDate) {
      query += " AND it.Date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND it.Date <= ?";
      params.push(endDate);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0]?.total || 0;
  }
}

module.exports = new InstructorTimeslotRepository();
