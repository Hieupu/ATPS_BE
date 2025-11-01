const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
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
const passport = require("passport");
const cors = require("cors");
// const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());

app.use("/api", router);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/instructor/courses", instructorCourseRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/materials", materialRoutes);
// app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/instructor", assignmentRoutes);

const PORT = process.env.PORT || 9999;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
