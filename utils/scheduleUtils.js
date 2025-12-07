/**
 * Schedule Utilities
 * Helper functions for generating sessions based on schedule
 */

/**
 * Generate sessions based on schedule parameters
 * @param {Object} params
 * @param {number} params.classId
 * @param {number} params.instructorId
 * @param {string} params.startDate - Format: 'YYYY-MM-DD'
 * @param {string} params.endDate - Format: 'YYYY-MM-DD'
 * @param {Array<number>} params.daysOfWeek - Array of weekday numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param {number} params.timeslotId
 * @param {string} params.className - Tên lớp học (optional, default: "Class {classId}")
 * @returns {Array<Object>} Array of session objects ready to insert
 */
function generateSessions(params) {
  const {
    classId,
    instructorId,
    startDate,
    endDate,
    daysOfWeek,
    timeslotId,
    className,
  } = params;
  const sessionTitle = className
    ? `Session for class ${className}`
    : `Session for class Class ${classId}`;

  if (
    !classId ||
    !instructorId ||
    !startDate ||
    !endDate ||
    !daysOfWeek ||
    !timeslotId
  ) {
    throw new Error("Missing required parameters for session generation");
  }

  const sessions = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Validate date range
  if (start > end) {
    throw new Error("EndDate must be after StartDate");
  }

  // Clone start date to avoid modifying the original
  const currentDate = new Date(start);
  let sessionNumber = 1;

  // Loop through each day from start to end
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    // Check if current day matches any of the selected days
    if (daysOfWeek.includes(dayOfWeek)) {
      sessions.push({
        Title: sessionTitle,
        Description: `Buổi học thứ ${sessionNumber}`,
        InstructorID: instructorId,
        ClassID: classId,
        TimeslotID: timeslotId,
        Date: formatDate(currentDate), // Format as YYYY-MM-DD
      });

      sessionNumber++;
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
}

/**
 * Preview sessions without creating them
 * Same logic as generateSessions but returns preview information
 * @param {Object} params
 * @returns {Object} Preview information
 */
function previewSessions(params) {
  const { startDate, endDate, daysOfWeek, timeslotId } = params;

  const sessions = generateSessions({
    classId: 0, // Dummy value for preview
    instructorId: 0, // Dummy value
    startDate,
    endDate,
    daysOfWeek,
    timeslotId,
  });

  return {
    totalSessions: sessions.length,
    sessions: sessions.map((s, index) => ({
      number: index + 1,
      date: s.Date,
      title: s.Title,
    })),
  };
}

/**
 * Convert day name to day number
 * @param {string} dayName - 'Sunday', 'Monday', 'Tuesday', etc.
 * @returns {number} Day number (0-6)
 */
function dayNameToNumber(dayName) {
  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const normalizedName =
    dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
  return dayMap[normalizedName] ?? null;
}

/**
 * Convert day number to day name
 * @param {number} dayNumber - 0-6
 * @returns {string} Day name
 */
function dayNumberToName(dayNumber) {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return dayNames[dayNumber] || "Unknown";
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
 * Get all dates between start and end dates for specific days
 * @param {string} startDate
 * @param {string} endDate
 * @param {Array<number>} daysOfWeek
 * @returns {Array<string>} Array of date strings
 */
function getDatesForDays(startDate, endDate, daysOfWeek) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      dates.push(formatDate(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate total number of sessions
 * @param {string} startDate
 * @param {string} endDate
 * @param {Array<number>} daysOfWeek
 * @returns {number}
 */
function calculateTotalSessions(startDate, endDate, daysOfWeek) {
  const dates = getDatesForDays(startDate, endDate, daysOfWeek);
  return dates.length;
}

module.exports = {
  generateSessions,
  previewSessions,
  dayNameToNumber,
  dayNumberToName,
  formatDate,
  getDatesForDays,
  calculateTotalSessions,
};
