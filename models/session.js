/**
 * Session Model - dbver5
 * 
 * Trường mới (dbver5):
 * - ZoomUUID: UUID phòng Zoom cho session
 * 
 * Lưu ý:
 * - Backend sẽ tự động tạo ZoomUUID nếu FE không gửi
 * - Date phải khớp với Day của TimeslotID (validation)
 */
class Session {
  constructor({
    SessionID,
    Title,
    Description,
    InstructorID,
    ClassID,
    TimeslotID,
    Date,
    ZoomUUID, // dbver5: UUID phòng Zoom
  }) {
    this.SessionID = SessionID;
    this.Title = Title;
    this.Description = Description;
    this.InstructorID = InstructorID;
    this.ClassID = ClassID;
    this.TimeslotID = TimeslotID;
    this.Date = Date;
    this.ZoomUUID = ZoomUUID || null; // dbver5
  }
}

module.exports = Session;
