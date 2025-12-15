const instructorDashboardRepository = require("../repositories/instuctorDashboardRepository");

const getDateRange = (daysForward) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysForward);
  return {
    start: today.toISOString().split("T")[0],
    end: futureDate.toISOString().split("T")[0],
  };
};

// 1. COURSES
const listInstructorCoursesService = async (instructorId) => {
  const courses = await instructorDashboardRepository.getCoursesByInstructorId(
    instructorId
  );

  return courses;
};

// 2. CLASSES
const listInstructorClassesService = async (instructorId) => {
  const classes = await instructorDashboardRepository.getClassesByInstructorId(
    instructorId
  );
  return classes;
};

// 3. LEARNERS
const listInstructorLearnersService = async (instructorId) => {
  const learners =
    await instructorDashboardRepository.getLearnersByInstructorId(instructorId);
  return learners;
};

// 4. ENROLLMENT
const listInstructorEnrollmentsService = async (instructorId) => {
  const enrollments =
    await instructorDashboardRepository.getEnrollmentsByInstructorId(
      instructorId
    );
  return enrollments;
};

// 5. SESSIONS
const listInstructorSessionsService = async (
  instructorId,
  start,
  end,
  limit
) => {
  return await instructorDashboardRepository.getSessionsByInstructorId(
    instructorId,
    start,
    end,
    limit
  );
};

// 6. ATTENDANCE
const listInstructorAttendanceService = async (instructorId) => {
  const attendance =
    await instructorDashboardRepository.getAttendanceByInstructorId(
      instructorId
    );
  return attendance;
};

// 7. EXAMS (ASSIGNMENTS)
const listInstructorExamsService = async (instructorId) => {
  const exams = await instructorDashboardRepository.getExamsByInstructorId(
    instructorId
  );
  return exams;
};

// 8. SUBMISSIONS
const listInstructorSubmissionsService = async (instructorId, limit) => {
  return await instructorDashboardRepository.getSubmissionsByInstructorId(
    instructorId,
    limit
  );
};

// 9. EXAM RESULTS (AVERAGE SCORES)
const listInstructorExamResultsService = async (instructorId) => {
  const results =
    await instructorDashboardRepository.getExamResultsByInstructorId(
      instructorId
    );
  return results;
};

// 10. NOTIFICATIONS
const listInstructorNotificationsService = async (instructorId, limit) => {
  return await instructorDashboardRepository.getNotificationsByInstructorId(
    instructorId,
    limit
  );
};

// 11. SESSION CHANGE REQUESTS
const listInstructorChangeRequestsService = async (instructorId) => {
  const requests =
    await instructorDashboardRepository.getSessionChangeRequestsByInstructorId(
      instructorId
    );
  return requests;
};

const getMissedAttendanceAlertsService = async (instructorId) => {
  const alerts = await instructorDashboardRepository.getMissedAttendanceAlerts(
    instructorId
  );
  return alerts;
};

const getFullDashboardDataService = async (instructorId) => {
  const { start, end } = getDateRange(7);
  const SUBMISSION_LIMIT = 5;
  const NOTIFICATION_LIMIT = 5;
  const [
    courses,
    classes,
    learners,
    enrollments,
    sessions,
    attendance,
    exams,
    submissions,
    examResults,
    notifications,
    sessionChangeRequests,
    missedAttendanceAlerts,
  ] = await Promise.all([
    instructorDashboardRepository.getCoursesByInstructorId(instructorId),
    instructorDashboardRepository.getClassesByInstructorId(instructorId),
    instructorDashboardRepository.getLearnersByInstructorId(instructorId),
    instructorDashboardRepository.getEnrollmentsByInstructorId(instructorId),

    instructorDashboardRepository.getSessionsByInstructorId(
      instructorId,
      start,
      end,
      5
    ),

    instructorDashboardRepository.getAttendanceByInstructorId(instructorId),
    instructorDashboardRepository.getExamsByInstructorId(instructorId),

    instructorDashboardRepository.getSubmissionsByInstructorId(
      instructorId,
      SUBMISSION_LIMIT
    ),

    instructorDashboardRepository.getExamResultsByInstructorId(instructorId),

    instructorDashboardRepository.getNotificationsByInstructorId(
      instructorId,
      NOTIFICATION_LIMIT
    ),

    instructorDashboardRepository.getSessionChangeRequestsByInstructorId(
      instructorId
    ),
    instructorDashboardRepository.getMissedAttendanceAlerts(instructorId),
  ]);

  return {
    courses,
    classes,
    learners,
    enrollments,
    sessions,
    attendance,
    exams,
    submissions,
    examResults,
    notifications,
    sessionChangeRequests,
    missedAttendanceAlerts,
  };
};

module.exports = {
  listInstructorCoursesService,
  listInstructorClassesService,
  listInstructorLearnersService,
  listInstructorEnrollmentsService,
  listInstructorSessionsService,
  listInstructorAttendanceService,
  listInstructorExamsService,
  listInstructorSubmissionsService,
  listInstructorExamResultsService,
  listInstructorNotificationsService,
  listInstructorChangeRequestsService,
  getFullDashboardDataService,
  getMissedAttendanceAlertsService,
};
