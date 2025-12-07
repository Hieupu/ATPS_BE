/**
 * Test Class Creation Wizard Logic
 * Kiểm tra logic tạo lớp học theo yêu cầu mới:
 * - Bước 1: Chọn giảng viên và khóa học (PUBLISHED)
 * - Bước 2: Chọn ngày bắt đầu và số buổi học
 * - Bước 3: Chọn ca học với logic disable khi lịch bận >30%
 */

const axios = require("axios");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:9999/api";

const DAY_CODE_TO_NUMBER = {
  CN: 0,
  T2: 1,
  T3: 2,
  T4: 3,
  T5: 4,
  T6: 5,
  T7: 6,
};

const EN_DAY_TO_NUMBER = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const NUMBER_TO_DAY_CODE = Object.entries(DAY_CODE_TO_NUMBER).reduce(
  (acc, [code, num]) => {
    acc[num] = code;
    return acc;
  },
  {}
);

const normalizeDayLabel = (label) => {
  if (!label) return "";
  return label
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "");
};

const convertDayLabelToNumber = (label) => {
  const normalized = normalizeDayLabel(label);
  if (!normalized) return null;

  if (DAY_CODE_TO_NUMBER[normalized] !== undefined) {
    return DAY_CODE_TO_NUMBER[normalized];
  }

  if (EN_DAY_TO_NUMBER[normalized] !== undefined) {
    return EN_DAY_TO_NUMBER[normalized];
  }

  // Handle formats like "THUHAI", "THU3", "THU TU", "T2", etc.
  if (normalized.startsWith("THU")) {
    if (normalized.includes("HAI") || normalized === "THU2") return 1;
    if (normalized.includes("BA") || normalized === "THU3") return 2;
    if (normalized.includes("TU") || normalized === "THU4") return 3;
    if (normalized.includes("NAM") || normalized === "THU5") return 4;
    if (normalized.includes("SAU") || normalized === "THU6") return 5;
    if (normalized.includes("BAY") || normalized === "THU7") return 6;
  }

  const digitMatch = normalized.match(/(\d)/);
  if (digitMatch) {
    const digit = parseInt(digitMatch[1], 10);
    if (digit === 0) return 0;
    if (digit >= 2 && digit <= 7) {
      return digit - 1;
    }
  }

  if (normalized.includes("CHUNHAT")) {
    return 0;
  }

  return null;
};

const buildTimeslotsByDay = (timeslots, targetDays, limitPerDay = 3) => {
  const result = {};
  targetDays.forEach((day) => {
    const matchingSlots = timeslots
      .filter((ts) => convertDayLabelToNumber(ts.Day || ts.day) === day)
      .slice(0, limitPerDay)
      .map((ts) => ts.TimeslotID || ts.id);

    if (matchingSlots.length > 0) {
      result[day] = matchingSlots;
    }
  });
  return result;
};

