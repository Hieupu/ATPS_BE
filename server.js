const express = require("express");
const cors = require("cors");
const path = require("path");
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
const accountRouter = require("./routes/accountRouter");
const newsRouter = require("./routes/newsRouter");
const refundRouter = require("./routes/refundRouter");
const promotionRouter = require("./routes/promotionRouter");
const dashboardRouter = require("./routes/dashboardRouter");
// Removed sessiontimeslotRouter - no longer needed
const commonRouter = require("./routes/commonRouter");

// Debug: Log khi dashboard router được import
console.log("Dashboard router imported successfully");

// New routes for workflow 4 steps
// const instructorMaterialRouter = require("./routes/instructorMaterialRouter");
// const lessonRouter = require("./routes/lessonRouter");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (images, uploads)
app.use(
  "/assets",
  express.static(path.join(__dirname, "public", "assets"), {
    maxAge: "7d",
  })
);

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
app.use("/api/accounts", accountRouter);
app.use("/api/news", newsRouter);
app.use("/api/refunds", refundRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/dashboard", dashboardRouter);
console.log("Dashboard route registered: /api/dashboard");
// Removed sessiontimeslots route - no longer needed
app.use("/api/common", commonRouter);

// New routes for workflow 4 steps
// app.use("/api/instructor-materials", instructorMaterialRouter);
// app.use("/api/lessons", lessonRouter);

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
      accounts: "/api/accounts",
      news: "/api/news",
      refunds: "/api/refunds",
      promotions: "/api/promotions",
      dashboard: "/api/dashboard",
      materials: "/api/materials",
      sessions: "/api/sessions",
      timeslots: "/api/timeslots",
      // sessiontimeslots removed - replaced by TimeslotID in sessions
      instructorMaterials: "/api/instructor-materials",
      lessons: "/api/lessons",
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
