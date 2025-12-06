const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const cron = require("node-cron");

// Load environment variables
dotenv.config();
process.env.TZ = "Asia/Ho_Chi_Minh";

// Database connection
const connectDB = require("./config/db");

// ========== ROUTE IMPORTS ==========
// Auth routes
const router = require("./routes/routerAuth");

// Profile routes
const profileRoutes = require("./routes/profileRoutes");
const profileRouter = require("./routes/profileRouter");

// Course routes
const courseRoutes = require("./routes/courseRoutes");
const courseRouter = require("./routes/courseRouter");

// Class routes
const classRouter = require("./routes/classRouter");
const instructorClassRoutes = require("./routes/instructorClassRoutes");

// Instructor routes
const instructorRoutes = require("./routes/instructorRoutes");
const instructorRouter = require("./routes/instructorRouter");
const instructorCourseRoutes = require("./routes/instructorCourseRouter");
const instructorExamRoutes = require("./routes/instructorExamRoutes");

// Learner routes
const learnerRouter = require("./routes/learnerRouter");
const learnerassignmentRoutes = require("./routes/learnerassignmentRoutes");

// Session & Schedule routes
const sessionRouter = require("./routes/sessionRouter");
const timeslotRouter = require("./routes/timeslotRouter");
const scheduleRoutes = require("./routes/scheduleRoutes");

// Attendance & Progress routes
const attendanceRouter = require("./routes/attendanceRouter");
const attendanceRoutes = require("./routes/attendanceRoutes");
const progressRoutes = require("./routes/progressRoutes");

// Material routes
const materialRouter = require("./routes/materialRouter");
const materialRoutes = require("./routes/materialRoutes");

// Exam & Assignment routes
const examRoutes = require("./routes/examRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");

// Enrollment routes
const enrollmentRouter = require("./routes/enrollmentRouter");

// Staff & Admin routes
const staffRouter = require("./routes/staffRouter");
const adminRouter = require("./routes/adminRouter");
const accountRouter = require("./routes/accountRouter");

// Other feature routes
const newsRouter = require("./routes/newsRouter");
const refundRouter = require("./routes/refundRouter");
const promotionRouter = require("./routes/promotionRouter");
const dashboardRouter = require("./routes/dashboardRouter");
const emailTemplateRouter = require("./routes/emailTemplateRouter");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const zoomRoutes = require("./routes/zoomRoutes");
const commonRouter = require("./routes/commonRouter");

// Removed/Deprecated routes (commented out - no longer needed)
// const sessiontimeslotRouter = require("./routes/sessiontimeslotRouter"); // Replaced by TimeslotID in sessions
// const instructorMaterialRouter = require("./routes/instructorMaterialRouter"); // Workflow 4 steps - not implemented
// const lessonRouter = require("./routes/lessonRouter"); // Workflow 4 steps - not implemented

// Initialize Express app
const app = express();

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  "http://localhost:3000",
  "https://atps-fe-deploy.vercel.app",
  "https://marketplace.zoom.us/api/v1/apps/validateEndpointUrl/xI4Ki5LnTUOd1ZoGq9jptw/check",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ========== MIDDLEWARE ==========
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Serve static assets
app.use(
  "/assets",
  express.static(path.join(__dirname, "public", "assets"), {
    maxAge: "7d",
  })
);

// ========== API ROUTES ==========
// Auth routes
app.use("/api", router);

// Profile routes
app.use("/api/profile", profileRoutes);
app.use("/api/profile", profileRouter);

// Course routes
app.use("/api/courses", courseRoutes);
app.use("/api/courses", courseRouter);

// Class routes
app.use("/api/classes", classRouter);

// Instructor routes
app.use("/api/instructors", instructorRoutes);
app.use("/api/instructors", instructorRouter);
app.use("/api/instructor/courses", instructorCourseRoutes);
app.use("/api/instructor", instructorClassRoutes);
app.use("/api/instructor", assignmentRoutes);
app.use("/api/instructor", instructorExamRoutes);

// Learner routes
app.use("/api/learners", learnerRouter);
app.use("/api/learnerassignments", learnerassignmentRoutes);

// Session & Schedule routes
app.use("/api/sessions", sessionRouter);
app.use("/api/timeslots", timeslotRouter);
app.use("/api/schedule", scheduleRoutes);

// Attendance & Progress routes
app.use("/api/attendance", attendanceRouter);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);

// Material routes
app.use("/api/materials", materialRouter);
app.use("/api/materials", materialRoutes);

// Exam & Assignment routes
app.use("/api/exams", examRoutes);

// Enrollment routes
app.use("/api/enrollments", enrollmentRouter);

// Staff & Admin routes
app.use("/api/staff", staffRouter);
app.use("/api/admins", adminRouter);
app.use("/api/accounts", accountRouter);

// Other feature routes
app.use("/api/news", newsRouter);
app.use("/api/refunds", refundRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/email-templates", emailTemplateRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/zoom", zoomRoutes);
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

// ========== ROOT ROUTE ==========
app.get("/", (req, res) => {
  res.json({
    message: "ATPS Backend API",
    version: "1.0.0",
    description:
      "Admin Training Platform System - API for managing courses, instructors, and learners",
    endpoints: {
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
      exams: "/api/exams",
      assignments: "/api/instructor/assignments",
      notifications: "/api/notifications",
      payment: "/api/payment",
      zoom: "/api/zoom",
    },
    documentation: "/API_DOCUMENTATION.md",
  });
});

// ========== ERROR HANDLERS ==========
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy endpoint",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi server",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// ========== SCHEDULED TASKS (Cron Jobs) ==========
const classService = require("./services/classService");
const instructorExamRepository = require("./repositories/instructorExamRepository");

// Tự động cập nhật status lớp học hàng ngày lúc 00:00
cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      console.log("[Cron Job] Bắt đầu tự động cập nhật status lớp học...");
      const result = await classService.autoUpdateClassStatus();
      console.log("[Cron Job] Kết quả:", result.message);
      console.log(
        "[Cron Job] - Kích hoạt từ APPROVED:",
        result.activatedClasses?.length || 0
      );
      console.log(
        "[Cron Job] - Chuyển sang ONGOING:",
        result.startedClasses?.length || 0
      );
      console.log("[Cron Job] - Đóng lớp:", result.closedClasses?.length || 0);
    } catch (error) {
      console.error("[Cron Job] Lỗi khi tự động cập nhật status:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);

// Tự động cập nhật status lớp học mỗi giờ
cron.schedule(
  "0 * * * *",
  async () => {
    try {
      console.log(
        "[Cron Job Hourly] Bắt đầu tự động cập nhật status lớp học..."
      );
      const result = await classService.autoUpdateClassStatus();
      console.log("[Cron Job Hourly] Kết quả:", result.message);
    } catch (error) {
      console.error("[Cron Job Hourly] Lỗi:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);

console.log("[Cron Jobs] Đã khởi tạo scheduled tasks:");
console.log(
  "[Cron Jobs] - Tự động cập nhật status lớp học: Mỗi ngày lúc 00:00 và mỗi giờ"
);

// ========== START SERVER ==========
const PORT = process.env.PORT || 9999;

connectDB()
  .then(() => {
    // Auto update exam status on startup
    instructorExamRepository.autoUpdateExamStatus();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
      console.log(`⏰ Cron jobs initialized successfully`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });
