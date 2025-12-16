const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const cron = require("node-cron");

dotenv.config();
process.env.TZ = "Asia/Ho_Chi_Minh";
const connectDB = require("./config/db");

const router = require("./routes/routerAuth");
const profileRoutes = require("./routes/profileRoutes");
const profileRouter = require("./routes/profileRouter");
const courseRoutes = require("./routes/courseRoutes");
const courseRouter = require("./routes/courseRouter");
const classRouter = require("./routes/classRouter");
const instructorClassRoutes = require("./routes/instructorClassRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const instructorRouter = require("./routes/instructorRouter");
const instructorCourseRoutes = require("./routes/instructorCourseRouter");
const instructorExamRoutes = require("./routes/instructorExamRoutes");

// Certificate routes
const certificateRouter = require("./routes/certificateRouter");

// Learner routes
const learnerRouter = require("./routes/learnerRouter");
const learnerassignmentRoutes = require("./routes/learnerassignmentRoutes");
const sessionRouter = require("./routes/sessionRouter");
const timeslotRouter = require("./routes/timeslotRouter");
const scheduleRoutes = require("./routes/scheduleRoutes");
const attendanceRouter = require("./routes/attendanceRouter");
const attendanceRoutes = require("./routes/attendanceRoutes");
const progressRoutes = require("./routes/progressRoutes");
const materialRouter = require("./routes/materialRouter");
const materialRoutes = require("./routes/materialRoutes");
const examRoutes = require("./routes/examRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const enrollmentRouter = require("./routes/enrollmentRouter");
const staffRouter = require("./routes/staffRouter");
const adminRouter = require("./routes/adminRouter");
const accountRouter = require("./routes/accountRouter");
const newsRouter = require("./routes/newsRouter");
const refundRouter = require("./routes/refundRouter");
const promotionRouter = require("./routes/promotionRouter");
const dashboardRouter = require("./routes/dashboardRouter");
const emailTemplateRouter = require("./routes/emailTemplateRouter");
const emailLogRouter = require("./routes/emailLogRouter");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const zoomRoutes = require("./routes/zoomRoutes");
const commonRouter = require("./routes/commonRouter");
const slotReservationRoutes = require("./routes/slotReservationRoutes");
const learnerExamRoutes = require("./routes/learnerExamRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const newsRoutes = require("./routes/newsRoutes");
const instructorDashboardRouter = require("./routes/instructorDashboardRouter");
const classService = require("./services/ClassService");
const instructorExamRepository = require("./repositories/instructorExamRepository");
dotenv.config();
const app = express();

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

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(
  "/assets",
  express.static(path.join(__dirname, "public", "assets"), {
    maxAge: "7d",
  })
);

app.use("/api", router);
app.use("/api/profile", profileRoutes);
app.use("/api/profile", profileRouter);
app.use("/api/courses", courseRoutes);
app.use("/api/courses", courseRouter);
app.use("/api/classes", classRouter);

app.use("/api/instructors", instructorRoutes);
app.use("/api/instructor", instructorCourseRoutes);
app.use("/api/instructors", instructorRouter);
// app.use("/api/instructor/courses", instructorCourseRoutes);
app.use("/api/instructor", instructorClassRoutes);
app.use("/api/instructor", assignmentRoutes);
app.use("/api/instructor", instructorExamRoutes);
app.use("/api/instructors", instructorDashboardRouter);

// Certificate routes
app.use("/api/certificates", certificateRouter);

app.use("/api/learners", learnerRouter);
app.use("/api/learnerassignments", learnerassignmentRoutes);
app.use("/api/sessions", sessionRouter);
app.use("/api/timeslots", timeslotRouter);
app.use("/api/schedule", scheduleRoutes);

// Attendance & Progress routes

// app.use("/api/attendances", attendanceRouter);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendances", attendanceRouter);

app.use("/api/progress", progressRoutes);


app.use("/api/materials", materialRouter);
app.use("/api/materials", materialRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admins", adminRouter);
app.use("/api/accounts", accountRouter);


app.use("/api/news", newsRouter);
app.use("/api/refunds", refundRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/email-templates", emailTemplateRouter);
app.use("/api/email-logs", emailLogRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/zoom", zoomRoutes);
app.use("/api/learnerassignments", learnerassignmentRoutes);
app.use("/api/slot-reservation", slotReservationRoutes);
app.use("/api/exams", learnerExamRoutes);
app.use("/api/common", commonRouter);
app.use("/api/new", newsRoutes);
// Legacy API routes (for compatibility)

app.use("/api/admin/classes", classRouter);
app.use("/api/admin/courses", courseRouter);
app.use("/api/admin/timeslots", timeslotRouter);
// app.use("/api/admin/sessions", sessionRouter);
app.use("/api/instructor/classes", classRouter);
app.use("/api/instructor/courses", courseRouter);
app.use("/api/learner/classes", classRouter);
app.use("/api/common/courses", courseRouter);


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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy endpoint",
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi server",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});


cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      const result = await classService.autoUpdateClassStatus();
    } catch (error) {
      console.error("[Cron Job] Lỗi khi tự động cập nhật status:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);


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

const PORT = process.env.PORT || 9999;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`@ Server running on port ${PORT}`);
  });
});
