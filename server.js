const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
require("./config/db");

dotenv.config();
process.env.TZ = "Asia/Ho_Chi_Minh";

const app = express();

// =====================================================
// CORS CONFIG (Chuẩn Express 5 - Không wildcard lỗi)
// =====================================================
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

// Không dùng wildcard nữa → Tránh lỗi path-to-regexp
app.use(cors(corsOptions));

// Express tự handle OPTIONS nên KHÔNG dùng app.options("*")
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Header xử lý Zoom / Cross-Origin
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// =====================================================
// STATIC FILES
// =====================================================
app.use(
  "/assets",
  express.static(path.join(__dirname, "public", "assets"), {
    maxAge: "7d",
  })
);

// =====================================================
// IMPORT ROUTES (GỘP TỪ HAI FILE)
// =====================================================

// Core routes
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
const staffRouter = require("./routes/staffRouter");
const adminRouter = require("./routes/adminRouter");
const newsRouter = require("./routes/newsRouter");
const refundRouter = require("./routes/refundRouter");
const promotionRouter = require("./routes/promotionRouter");
const dashboardRouter = require("./routes/dashboardRouter");
const emailTemplateRouter = require("./routes/emailTemplateRouter");
const commonRouter = require("./routes/commonRouter");

// Secondary routes
const instructorCourseRoutes = require("./routes/instructorCourseRouter");
const instructorClassRoutes = require("./routes/instructorClassRoutes");
const instructorExamRoutes = require("./routes/instructorExamRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const progressRoutes = require("./routes/progressRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const examRoutes = require("./routes/examRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const zoomRoutes = require("./routes/zoomRoutes");
const learnerassignmentRoutes = require("./routes/learnerassignmentRoutes");

// =====================================================
// ROUTES REGISTER
// =====================================================
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/classes", classRouter);
app.use("/api/courses", courseRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/instructors", instructorRouter);
app.use("/api/learners", learnerRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admins", adminRouter);
app.use("/api/news", newsRouter);
app.use("/api/refunds", refundRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/materials", materialRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/timeslots", timeslotRouter);
app.use("/api/email-templates", emailTemplateRouter);
app.use("/api/common", commonRouter);

// extra
app.use("/api/schedule", scheduleRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/learnerassignments", learnerassignmentRoutes);
app.use("/api/zoom", zoomRoutes);

// Instructor prefix
app.use("/api/instructor/courses", instructorCourseRoutes);
app.use("/api/instructor", instructorClassRoutes);
app.use("/api/instructor", instructorExamRoutes);
app.use("/api/instructor", assignmentRoutes);

// =====================================================
// ROOT ROUTE
// =====================================================
app.get("/", (req, res) => {
  res.json({
    message: "ATPS Backend API",
    version: "1.0.0",
  });
});

// =====================================================
// 404
// =====================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy endpoint",
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi server",
  });
});

// =====================================================
// CRON JOBS
// =====================================================
const classService = require("./services/classService");
const instructorExamRepository = require("./repositories/instructorExamRepository");

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      await classService.autoUpdateClassStatus();
    } catch (error) {
      console.error("[Cron Error]:", error);
    }
  },
  { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
);

cron.schedule(
  "0 * * * *",
  async () => {
    try {
      await classService.autoUpdateClassStatus();
    } catch (error) {
      console.error("[Cron Hourly Error]:", error);
    }
  },
  { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
);

// =====================================================
// SERVER
// =====================================================
const PORT = process.env.PORT || 9999;

app.listen(PORT, () => {
  instructorExamRepository.autoUpdateExamStatus();
  console.log(`Server running at port ${PORT}`);
});
