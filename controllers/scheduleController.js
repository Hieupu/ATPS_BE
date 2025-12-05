const scheduleService = require("../services/scheduleService");
const courseRepository = require("../repositories/courseRepository");
const axios = require("axios");

class ScheduleController {
  async getLearnerSchedule(req, res) {
    try {
      const { learnerId } = req.params;

      if (!learnerId) {
        return res.status(400).json({ message: "Learner ID is required" });
      }

      const schedules = await scheduleService.getLearnerSchedule(learnerId);
      return res.json({ schedules });
    } catch (error) {
      console.error("Error in getLearnerSchedule:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getInstructorSchedule(req, res) {
    try {
      const { instructorId } = req.params;

      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required" });
      }

      const schedules = await scheduleService.getInstructorSchedule(
        instructorId
      );
      return res.json({ schedules });
    } catch (error) {
      console.error("Error in getInstructorSchedule:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await scheduleService.getSessionDetails(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      return res.json({ session });
    } catch (error) {
      console.error("Error in getSessionDetails:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async createSession(req, res) {
    try {
      const sessionData = req.body;

      const session = await scheduleService.createSession(sessionData);

      return res.status(201).json({
        message: "Session created successfully",
        session,
      });
    } catch (error) {
      console.error("Error in createSession:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async getAvailableInstructorSlots(req, res) {
    try {
      const { instructorId } = req.params;

      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required" });
      }

      const slots = await scheduleService.getAvailableInstructorSlots(
        instructorId
      );
      return res.json({ slots });
    } catch (error) {
      console.error("Error in getAvailableInstructorSlots:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getInstructorWeeklySchedule(req, res) {
    try {
      const { instructorId } = req.params;
      const { weekStartDate } = req.query;

      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required" });
      }

      if (!weekStartDate) {
        return res.status(400).json({ message: "weekStartDate is required" });
      }

      const schedule = await scheduleService.getInstructorWeeklySchedule(
        instructorId,
        weekStartDate
      );
      return res.json({ schedule });
    } catch (error) {
      console.error("Error in getInstructorWeeklySchedule:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }


async checkScheduleConflict(req, res) {
  try {
    console.log('=== checkScheduleConflict START ===');
    const { classId } = req.params;
    const accId = req.user?.id || req.user?.AccID || req.user?.AccountID;
    const learnerId = await courseRepository.getLearnerIdByAccountId(accId);

    console.log('Request params:', { classId });
    console.log('Account ID:', accId);
    console.log('Learner ID:', learnerId);

    if (!classId || !learnerId) {
      console.log('❌ Missing required fields:', { classId, learnerId });
      return res.status(400).json({ 
        message: "Class ID and Learner ID are required"
      });
    }

    // Lấy lịch học
    console.log('📅 Getting schedules...');
    const targetClassSchedule = await scheduleService.getClassSchedule(classId);
    const currentSchedule = await scheduleService.getLearnerSchedule(learnerId);

    console.log('Target class schedule length:', targetClassSchedule?.length);
    console.log('Current schedule length:', currentSchedule?.length);
    console.log('Target class schedule sample:', targetClassSchedule?.slice(0, 2));
    console.log('Current schedule sample:', currentSchedule?.slice(0, 2));

    const conflicts = [];

    // Hàm chuyển time sang phút
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    // Kiểm tra trùng lịch
    console.log('🔍 Checking for conflicts...');
    let checkCount = 0;
    
    for (const targetSession of targetClassSchedule) {
      const targetDate = new Date(targetSession.Date).toISOString().split('T')[0];
      
      for (const currentSession of currentSchedule) {
        checkCount++;
        const currentDate = new Date(currentSession.Date).toISOString().split('T')[0];
        
        if (targetDate === currentDate) {
          const targetStart = timeToMinutes(targetSession.StartTime);
          const targetEnd = timeToMinutes(targetSession.EndTime);
          const currentStart = timeToMinutes(currentSession.StartTime);
          const currentEnd = timeToMinutes(currentSession.EndTime);

          console.log(`Comparing: ${targetDate} ${targetSession.StartTime}-${targetSession.EndTime} vs ${currentSession.StartTime}-${currentSession.EndTime}`);
          console.log(`Time in minutes - Target: ${targetStart}-${targetEnd}, Current: ${currentStart}-${currentEnd}`);

          // Kiểm tra overlap
          const hasOverlap = targetStart < currentEnd && targetEnd > currentStart;
          console.log(`Has overlap: ${hasOverlap}`);

          if (hasOverlap) {
            console.log('🚨 CONFLICT FOUND!');
            conflicts.push({
              ClassName: currentSession.ClassName,
              Schedule: `${currentDate} ${currentSession.StartTime}-${currentSession.EndTime}`,
              InstructorName: currentSession.InstructorName
            });
          }
        }
      }
    }

    console.log(`Total comparisons made: ${checkCount}`);
    console.log(`Conflicts found: ${conflicts.length}`);
    console.log('Conflicts details:', conflicts);

    return res.json({
      hasConflict: conflicts.length > 0,
      conflictingClasses: conflicts
    });

  } catch (error) {
    console.error("❌ Error in checkScheduleConflict:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    console.log('=== checkScheduleConflict END ===');
  }
}

async checkTimeslotConflict(req, res) {
  try {
    console.log('=== checkTimeslotConflict START ===');
    const { timeslotId } = req.params;
    const { date } = req.query;
    const accId = req.user?.id || req.user?.AccID || req.user?.AccountID;
    const learnerId = await courseRepository.getLearnerIdByAccountId(accId);

    console.log('Request params:', { timeslotId, date });
    console.log('Account ID:', accId);
    console.log('Learner ID:', learnerId);

    if (!timeslotId || !learnerId || !date) {
      console.log('❌ Missing required fields:', { timeslotId, learnerId, date });
      return res.status(400).json({ 
        message: "Timeslot ID, Learner ID and Date are required"
      });
    }

    // Lấy thông tin timeslot
    console.log('📅 Getting timeslot info...');
    const targetTimeslot = await scheduleService.getTimeslotById(timeslotId);
    console.log('Target timeslot:', targetTimeslot);
    
    if (!targetTimeslot) {
      console.log('❌ Timeslot not found');
      return res.status(404).json({ message: "Timeslot not found" });
    }

    // Lấy lịch học hiện tại
    const currentSchedule = await scheduleService.getLearnerSchedule(learnerId);
    console.log('Current schedule length:', currentSchedule?.length);
    console.log('Current schedule sample:', currentSchedule?.slice(0, 2));

    // Normalize date
    const targetDate = new Date(date).toISOString().split('T')[0];
    console.log('Normalized target date:', targetDate);

    // Hàm chuyển time sang phút
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    const targetStart = timeToMinutes(targetTimeslot.StartTime);
    const targetEnd = timeToMinutes(targetTimeslot.EndTime);
    console.log(`Target timeslot time: ${targetTimeslot.StartTime}-${targetTimeslot.EndTime} (${targetStart}-${targetEnd} minutes)`);

    const conflicts = [];

    // Kiểm tra conflict
    console.log('🔍 Checking for conflicts...');
    let checkCount = 0;
    
    for (const currentSession of currentSchedule) {
      if (!currentSession.Date) {
        console.log('Skipping session with no date:', currentSession);
        continue;
      }
      
      const currentDate = new Date(currentSession.Date).toISOString().split('T')[0];
      checkCount++;
      
      if (targetDate === currentDate) {
        const currentStart = timeToMinutes(currentSession.StartTime);
        const currentEnd = timeToMinutes(currentSession.EndTime);

        console.log(`Comparing: ${targetDate} ${targetTimeslot.StartTime}-${targetTimeslot.EndTime} vs ${currentSession.StartTime}-${currentSession.EndTime}`);
        console.log(`Time in minutes - Target: ${targetStart}-${targetEnd}, Current: ${currentStart}-${currentEnd}`);

        // Kiểm tra overlap
        const hasOverlap = targetStart < currentEnd && targetEnd > currentStart;
        console.log(`Has overlap: ${hasOverlap}`);

        if (hasOverlap) {
          console.log('🚨 CONFLICT FOUND!');
          conflicts.push({
            ClassName: currentSession.ClassName,
            Schedule: `${currentDate} ${currentSession.StartTime}-${currentSession.EndTime}`,
            InstructorName: currentSession.InstructorName
          });
        }
      }
    }

    console.log(`Total comparisons made: ${checkCount}`);
    console.log(`Conflicts found: ${conflicts.length}`);
    console.log('Conflicts details:', conflicts);

    return res.json({
      hasConflict: conflicts.length > 0,
      conflictingClasses: conflicts,
      targetTimeslot: {
        ...targetTimeslot,
        date: targetDate
      }
    });

  } catch (error) {
    console.error("❌ Error in checkTimeslotConflict:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    console.log('=== checkTimeslotConflict END ===');
  }
}

// 🧠 THÊM HÀM NÀY VÀO FILE HIỆN TẠI (đặt trước hàm createOneOnOneBooking)

async createOneOnOneBooking(req, res) {
    try {
      const {
        InstructorID,
        CourseID,
        TimeslotIDs, // Array of slot IDs
        SelectedSlots, // Array of {TimeslotID, Date} - từ frontend
        bookingDate,
      } = req.body;

      // ========== LOG DỮ LIỆU TỪ FRONT-END ==========
      console.log("====== FRONT-END DATA RECEIVED ======");
      console.log("Request Body:", JSON.stringify(req.body, null, 2));
      console.log("InstructorID:", InstructorID);
      console.log("CourseID:", CourseID);
      console.log("TimeslotIDs:", TimeslotIDs);
      console.log("SelectedSlots:", SelectedSlots);
      console.log("bookingDate:", bookingDate);
      console.log("User from token:", req.user);
      console.log("=====================================");

      if (
        !InstructorID ||
        !TimeslotIDs ||
        !Array.isArray(TimeslotIDs) ||
        TimeslotIDs.length === 0
      ) {
        return res.status(400).json({
          message:
            "Thiếu InstructorID hoặc TimeslotIDs (phải là mảng không rỗng)",
        });
      }

      if (!CourseID) {
        return res.status(400).json({ message: "CourseID là bắt buộc" });
      }

      if (!bookingDate) {
        return res.status(400).json({ message: "bookingDate là bắt buộc" });
      }

      // Lấy Learner từ tài khoản đăng nhập
      const connectDB = require("../config/db");
      const pool = await connectDB();

      const accId = req.user?.id;
      if (!accId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // ========== LOG DATABASE QUERY: LEARNER ==========
      console.log("====== DATABASE QUERY: LEARNER ======");
      console.log("Query: SELECT * FROM learner WHERE AccID = ?");
      console.log("Parameters:", [accId]);

      const [learners] = await pool.query(
        "SELECT * FROM learner WHERE AccID = ?",
        [accId]
      );
      
      console.log("Learner Result:", JSON.stringify(learners, null, 2));
      console.log("=====================================");

      if (!learners.length) {
        return res.status(404).json({ message: "Learner not found" });
      }
      const learnerId = learners[0].LearnerID;

      // ========== LOG DATABASE QUERY: COURSE ==========
      console.log("====== DATABASE QUERY: COURSE ======");
      console.log("Query: SELECT Title, Duration FROM course WHERE CourseID = ? AND InstructorID = ?");
      console.log("Parameters:", [CourseID, InstructorID]);

      const [courses] = await pool.query(
        "SELECT Title, Duration FROM course WHERE CourseID = ? AND InstructorID = ?",
        [CourseID, InstructorID]
      );
      
      console.log("Course Result:", JSON.stringify(courses, null, 2));
      console.log("=====================================");

      if (!courses.length) {
        return res.status(404).json({
          message: "Course not found or not belong to this instructor",
        });
      }
      const courseTitle = courses[0].Title;

      // Tính tổng thời gian của khóa học (phút) - lấy trực tiếp từ course.Duration
const totalDurationMinutes = parseFloat(courses[0].Duration || 0) * 60;
      console.log("Course Duration (minutes):", totalDurationMinutes);

      if (!totalDurationMinutes || totalDurationMinutes === 0) {
        return res
          .status(400)
          .json({ message: "Khóa học chưa có duration hợp lệ" });
      }

      // Lấy thông tin các timeslots đã chọn
      const placeholders = TimeslotIDs.map(() => "?").join(",");
      
      // ========== LOG DATABASE QUERY: TIMESLOTS ==========
      console.log("====== DATABASE QUERY: TIMESLOTS ======");
      console.log(`Query: SELECT TimeslotID, Day, StartTime, EndTime FROM timeslot WHERE TimeslotID IN (${placeholders})`);
      console.log("Parameters:", TimeslotIDs);

      const [timeslotsRaw] = await pool.query(
        `SELECT TimeslotID, Day, StartTime, EndTime FROM timeslot WHERE TimeslotID IN (${placeholders})`,
        TimeslotIDs
      );

      console.log("Timeslots Result:", JSON.stringify(timeslotsRaw, null, 2));
      console.log("=====================================");

      if (timeslotsRaw.length !== TimeslotIDs.length) {
        return res.status(400).json({ message: "Một số slot không hợp lệ" });
      }

      // Tính thời gian mỗi slot (phút)
      const slotDurationsRaw = timeslotsRaw.map((slot) => {
        // Xử lý StartTime và EndTime (có thể là string hoặc object TIME từ MySQL)
        let startTimeStr = slot.StartTime || "00:00:00";
        let endTimeStr = slot.EndTime || "00:00:00";

        console.log(`Processing Timeslot ${slot.TimeslotID}:`);
        console.log("  Raw StartTime:", slot.StartTime, "Type:", typeof slot.StartTime);
        console.log("  Raw EndTime:", slot.EndTime, "Type:", typeof slot.EndTime);

        // Nếu là object TIME từ MySQL, convert sang string
        if (startTimeStr && typeof startTimeStr === "object") {
          const hours = String(
            startTimeStr.hours || startTimeStr.getHours?.() || 0
          ).padStart(2, "0");
          const minutes = String(
            startTimeStr.minutes || startTimeStr.getMinutes?.() || 0
          ).padStart(2, "0");
          startTimeStr = `${hours}:${minutes}:00`;
          console.log("  Converted StartTime:", startTimeStr);
        }

        if (endTimeStr && typeof endTimeStr === "object") {
          const hours = String(
            endTimeStr.hours || endTimeStr.getHours?.() || 0
          ).padStart(2, "0");
          const minutes = String(
            endTimeStr.minutes || endTimeStr.getMinutes?.() || 0
          ).padStart(2, "0");
          endTimeStr = `${hours}:${minutes}:00`;
          console.log("  Converted EndTime:", endTimeStr);
        }

        const [startHour, startMin] = startTimeStr
          .split(":")
          .slice(0, 2)
          .map(Number);
        const [endHour, endMin] = endTimeStr.split(":").slice(0, 2).map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = Math.max(0, endMinutes - startMinutes);
        
        console.log(`  Calculated Duration: ${duration} minutes`);
        return duration; // Duration in minutes
      });

      console.log("Final Slot Durations:", slotDurationsRaw);

      // Sắp xếp slots theo thứ tự trong tuần (Monday = 0, Sunday = 6)
      // Kết hợp timeslot và duration để sort cùng nhau
      const dayOrder = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      };

      // Kết hợp slot với duration trước khi sort
      const slotsWithDuration = timeslotsRaw.map((slot, index) => ({
        slot: slot,
        duration: slotDurationsRaw[index],
      }));

      slotsWithDuration.sort((a, b) => {
        const dayA = dayOrder[a.slot.Day] ?? 99;
        const dayB = dayOrder[b.slot.Day] ?? 99;
        return dayA - dayB;
      });

      // Tách lại sau khi sort (dùng biến mới để tránh lỗi const)
      const timeslots = slotsWithDuration.map((item) => item.slot);
      const slotDurations = slotsWithDuration.map((item) => item.duration);

      console.log("Sorted Timeslots:", timeslots.map(t => ({ id: t.TimeslotID, day: t.Day })));
      console.log("Sorted Durations:", slotDurations);

      // Validation: Có thể chọn từ 1 đến 3 slots và tất cả phải cùng 1 tuần
      if (
        !SelectedSlots ||
        !Array.isArray(SelectedSlots) ||
        SelectedSlots.length === 0
      ) {
        return res.status(400).json({
          message: "Vui lòng chọn ít nhất 1 slot trong cùng 1 tuần",
        });
      }

      if (SelectedSlots.length > 3) {
        return res.status(400).json({
          message: `Không được chọn quá 3 slots trong 1 tuần. Hiện tại đã chọn ${SelectedSlots.length} slot(s).`,
        });
      }

      // Hàm helper để tính tuần (tuần bắt đầu từ thứ 2 - Monday)
      const getWeekKey = (dateStr) => {
        const date = new Date(dateStr + "T00:00:00");
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Chuyển đổi: Monday = 0, Tuesday = 1, ..., Sunday = 6
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        // Tính ngày thứ 2 của tuần
        const monday = new Date(date);
        monday.setDate(date.getDate() - mondayOffset);
        // Trả về key là ngày thứ 2 của tuần (YYYY-MM-DD)
        return monday.toISOString().split("T")[0];
      };

      // Kiểm tra tất cả slots phải cùng 1 tuần
      const weekKeys = SelectedSlots.map((slot) => getWeekKey(slot.Date));
      const uniqueWeekKeys = [...new Set(weekKeys)];
      
      console.log("Selected Slots Week Keys:", weekKeys);
      console.log("Unique Week Keys:", uniqueWeekKeys);

      if (uniqueWeekKeys.length > 1) {
        return res.status(400).json({
          message:
            "Tất cả các slots phải nằm trong cùng 1 tuần. Vui lòng chọn lại.",
        });
      }

      // Sắp xếp SelectedSlots theo thứ tự trong tuần (theo Date và TimeslotID)
      // Tạo map để lấy thông tin timeslot cho việc sắp xếp
      const timeslotMapForSort = new Map();
      timeslots.forEach((slot) => {
        timeslotMapForSort.set(slot.TimeslotID, slot);
      });

      SelectedSlots.sort((a, b) => {
        // Sắp xếp theo Date trước
        const dateA = new Date(a.Date + "T00:00:00");
        const dateB = new Date(b.Date + "T00:00:00");
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        // Nếu cùng ngày, sắp xếp theo StartTime
        const slotA = timeslotMapForSort.get(a.TimeslotID);
        const slotB = timeslotMapForSort.get(b.TimeslotID);
        if (slotA && slotB) {
          const startTimeA = slotA.StartTime || "00:00:00";
          const startTimeB = slotB.StartTime || "00:00:00";
          return startTimeA.localeCompare(startTimeB);
        }
        return 0;
      });

      console.log("Sorted SelectedSlots:", SelectedSlots);

      // Tạo tên lớp
      const className = `1-on-1: ${courseTitle}`;
      console.log("Class Name:", className);

      // ========== LOG DATABASE QUERY: INSTRUCTOR FEE ==========
      console.log("====== DATABASE QUERY: INSTRUCTOR FEE ======");
      console.log("Query: SELECT InstructorFee FROM instructor WHERE InstructorID = ?");
      console.log("Parameters:", [InstructorID]);

      const [instructorFeeRow] = await pool.query(
        "SELECT InstructorFee FROM instructor WHERE InstructorID = ?",
        [InstructorID]
      );
      
      console.log("Instructor Fee Result:", JSON.stringify(instructorFeeRow, null, 2));
      console.log("=====================================");

      const instructorFee = parseFloat(instructorFeeRow[0]?.InstructorFee || 0);
      console.log("Instructor Fee:", instructorFee);

      // Tính thời gian mỗi slot (phút)
      const slotDurationMinutes =
        slotDurations.reduce((sum, d) => sum + d, 0) / slotDurations.length ||
        0;

      console.log("Average Slot Duration (minutes):", slotDurationMinutes);

      if (slotDurationMinutes === 0) {
        return res
          .status(400)
          .json({ message: "Không thể tính duration của slot" });
      }

      // Số buổi học = tổng duration của khóa học / duration mỗi slot (làm tròn lên)
      const numberOfSessions = Math.ceil(
        totalDurationMinutes / slotDurationMinutes
      );

      console.log("Number of Sessions Calculation:");
      console.log("  Total Duration:", totalDurationMinutes);
      console.log("  Slot Duration:", slotDurationMinutes);
      console.log("  Number of Sessions:", numberOfSessions);

      if (numberOfSessions === 0) {
        return res
          .status(400)
          .json({ message: "Không thể tính số buổi học từ duration" });
      }

      // Giá = InstructorFee × số buổi học
      const totalFee = instructorFee * numberOfSessions;
      console.log("Total Fee Calculation:");
      console.log("  Instructor Fee:", instructorFee);
      console.log("  Number of Sessions:", numberOfSessions);
      console.log("  Total Fee:", totalFee);

// Tính toán OpendatePlan và EnddatePlan từ SelectedSlots
const dates = SelectedSlots.map((s) => s.Date).sort();
const opendatePlan = dates[0];

const slotsPerWeek = SelectedSlots.length;
const numberOfWeeks = Math.ceil(numberOfSessions / slotsPerWeek);
const lastWeekSlotIndex = (numberOfSessions - 1) % slotsPerWeek;

// Xử lý timezone chính xác - SỬA LẠI
const parseLocalDate = (dateStr) => {
  // Sửa lại: Tạo date object với timezone cụ thể
  return new Date(dateStr + 'T00:00:00+07:00'); // UTC+7 cho Việt Nam
};

const firstDate = parseLocalDate(opendatePlan);
const lastSlotDate = parseLocalDate(SelectedSlots[lastWeekSlotIndex].Date);

// Tính ngày kết thúc
lastSlotDate.setDate(lastSlotDate.getDate() + (numberOfWeeks - 1) * 7);

// SỬA LỖI 1: Đổi từ const sang let
let enddatePlan = lastSlotDate.toISOString().split('T')[0];

// Validate kết quả - SỬA LẠI LOGIC
const startDateObj = parseLocalDate(opendatePlan);
const endDateObj = parseLocalDate(enddatePlan);

if (endDateObj < startDateObj) {
  console.log('⚠️ Điều chỉnh ngày kết thúc do lệch timezone');
  // Sửa: Sử dụng cùng logic format cho cả hai ngày
  enddatePlan = opendatePlan; // Với 1 buổi học, ngày kết thúc = ngày bắt đầu
}
            // ========== TẠO ZOOM MEETING TRỰC TIẾP ==========
console.log("====== CREATING ZOOM MEETING DIRECTLY ======");
let zoomMeetingData = null;

try {
  // 🎯 GỌI ZOOM API TRỰC TIẾP
  const accessToken = await getZoomAccessToken();
  
  // Chuyển đổi days từ "Monday,Wednesday,Friday" sang "2,4,6"
  const dayMap = {
    "Monday": "2",
    "Tuesday": "3", 
    "Wednesday": "4",
    "Thursday": "5",
    "Friday": "6",
    "Saturday": "7",
    "Sunday": "1"
  };
  
  const weeklyDays = timeslots.map(slot => dayMap[slot.Day]).join(",");
  
  const meetingData = {
    topic: className,
    type: 8, // Recurring meeting
    start_time: bookingDate + "T07:30:00", // ⚠️ Sửa theo StartTime thực tế (7:30 AM)
    timezone: "Asia/Ho_Chi_Minh",
    duration: slotDurationMinutes, // 90 phút
    recurrence: {
      type: 2, // Weekly
      repeat_interval: 1,
      weekly_days: weeklyDays, // "2,4,6" - tự động từ timeslots
      end_times: numberOfSessions, // Số buổi học
    },
    settings: {
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: false,
      approval_type: 0,
      auto_recording: "cloud",
    },
  };

  console.log("Zoom Meeting Data:", {
    topic: className,
    start_time: bookingDate + "T07:30:00",
    duration: slotDurationMinutes,
    weekly_days: weeklyDays,
    end_times: numberOfSessions
  });

  const zoomResponse = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    meetingData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  zoomMeetingData = zoomResponse.data;
  console.log("✅ Zoom Meeting Created:", {
    id: zoomMeetingData.id,
    password: zoomMeetingData.password,
    occurrences: zoomMeetingData.occurrences?.length || 0
  });
  
} catch (zoomError) {
  console.error("❌ Zoom API Error:", zoomError.response?.data || zoomError.message);
  // Vẫn tiếp tục tạo class dù Zoom fail (có thể tạo meeting sau)
  zoomMeetingData = null;
}

            // ========== TẠO MAP ZOOM OCCURRENCES THEO NGÀY ==========
            const zoomOccurrencesMap = new Map();
if (zoomMeetingData?.occurrences) {
  zoomMeetingData.occurrences.forEach(occurrence => {
    // Lấy date từ start_time (format: "2025-11-10T19:00:00+07:00")
    const occurrenceDate = occurrence.start_time.split('T')[0];
    zoomOccurrencesMap.set(occurrenceDate, occurrence.occurrence_id);
    console.log(`Mapped occurrence: ${occurrenceDate} -> ${occurrence.occurrence_id}`);
  });
}
console.log("=====================================");

      // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
       const connection = await pool.getConnection();
      await connection.beginTransaction();
      try {
     // ========== LOG DATABASE INSERT: CLASS (CẬP NHẬT) ==========
console.log("====== DATABASE INSERT: CLASS ======");
console.log("Query: INSERT INTO class (ZoomID, Zoompass, Status, CourseID, InstructorID, Name, Fee, Maxstudent, OpendatePlan, EnddatePlan, Numofsession)");
console.log("Parameters:", [
  zoomMeetingData?.id?.toString() || null, // ZoomID
  zoomMeetingData?.password || null, // Zoompass
  CourseID,
  InstructorID,
  className,
  totalFee,
  opendatePlan,
  enddatePlan,
  numberOfSessions,
]);

const [classInsert] = await connection.query(
  `INSERT INTO class (ZoomID, Zoompass, Status, CourseID, InstructorID, Name, Fee, Maxstudent, OpendatePlan, EnddatePlan, Numofsession)
   VALUES (?, ?, 'WAITING', ?, ?, ?, ?, 1, ?, ?, ?)`,
  [
    zoomMeetingData?.id?.toString() || null, // ZoomID (varchar(11))
    zoomMeetingData?.password || null, // Zoompass (varchar(6))
    CourseID,
    InstructorID,
    className,
    totalFee,
    opendatePlan,
    enddatePlan,
    numberOfSessions,
  ]
);
         const newClassId = classInsert.insertId;
        console.log("New Class ID:", newClassId);
        console.log("=====================================");

        // Tạo session ngay khi đăng ký
        const sessions = [];
        const sessionsTemp = [];

        // Tạo map để lấy thông tin timeslot
        const timeslotMap = new Map();
        timeslots.forEach((slot) => {
          timeslotMap.set(slot.TimeslotID, slot);
        });

        // Tính số tuần cần dựa trên số buổi học (mỗi tuần có số slots đã chọn)
        const slotsPerWeek = SelectedSlots.length; // Số slots đã chọn trong tuần đầu tiên
        const numberOfWeeks = Math.ceil(numberOfSessions / slotsPerWeek);

        console.log("Session Creation:");
        console.log("  Total Sessions to Create:", numberOfSessions);
        console.log("  Slots Per Week:", slotsPerWeek);
        console.log("  Number of Weeks:", numberOfWeeks);

        // Tạo sessions cho các tuần dựa trên các slots đã chọn
        for (let week = 0; week < numberOfWeeks; week++) {
          for (const selectedSlot of SelectedSlots) {
            // Dừng khi đã tạo đủ số buổi học
            if (sessionsTemp.length >= numberOfSessions) {
              break;
            }

            const timeslot = timeslotMap.get(selectedSlot.TimeslotID);
            if (!timeslot) continue;

            // Tính ngày của session trong tuần này
              const sessionDate = new Date(selectedSlot.Date);
    sessionDate.setDate(sessionDate.getDate() + week * 7);
    const sessionDateStr = sessionDate.toLocaleDateString("en-CA");

            // ========== LOG DATABASE INSERT: SESSION ==========

         const [sessionInsert] = await connection.query(
  `INSERT INTO session (Title, Description, InstructorID, TimeslotID, ClassID, Date, ZoomUUID)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    `Session: ${courseTitle}`,
    `Buổi học 1-1 với giảng viên [Khóa học: ${courseTitle}] [ORIGINAL_BOOKING:${selectedSlot.Date}_${selectedSlot.TimeslotID}]`,
    InstructorID,
    selectedSlot.TimeslotID,
    newClassId,
    sessionDateStr,
    zoomOccurrencesMap.get(sessionDateStr) || null, // ZoomUUID (occurrence_id)
  ]
);

            console.log("New Session ID:", sessionInsert.insertId);
            console.log("=====================================");

            sessionsTemp.push({
              sessionId: sessionInsert.insertId,
              date: sessionDateStr,
              dateObj: new Date(sessionDate.getTime()),
              timeslotId: selectedSlot.TimeslotID,
              startTime: timeslot.StartTime || "00:00:00",
              slotDuration: slotDurationMinutes,
            });
          }

          // Dừng khi đã tạo đủ số buổi học
          if (sessionsTemp.length >= numberOfSessions) {
            break;
          }
        }

        // Sắp xếp sessions theo ngày và thời gian bắt đầu
        sessionsTemp.sort((a, b) => {
          const dateDiff = a.dateObj.getTime() - b.dateObj.getTime();
          if (dateDiff !== 0) {
            return dateDiff;
          }
          return (a.startTime || "00:00:00").localeCompare(
            b.startTime || "00:00:00"
          );
        });

        console.log("Sorted Sessions:", sessionsTemp.map(s => ({
          id: s.sessionId,
          date: s.date,
          timeslotId: s.timeslotId
        })));

        // Cập nhật Title với số thứ tự đúng theo thứ tự thời gian
        for (let i = 0; i < sessionsTemp.length; i++) {
          const sessionInfo = sessionsTemp[i];
          const sessionNumber = i + 1;
          const sessionTitle = `Buổi ${sessionNumber}: ${courseTitle}`;

          await connection.query(
            `UPDATE session SET Title = ? WHERE SessionID = ?`,
            [sessionTitle, sessionInfo.sessionId]
          );

          sessions.push({
            sessionId: sessionInfo.sessionId,
            date: sessionInfo.date,
            timeslotId: sessionInfo.timeslotId,
            slotDuration: sessionInfo.slotDuration,
          });
        }

        // Cập nhật Numofsession, OpendatePlan, EnddatePlan của class
        if (sessions.length > 0) {
          const sortedDates = sessions.map((s) => s.date).sort();
          const actualOpendatePlan = sortedDates[0];
          const actualEnddatePlan = sortedDates[sortedDates.length - 1];

          await connection.query(
            `UPDATE class SET Numofsession = ?, OpendatePlan = ?, EnddatePlan = ? WHERE ClassID = ?`,
            [sessions.length, actualOpendatePlan, actualEnddatePlan, newClassId]
          );
        }

        const expectedNumOfSessions = sessions.length;
        console.log("Final Number of Sessions Created:", expectedNumOfSessions);

        // Tạo enrollment record với status 'Pending' - chờ thanh toán
        // Generate unique OrderCode (15 digits)
        const genOrderCode = () => {
          const base = Date.now(); // 13 digits
          const rand = Math.floor(Math.random() * 90) + 10; // 2 digits (10-99)
          const code = Number(`${base}${rand}`);
          return Math.min(code, 9007199254740991); // Max safe integer
        };
        const orderCode = genOrderCode();

        console.log("Generated Order Code:", orderCode);

        // ========== LOG DATABASE INSERT: ENROLLMENT ==========
        console.log("====== DATABASE INSERT: ENROLLMENT ======");
        console.log("Query: INSERT INTO enrollment (LearnerID, ClassID, EnrollmentDate, Status, OrderCode)");
        console.log("Parameters:", [learnerId, newClassId, orderCode]);

        const [enrollmentInsert] = await connection.query(
          `INSERT INTO enrollment (LearnerID, ClassID, EnrollmentDate, Status, OrderCode)
           VALUES (?, ?, NOW(), 'Pending', ?)`,
          [learnerId, newClassId, orderCode]
        );

        console.log("New Enrollment ID:", enrollmentInsert.insertId);
        console.log("=====================================");

        // Commit transaction trước khi tạo payment link
        await connection.commit();
        connection.release();

        // Tạo payment link ngay sau khi đăng ký
        let paymentUrl = null;
        try {
          const { PayOS } = require("@payos/node");
          const payos = new PayOS({
            clientId: process.env.PAYOS_CLIENT_ID,
            apiKey: process.env.PAYOS_API_KEY,
            checksumKey: process.env.PAYOS_CHECKSUM_KEY,
          });

          // ========== LOG DATABASE QUERY: LEARNER DETAILS ==========
          console.log("====== DATABASE QUERY: LEARNER DETAILS ======");
          console.log("Query: SELECT l.FullName, a.Email FROM learner l INNER JOIN account a ON l.AccID = a.AccID WHERE l.LearnerID = ?");
          console.log("Parameters:", [learnerId]);

          const [learnerRows] = await pool.query(
            `SELECT l.FullName, a.Email 
             FROM learner l 
             INNER JOIN account a ON l.AccID = a.AccID 
             WHERE l.LearnerID = ?`,
            [learnerId]
          );
          
          console.log("Learner Details Result:", JSON.stringify(learnerRows, null, 2));
          console.log("=====================================");

          const learner = learnerRows[0] || {};

          // PayOS chỉ cho phép description tối đa 25 ký tự
          const description = "Thanh toán lớp học".substring(0, 25);

          const paymentAmount = Math.round(totalFee);

          const paymentBody = {
            orderCode: orderCode,
            amount: paymentAmount,
            description: description,
            returnUrl: `${
              process.env.FRONTEND_URL
            }/payment-success?orderCode=${encodeURIComponent(orderCode)}`,
            cancelUrl: `${
              process.env.FRONTEND_URL
            }/payment-failed?orderCode=${encodeURIComponent(orderCode)}`,
            buyerName: learner.FullName || "Người học",
            buyerEmail: learner.Email || "unknown@example.com",
            buyerPhone: "0000000000",
          };

          console.log("Payment Body:", paymentBody);

          const createPaymentWithBody = async (body) => {
            if (
              typeof payos.paymentRequests?.createPaymentLink === "function"
            ) {
              return await payos.paymentRequests.createPaymentLink(body);
            }
            if (typeof payos.paymentRequests?.create === "function") {
              return await payos.paymentRequests.create(body);
            }
            if (typeof payos.paymentRequests?.init === "function") {
              return await payos.paymentRequests.init(body);
            }
            throw new Error("PayOS method not available");
          };

          const paymentLink = await createPaymentWithBody(paymentBody);
          paymentUrl = paymentLink.checkoutUrl || paymentLink.url;
          console.log("Payment URL Created:", paymentUrl);
        } catch (paymentError) {
          console.error("Error creating payment link:", paymentError);
          // Vẫn trả về response dù không tạo được payment link
        }

        // ========== FINAL RESPONSE DATA ==========
        console.log("====== FINAL RESPONSE DATA ======");
        console.log({
          message: "Đăng ký thành công! Vui lòng thanh toán để hoàn tất đăng ký.",
          classId: newClassId,
          enrollmentId: enrollmentInsert.insertId,
          sessions: sessions,
          totalSessions: expectedNumOfSessions,
          totalDurationMinutes: totalDurationMinutes,
          totalFee: totalFee,
          status: "Pending",
          orderCode: orderCode,
          paymentUrl: paymentUrl,
        });
        console.log("=====================================");

        // Trả về classId, sessions và payment link
        return res.status(201).json({
          message: "Đăng ký thành công! Vui lòng thanh toán để hoàn tất đăng ký.",
          classId: newClassId,
          enrollmentId: enrollmentInsert.insertId,
          sessions: sessions,
          totalSessions: expectedNumOfSessions,
          totalDurationMinutes: totalDurationMinutes,
          totalFee: totalFee,
          status: "Pending", // Chờ thanh toán
          orderCode: orderCode,
          paymentUrl: paymentUrl, // Link thanh toán
        });
      } catch (transactionError) {
        // Rollback transaction nếu có lỗi
        await connection.rollback();
        connection.release();
        console.error("Transaction Error:", transactionError);
        throw transactionError;
      }
    } catch (error) {
      console.error("Error in createOneOnOneBooking:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async getClassesByInstructor(req, res) {
    try {
      const { instructorId } = req.params;
      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required" });
      }
      const classes = await scheduleService.getClassesByInstructor(
        instructorId
      );
      return res.json({ classes });
    } catch (error) {
      console.error("Error in getClassesByInstructor:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async getClassSchedule(req, res) {
    try {
      const { classId } = req.params;
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }
      const schedules = await scheduleService.getClassSchedule(classId);
      return res.json({ schedules });
    } catch (error) {
      console.error("Error in getClassSchedule:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // booking-requests removed

  async getMyEnrollmentRequests(req, res) {
    try {
      const accountId = req.user?.id || req.user?.AccID || req.user?.AccountID;
      if (!accountId) {
        return res
          .status(401)
          .json({ message: "Unauthorized - Account ID not found" });
      }

      const requests =
        await scheduleService.getLearnerEnrollmentRequestsByAccountId(
          accountId
        );
      return res.json({ requests });
    } catch (error) {
      console.error("Error in getMyEnrollmentRequests:", error);
      if (error.message.includes("Không có hồ sơ học viên")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async cancelMyEnrollment(req, res) {
    try {
      const accountId = req.user?.id || req.user?.AccID || req.user?.AccountID;
      const { enrollmentId } = req.params;

      if (!accountId) {
        return res
          .status(401)
          .json({ message: "Unauthorized - Account ID not found" });
      }
      if (!enrollmentId) {
        return res.status(400).json({ message: "EnrollmentID is required" });
      }

      const result = await scheduleService.cancelEnrollmentByLearner(
        enrollmentId,
        accountId
      );
      return res.json(result);
    } catch (error) {
      console.error("Error in cancelMyEnrollment:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async getEnrollmentSessions(req, res) {
    try {
      const { enrollmentId } = req.params;

      if (!enrollmentId) {
        return res.status(400).json({ message: "EnrollmentID is required" });
      }

      const scheduleService = require("../services/scheduleService");
      const sessions = await scheduleService.getEnrollmentSessions(
        enrollmentId
      );

      return res.json({ sessions });
    } catch (error) {
      console.error("Error in getEnrollmentSessions:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async handleSessionAction(req, res) {
    try {
      const { sessionId } = req.params;
      const { action, classId, newTimeslotID, newDate, reason } = req.body;

      if (!action) {
        return res.status(400).json({
          message: "Action là bắt buộc",
        });
      }

      // Validate action
      if (!["confirm", "cancel", "reschedule"].includes(action)) {
        return res.status(400).json({
          message:
            "Action không hợp lệ. Phải là: confirm, cancel, hoặc reschedule",
        });
      }

      // Nếu là reschedule, cần có newTimeslotID và newDate
      if (action === "reschedule") {
        if (!newTimeslotID || !newDate) {
          return res.status(400).json({
            message: "Khi đổi lịch, cần cung cấp newTimeslotID và newDate",
          });
        }
      }

      // Nếu sessionId là "null" hoặc null, dùng classId từ body
      const actualSessionId =
        sessionId === "null" || !sessionId ? null : sessionId;

      // Xác định bên khởi tạo (instructor hay learner) dựa vào account trong token
      const accountId = req.user?.id || req.user?.AccID || req.user?.AccountID;
      let initiator = "learner";
      if (accountId) {
        try {
          const connectDB = require("../config/db");
          const db = await connectDB();
          const [inst] = await db.query(
            "SELECT InstructorID FROM instructor WHERE AccID = ?",
            [accountId]
          );
          if (inst && inst.length > 0) {
            initiator = "instructor";
          }
        } catch (_) {}
      }

      const result = await scheduleService.updateSessionAction({
        SessionID: actualSessionId,
        ClassID: classId,
        action,
        newTimeslotID,
        newDate,
        reason,
        initiator,
      });

      // Nếu action là confirm và có enrollment info, tạo notification và payment link
      if (action === "confirm" && result.enrollment) {
        try {
          const { PayOS } = require("@payos/node");
          const payos = new PayOS({
            clientId: process.env.PAYOS_CLIENT_ID,
            apiKey: process.env.PAYOS_API_KEY,
            checksumKey: process.env.PAYOS_CHECKSUM_KEY,
          });

          const notificationService = require("../services/notificationService");
          const connectDB = require("../config/db");
          const db = await connectDB();

          // Lấy thông tin learner
          const [learnerRows] = await db.query(
            `SELECT l.FullName, a.Email 
             FROM learner l 
             INNER JOIN account a ON l.AccID = a.AccID 
             WHERE l.LearnerID = ?`,
            [result.enrollment.LearnerID]
          );
          const learner = learnerRows[0] || {};

          // Tạo payment link
          // PayOS chỉ cho phép description tối đa 25 ký tự
          const description = "Thanh toán lớp học".substring(0, 25);

          // Lấy số tiền từ ClassFee của enrollment
          const paymentAmount = Math.round(result.enrollment.ClassFee || 0);

          const paymentBody = {
            orderCode: result.enrollment.OrderCode,
            amount: paymentAmount,
            description: description,
            returnUrl: `${
              process.env.FRONTEND_URL
            }/payment-success?orderCode=${encodeURIComponent(
              result.enrollment.OrderCode
            )}`,
            cancelUrl: `${
              process.env.FRONTEND_URL
            }/payment-failed?orderCode=${encodeURIComponent(
              result.enrollment.OrderCode
            )}`,
            buyerName: learner.FullName || "Người học",
            buyerEmail: learner.Email || "unknown@example.com",
            buyerPhone: "0000000000",
          };

          let paymentUrl = null;
          try {
            const createPaymentWithBody = async (body) => {
              if (
                typeof payos.paymentRequests?.createPaymentLink === "function"
              ) {
                return await payos.paymentRequests.createPaymentLink(body);
              }
              if (typeof payos.paymentRequests?.create === "function") {
                return await payos.paymentRequests.create(body);
              }
              if (typeof payos.paymentRequests?.init === "function") {
                return await payos.paymentRequests.init(body);
              }
              throw new Error("PayOS method not available");
            };

            const paymentLink = await createPaymentWithBody(paymentBody);
            paymentUrl = paymentLink.checkoutUrl || paymentLink.url;
          } catch (paymentError) {
            console.error("Error creating payment link:", paymentError);
            // Vẫn tạo notification dù không tạo được payment link
          }

          // Tạo notification cho học viên
          // Lấy số tiền từ ClassFee của enrollment
          const displayAmount = Math.round(result.enrollment.ClassFee || 0);
          const notificationContent = paymentUrl
            ? `Đơn đăng ký của bạn đã được giáo viên xác nhận! Vui lòng thanh toán để hoàn tất đăng ký.\n\nMã đơn hàng: ${
                result.enrollment.OrderCode
              }\nSố tiền: ${displayAmount.toLocaleString(
                "vi-VN"
              )} VNĐ\n\nLink thanh toán: ${paymentUrl}`
            : `Đơn đăng ký của bạn đã được giáo viên xác nhận! Vui lòng thanh toán để hoàn tất đăng ký.\n\nMã đơn hàng: ${
                result.enrollment.OrderCode
              }\nSố tiền: ${displayAmount.toLocaleString("vi-VN")} VNĐ`;

          const notification = await notificationService.create({
            content: notificationContent,
            type: "payment",
            status: "unread",
            accId: result.enrollment.LearnerAccID,
          });

          // Thêm paymentUrl vào response nếu có
          if (paymentUrl) {
            result.paymentUrl = paymentUrl;
          }
        } catch (notificationError) {
          console.error(
            "Error creating notification/payment link:",
            notificationError
          );
          // Không throw error để không ảnh hưởng đến việc xác nhận
        }
      }

      return res.json(result);
    } catch (error) {
      console.error("Error in handleSessionAction:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async handleRescheduleResponse(req, res) {
    try {
      const { sessionId } = req.params;
      const { response } = req.body;

      if (!sessionId || !response) {
        return res.status(400).json({
          message: "Session ID và response là bắt buộc",
        });
      }

      // Validate response
      if (!["accept", "reject"].includes(response)) {
        return res.status(400).json({
          message: "Response không hợp lệ. Phải là: accept hoặc reject",
        });
      }

      const result = await scheduleService.updateRescheduleResponse({
        SessionID: sessionId,
        response,
      });

      return res.json(result);
    } catch (error) {
      console.error("Error in handleRescheduleResponse:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  async getPendingRescheduleRequestsByAccount(req, res) {
    try {
      // Lấy accountId từ user trong token (đã được verifyToken middleware xử lý)
      const accountId = req.user?.id || req.user?.AccID || req.user?.AccountID;

      if (!accountId) {
        return res
          .status(401)
          .json({ message: "Unauthorized - Account ID not found" });
      }

      const requests =
        await scheduleService.getPendingRescheduleRequestsByAccountId(
          accountId
        );
      return res.json({ requests });
    } catch (error) {
      console.error("Error in getPendingRescheduleRequestsByAccount:", error);
      if (error.message.includes("Không có hồ sơ học viên")) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }
}

async function getZoomAccessToken() {
  try {
    const ZOOM_ACCOUNT_ID = "UcvGoJiqTIWo2IPcT8UryQ";
    const ZOOM_CLIENT_ID = "F2K0JTsdReyA6ETOOGJF2w";
    const ZOOM_CLIENT_SECRET = "5dy6r1U4EHO6OK0inYZxmDnmUTy45eQS";

    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;
    const authHeader = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

    const response = await axios.post(tokenUrl, null, {
      headers: { Authorization: `Basic ${authHeader}` },
    });
    
    console.log("✅ Zoom Token lấy thành công!");
    return response.data.access_token;
    
  } catch (err) {
    console.error("❌ Lỗi lấy Zoom token:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = new ScheduleController();
