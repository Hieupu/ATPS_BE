const express = require("express");
const cors = require("cors");
require("./config/db"); 
const ClassRouter = require("./routers/ClassRouter");
const CourseRouter = require("./routers/CourseRouter");
const TimeslotRouter = require("./routers/TimeslotRouter");
const SessionRouter = require("./routers/SessionRouter");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/admin/classes", ClassRouter);
app.use("/api/instructor/classes", ClassRouter);
app.use("/api/learner/classes", ClassRouter);
app.use("/api/admin/courses", CourseRouter);
app.use("/api/instructor/courses", CourseRouter);
app.use("/api/common/courses", CourseRouter);
app.use("/api/admin/timeslots", TimeslotRouter);
app.use("/api/admin/sessions", SessionRouter);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "ATPS Backend API",
    version: "1.0.0",
    description:
      "Admin Training Platform System - API for managing courses, instructors, and learners",
    endpoints: {
      // Admin APIs
      adminClasses: "/api/admin/classes",
      adminCourses: "/api/admin/courses",
      adminTimeslots: "/api/admin/timeslots",
      adminSessions: "/api/admin/sessions",

      // Instructor APIs
      instructorClasses: "/api/instructor/classes",
      instructorCourses: "/api/instructor/courses",

      // Learner APIs
      learnerClasses: "/api/learner/classes",

      // Common APIs
      commonCourses: "/api/common/courses",

      // Legacy APIs
      courses: "/api/courses",
      instructors: "/api/instructors",
      learners: "/api/learners",
      accounts: "/api/accounts",
    },
    documentation: "/API_DOCUMENTATION.md",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy endpoint",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi server",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});
