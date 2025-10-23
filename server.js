const express = require("express");
const cors = require("cors");
require("./config/db");

// Import new routes
const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const classRouter = require("./routes/classRouter");
const courseRouter = require("./routes/courseRouter");
const attendanceRouter = require("./routes/attendanceRouter");
const enrollmentRouter = require("./routes/enrollmentRouter");
const instructorRouter = require("./routes/instructorRouter");
const learnerRouter = require("./routes/learnerRouter");
const materialRouter = require("./routes/materialRouter");
const sessionRouter = require("./routes/sessionRouter");
const timeslotRouter = require("./routes/timeslotRouter");
const sessiontimeslotRouter = require("./routes/sessiontimeslotRouter");
const commonRouter = require("./routes/commonRouter");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// New API routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/classes", classRouter);
app.use("/api/courses", courseRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/instructors", instructorRouter);
app.use("/api/learners", learnerRouter);
app.use("/api/materials", materialRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/timeslots", timeslotRouter);
app.use("/api/sessiontimeslots", sessiontimeslotRouter);
app.use("/api/common", commonRouter);

// Legacy API routes (for compatibility)
app.use("/api/admin/classes", classRouter);
app.use("/api/admin/courses", courseRouter);
app.use("/api/admin/timeslots", timeslotRouter);
app.use("/api/admin/sessions", sessionRouter);
app.use("/api/instructor/classes", classRouter);
app.use("/api/instructor/courses", courseRouter);
app.use("/api/learner/classes", classRouter);
app.use("/api/common/courses", courseRouter);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "ATPS Backend API",
    version: "1.0.0",
    description:
      "Admin Training Platform System - API for managing courses, instructors, and learners",
    endpoints: {
      // New API Structure
      auth: "/api/auth",
      profile: "/api/profile",
      classes: "/api/classes",
      courses: "/api/courses",
      attendance: "/api/attendance",
      enrollments: "/api/enrollments",
      instructors: "/api/instructors",
      learners: "/api/learners",
      materials: "/api/materials",
      sessions: "/api/sessions",
      timeslots: "/api/timeslots",
      sessiontimeslots: "/api/sessiontimeslots",
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