describe("Class Creation Wizard Tests", () => {
  let testInstructorId;
  let testCourseId;
  let testClassId;
  let adminToken;
  let cachedTimeslots = [];
  const defaultDaysOfWeek = [1, 2, 3]; // T2, T3, T4

  beforeAll(async () => {
    // Login as admin để lấy token
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: "admin",
        password: "admin123",
      });
      adminToken = loginResponse.data.data.token;
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      throw error;
    }
  });

  describe("Step 1: Instructor and Course Selection", () => {
    test("1.1 - Lấy danh sách giảng viên", async () => {
      const response = await axios.get(`${BASE_URL}/instructors`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.data.length > 0) {
        testInstructorId = response.data.data[0].InstructorID;
        console.log(`Selected test instructor ID: ${testInstructorId}`);
      }
    });

    test("1.2 - Lấy thông tin giảng viên với khóa học (chỉ PUBLISHED)", async () => {
      if (!testInstructorId) {
        console.log("Skipping test - no instructor ID");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/instructors/${testInstructorId}/courses`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty("InstructorID");
      expect(response.data.data).toHaveProperty("courses");
      expect(Array.isArray(response.data.data.courses)).toBe(true);

      // Kiểm tra tất cả courses đều có Status = 'PUBLISHED'
      const allPublished = response.data.data.courses.every(
        (course) => course.Status === "PUBLISHED"
      );
      expect(allPublished).toBe(true);

      if (response.data.data.courses.length > 0) {
        testCourseId = response.data.data.courses[0].CourseID;
        console.log(`Selected test course ID: ${testCourseId}`);
      }
    });
  });

  describe("Step 2: Schedule Planning", () => {
    test("2.1 - Tạo lớp học DRAFT với thông tin cơ bản", async () => {
      if (!testInstructorId) {
        console.log("Skipping test - no instructor ID");
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      const classData = {
        Name: `Test Class Wizard ${Date.now()}`,
        InstructorID: testInstructorId,
        CourseID: testCourseId || null,
        Fee: 1000000,
        OpendatePlan: startDate,
        Numofsession: 12,
        Maxstudent: 20,
        ZoomID: "test-zoom-id",
        Zoompass: "test-zoom-pass",
        Status: "DRAFT",
      };

      const response = await axios.post(`${BASE_URL}/classes`, classData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty("ClassID");
      testClassId = response.data.data.ClassID;
      console.log(`Created test class ID: ${testClassId}`);
    });
  });

  describe("Step 3: Timeslot Selection with Blocking Logic", () => {
    test("3.1 - Phân tích blocked days cho giảng viên", async () => {
      if (!testInstructorId || !testClassId) {
        console.log("Skipping test - missing instructor or class ID");
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      // Lấy tất cả timeslots để xây dựng TimeslotsByDay
      const timeslotsResponse = await axios.get(`${BASE_URL}/timeslots`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(timeslotsResponse.status).toBe(200);
      const allTimeslots = timeslotsResponse.data.data || [];
      cachedTimeslots = allTimeslots;

      const timeslotsByDay = buildTimeslotsByDay(
        allTimeslots,
        defaultDaysOfWeek
      );

      if (Object.keys(timeslotsByDay).length === 0) {
        console.log("No matching timeslots found for configured days");
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/classes/instructor/analyze-blocked-days`,
        {
          InstructorID: testInstructorId,
          OpendatePlan: startDate,
          Numofsession: 12,
          DaysOfWeek: defaultDaysOfWeek,
          TimeslotsByDay: timeslotsByDay,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      // Kiểm tra structure của blocked days
      const blockedDays = response.data.data;
      expect(typeof blockedDays).toBe("object");

      console.log("Blocked days result:", JSON.stringify(blockedDays, null, 2));
    });

    test("3.2 - Lấy lịch bận của giảng viên", async () => {
      if (!testInstructorId) {
        console.log("Skipping test - no instructor ID");
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      const endDate = new Date(tomorrow);
      endDate.setDate(endDate.getDate() + 84);
      const endDateStr = endDate.toISOString().split("T")[0];

      const response = await axios.get(
        `${BASE_URL}/instructors/${testInstructorId}/schedule?startDate=${startDate}&endDate=${endDateStr}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);

      // Kiểm tra lịch bận có Status='Others' hoặc 'Holiday'
      const busySchedule = response.data.data.filter(
        (item) =>
          item.Status === "Others" ||
          item.Status === "Holiday" ||
          item.Status === "BUSY" ||
          item.hasSession === true ||
          item.SessionID
      );

      console.log(
        `Found ${busySchedule.length} busy slots out of ${response.data.data.length} total slots`
      );
    });

    test("3.3 - Tạo class với timeslots và kiểm tra logic disable", async () => {
      if (!testClassId || !testInstructorId) {
        console.log("Skipping test - missing class or instructor ID");
        return;
      }

      // Lấy timeslots (tận dụng cache nếu có)
      let allTimeslots = cachedTimeslots;
      if (!allTimeslots || allTimeslots.length === 0) {
        const timeslotsResponse = await axios.get(`${BASE_URL}/timeslots`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        allTimeslots = timeslotsResponse.data.data || [];
        cachedTimeslots = allTimeslots;
      }

      // Chọn một số timeslots cho T2, T3, T4
      const selectedTimeslots = allTimeslots
        .map((ts) => {
          const dayNumber = convertDayLabelToNumber(ts.Day || ts.day);
          return {
            ...ts,
            _dayNumber: dayNumber,
          };
        })
        .filter(
          (ts) =>
            ts._dayNumber !== null && defaultDaysOfWeek.includes(ts._dayNumber)
        )
        .slice(0, 3)
        .map((ts) => ({
          TimeslotID: ts.TimeslotID || ts.id,
          DayNumber: ts._dayNumber,
          Day:
            ts.Day ||
            ts.day ||
            NUMBER_TO_DAY_CODE[ts._dayNumber] ||
            "T2",
          StartTime: ts.StartTime || ts.startTime,
          EndTime: ts.EndTime || ts.endTime,
        }));

      if (selectedTimeslots.length === 0) {
        console.log("No suitable timeslots found for test");
        return;
      }

      console.log("Selected timeslots:", selectedTimeslots);

      // Tạo sessions cho class
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      let currentDate = new Date(tomorrow);

      const sessions = [];
      let sessionNumber = 1;

      // Tạo 12 sessions
      while (sessions.length < 12 && sessionNumber <= 50) {
        const dateString = currentDate.toISOString().split("T")[0];
        const dayOfWeek = currentDate.getDay();
        const matchingTimeslot = selectedTimeslots.find(
          (ts) => ts.DayNumber === dayOfWeek
        );

        if (matchingTimeslot) {
          sessions.push({
            Title: `Buổi ${sessionNumber}`,
            Description: `Buổi học thứ ${sessionNumber}`,
            ClassID: testClassId,
            InstructorID: testInstructorId,
            TimeslotID: matchingTimeslot.TimeslotID,
            Date: dateString,
          });
          sessionNumber++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`Created ${sessions.length} sessions`);

      // Gọi API tạo class wizard
      const response = await axios.post(
        `${BASE_URL}/classes/wizard`,
        {
          ClassID: testClassId,
          OpendatePlan: tomorrow.toISOString().split("T")[0],
          Numofsession: 12,
          InstructorID: testInstructorId,
          SelectedTimeslotIDs: selectedTimeslots,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty("success");
      expect(Array.isArray(response.data.data.success)).toBe(true);

      console.log(
        `Created ${response.data.data.success.length} valid sessions`
      );
      if (response.data.data.conflicts) {
        console.log(
          `Found ${response.data.data.conflicts.length} conflicts`
        );
      }
    });
  });

  describe("Cleanup", () => {
    test("Cleanup - Xóa test class", async () => {
      if (!testClassId) {
        console.log("No test class to cleanup");
        return;
      }

      try {
        const response = await axios.delete(
          `${BASE_URL}/classes/${testClassId}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        expect([200, 204]).toContain(response.status);
        console.log(`Deleted test class ID: ${testClassId}`);
      } catch (error) {
        console.error("Cleanup error:", error.response?.data || error.message);
        // Không fail test nếu cleanup thất bại
      }
    });
  });
});

