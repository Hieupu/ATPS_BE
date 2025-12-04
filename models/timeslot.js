/**
 * - Day: Thứ trong tuần (T2, T3, T4, T5, T6, T7, CN)
 * 
 * Day là "Khung Cố định" của trung tâm.
 * Khi tạo session, Date phải khớp với Day của TimeslotID.
 */
class Timeslot {
  constructor({ TimeslotID, StartTime, EndTime, Day }) {
    this.TimeslotID = TimeslotID;
    this.StartTime = StartTime;
    this.EndTime = EndTime;
    this.Day = Day || null; // dbver5: Thứ trong tuần (T2, T3, T4, T5, T6, T7, CN)
  }
}

module.exports = Timeslot;
