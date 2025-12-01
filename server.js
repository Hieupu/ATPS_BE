const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const router = require("./routes/routerAuth");
const profileRoutes = require("./routes/profileRoutes");
const courseRoutes = require("./routes/courseRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const progressRoutes = require("./routes/progressRoutes");
const materialRoutes = require("./routes/materialRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const examRoutes = require("./routes/examRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const zoomRoutes = require("./routes/zoomRoutes");
const learnerassignmentRoutes = require("./routes/learnerassignmentRoutes");
const passport = require("passport");
const cors = require("cors");
const instructorCourseRoutes = require("./routes/instructorCourseRouter");
const instructorClassRoutes = require("./routes/instructorClassRoutes");
const instructorExamRoutes = require("./routes/instructorExamRoutes");

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
app.use(passport.initialize());

app.use("/api", router);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/instructor/courses", instructorCourseRoutes);
app.use("/api/instructor", instructorClassRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/instructor", assignmentRoutes);
app.use("/api/instructor", instructorExamRoutes);
app.use("/api/zoom", zoomRoutes);
app.use("/api/learnerassignments", learnerassignmentRoutes);

const PORT = process.env.PORT || 9999;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`@ Server running on port ${PORT}`));
});
