/**
 * InstructorTimeslot Model - dbver5
 * 
 * Bảng mới: Quản lý Lịch NGHỈ của giảng viên
 * Khác với session (Lịch DẠY)
 * 
 * Mục đích:
 * - Block các ca học khi giảng viên nghỉ (Holiday, PersonalLeave, ...)
 * - Backend sẽ tự động kiểm tra xung đột khi tạo session
 */
class InstructorTimeslot {
  constructor({
    InstructortimeslotID,
    InstructorID,
    TimeslotID,
    Date,
    Status,  // 'Holiday', 'PersonalLeave', ...
    Note,
  }) {
    this.InstructortimeslotID = InstructortimeslotID;
    this.InstructorID = InstructorID;
    this.TimeslotID = TimeslotID;
    this.Date = Date;
    this.Status = Status || 'Holiday';
    this.Note = Note || null;
  }
}

module.exports = InstructorTimeslot;

