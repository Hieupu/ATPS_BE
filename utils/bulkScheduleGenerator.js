const { getDayOfWeek } = require("./sessionValidation");
const timeslotRepository = require("../repositories/timeslotRepository");

/**
 * Hàm Tạo Lịch Hàng loạt
 * Tạo nhiều sessions từ OpendatePlan, Numofsession, và danh sách SelectedTimeslotIDs
 * 
 * @param {Object} config
 * @param {string} config.OpendatePlan - Ngày bắt đầu dự kiến (YYYY-MM-DD)
 * @param {number} config.Numofsession - Số buổi học
 * @param {number} config.InstructorID - ID giảng viên
 * @param {number} config.ClassID - ID lớp học
 * @param {Array<number>} config.SelectedTimeslotIDs - Mảng các TimeslotID (ví dụ: [1, 2] cho T3-Ca4, T5-Ca4)
 * @returns {Array<Object>} - Mảng sessions đã được tạo
 */
async function generateBulkSchedule(config) {
  const {
    OpendatePlan,
    Numofsession,
    InstructorID,
    ClassID,
    SelectedTimeslotIDs,
  } = config;

  // Validate input
  if (!OpendatePlan || !Numofsession || !InstructorID || !ClassID) {
    throw new Error("Thiếu thông tin bắt buộc: OpendatePlan, Numofsession, InstructorID, ClassID");
  }

  if (!SelectedTimeslotIDs || SelectedTimeslotIDs.length === 0) {
    throw new Error("Phải chọn ít nhất một ca học");
  }

  // Lấy thông tin các timeslots
  const timeslots = [];
  for (const timeslotId of SelectedTimeslotIDs) {
    const timeslot = await timeslotRepository.findById(timeslotId);
    if (!timeslot) {
      throw new Error(`Timeslot với ID ${timeslotId} không tồn tại`);
    }
    timeslots.push(timeslot);
  }

  // Tạo sessions theo pattern
  const sessions = [];
  const startDate = new Date(OpendatePlan);
  let sessionNumber = 1;
  let currentDate = new Date(startDate);
  const maxIterations = Numofsession * 7; // Giới hạn số lần lặp để tránh vòng lặp vô hạn

  // Tạo map để theo dõi số buổi đã tạo cho mỗi timeslot
  const timeslotCount = new Map();
  SelectedTimeslotIDs.forEach((id) => timeslotCount.set(id, 0));

  let iterations = 0;
  while (sessionNumber <= Numofsession && iterations < maxIterations) {
    iterations++;

    // Lấy thứ trong tuần của ngày hiện tại
    const dayOfWeek = getDayOfWeek(formatDate(currentDate));

    // Tìm timeslot phù hợp với thứ này
    for (const timeslot of timeslots) {
      if (timeslot.Day === dayOfWeek) {
        // Kiểm tra xem đã tạo đủ số buổi cho timeslot này chưa
        const count = timeslotCount.get(timeslot.TimeslotID) || 0;
        const expectedCount = Math.ceil(Numofsession / SelectedTimeslotIDs.length);

        // Nếu chưa đủ, tạo session
        if (count < expectedCount && sessionNumber <= Numofsession) {
          sessions.push({
            Title: `Buổi ${sessionNumber}`,
            Description: `Buổi học thứ ${sessionNumber}`,
            ClassID: ClassID,
            InstructorID: InstructorID,
            TimeslotID: timeslot.TimeslotID,
            Date: formatDate(currentDate),
          });

          timeslotCount.set(
            timeslot.TimeslotID,
            (timeslotCount.get(timeslot.TimeslotID) || 0) + 1
          );
          sessionNumber++;
        }
      }
    }

    // Chuyển sang ngày tiếp theo
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (sessions.length < Numofsession) {
    console.warn(
      `Chỉ tạo được ${sessions.length}/${Numofsession} buổi học. Có thể do không đủ ngày phù hợp với lịch.`
    );
  }

  return sessions;
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Preview lịch học trước khi tạo
 * @param {Object} config - Cùng config như generateBulkSchedule
 * @returns {Object} - Preview information
 */
async function previewBulkSchedule(config) {
  const sessions = await generateBulkSchedule(config);

  return {
    totalSessions: sessions.length,
    expectedSessions: config.Numofsession,
    sessions: sessions.map((s, index) => ({
      number: index + 1,
      date: s.Date,
      title: s.Title,
      timeslotId: s.TimeslotID,
    })),
  };
}

module.exports = {
  generateBulkSchedule,
  previewBulkSchedule,
};

