const express = require("express");
const router = express.Router();
const CourseController = require("../controllers/courseController");

/**
 * CourseRouter - Routes cho Course management
 * Luồng: Frontend → CourseRouter → CourseController → CourseService → CourseModel → Database
 */

// Course Management Routes
router.post("/", CourseController.createCourse);
router.get("/", CourseController.getAllCourses);
router.get("/available", CourseController.getAvailableCourses);
router.get("/instructor", CourseController.getInstructorCourses);
router.get("/enrolled", CourseController.getLearnerEnrolledCourses);
router.get("/:id", CourseController.getCourseById);
router.put("/:id", CourseController.updateCourse);
router.delete("/:id", CourseController.deleteCourse);

// Instructor APIs - Course Assignment
router.put("/classes/:classId/course", CourseController.assignCourseToClass);

// Common APIs
router.get("/instructors", CourseController.getInstructors);
router.get("/instructors/:instructorId", CourseController.getInstructorById);
router.get("/learners", CourseController.getLearners);
router.get("/learners/:learnerId", CourseController.getLearnerById);

// Legacy routes for backward compatibility
router.post("/:id/students", CourseController.addStudentToCourse);
router.delete(
  "/:id/students/:studentId",
  CourseController.removeStudentFromCourse
);
router.post("/:id/timeslots", CourseController.addTimeslotToCourse);
router.delete("/:id/timeslots/:timeslotId", CourseController.deleteTimeslot);

module.exports = router;



