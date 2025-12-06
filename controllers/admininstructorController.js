const instructorService = require("../services/instructorService");
const uploadToCloudinary = require("../utils/uploadCloudinary");
const accountRepository = require("../repositories/accountRepository");
const instructorRepository = require("../repositories/instructorRepository");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");

const instructorController = {
  // Lấy tất cả giảng viên (public - không có Status và Gender)
  getAllInstructors: async (req, res) => {
    try {
      const instructors = await instructorService.getAllInstructors();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách giảng viên thành công",
        data: instructors,
      });
    } catch (error) {
      console.error("Error getting instructors:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy tất cả giảng viên cho admin (có Status và Gender từ account table)
  getAllInstructorsAdmin: async (req, res) => {
    try {
      const instructors = await instructorService.getAllInstructorsAdmin();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách giảng viên thành công",
        data: instructors,
      });
    } catch (error) {
      console.error("Error getting instructors for admin:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy một giảng viên theo ID (public - không có Status và Gender)
  getInstructorById: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const instructor = await instructorService.getInstructorById(
        instructorId
      );

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin giảng viên thành công",
        data: instructor,
      });
    } catch (error) {
      console.error("Error getting instructor:", error);
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy một giảng viên theo ID cho admin (có Status và Gender từ account table)
  getInstructorByIdAdmin: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const instructor = await instructorService.getInstructorByIdAdmin(
        instructorId
      );

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin giảng viên thành công",
        data: instructor,
      });
    } catch (error) {
      console.error("Error getting instructor for admin:", error);
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin giảng viên",
        error: error.message,
      });
    }
  },

  // Tạo giảng viên mới
  createInstructor: async (req, res) => {
    const pool = await connectDB();
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
      console.log("[createInstructor] Request received:", {
        FullName: req.body.FullName,
        Email: req.body.Email,
        Type: req.body.Type,
        Gender: req.body.Gender,
      });

      const {
        FullName,
        Email,
        Phone,
        Password,
        Status,
        DateOfBirth,
        ProfilePicture,
        Job,
        Address,
        Major,
        InstructorFee,
        Type,
        Gender,
      } = req.body;

      // Validation chi tiết
      const validationErrors = [];

      if (!FullName || !FullName.trim()) {
        validationErrors.push("FullName là bắt buộc");
      }

      if (!Email || !Email.trim()) {
        validationErrors.push("Email là bắt buộc");
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(Email.trim())) {
          validationErrors.push("Email không đúng định dạng");
        }
      }

      if (!Password || !Password.trim()) {
        validationErrors.push("Password là bắt buộc");
      } else if (Password.length < 6) {
        validationErrors.push("Password phải có ít nhất 6 ký tự");
      }

      // Validate Type enum
      if (Type && !["fulltime", "parttime"].includes(Type)) {
        validationErrors.push("Type phải là 'fulltime' hoặc 'parttime'");
      }

      // Validate Gender enum
      if (Gender && !["male", "female", "other"].includes(Gender)) {
        validationErrors.push("Gender phải là 'male', 'female' hoặc 'other'");
      }

      if (validationErrors.length > 0) {
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: validationErrors,
        });
      }

      // Bắt đầu transaction
      await connection.beginTransaction();
      transactionStarted = true;
      console.log("[createInstructor] Transaction started");

      // Hash password
      const hashedPassword = await bcrypt.hash(Password, 10);
      const username =
        Email.split("@")[0] || FullName.toLowerCase().replace(/\s+/g, "");

      // Tạo account trước (sử dụng connection từ transaction)
      const normalizedEmail = Email.trim().toLowerCase();
      const normalizedUsername =
        username || normalizedEmail.split("@")[0] || "user";

      console.log("[createInstructor] Creating account...");
      const [accountResult] = await connection.execute(
        "INSERT INTO account (Username, Email, Phone, Password, Status, Provider, Gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          normalizedUsername,
          normalizedEmail,
          Phone || "",
          hashedPassword,
          Status || "active",
          "local",
          Gender || "other",
        ]
      );
      const accId = accountResult.insertId;
      console.log("[createInstructor] Account created, AccID:", accId);

      // Tạo instructor với AccID vừa tạo
      const instructorData = {
        AccID: accId,
        FullName: FullName,
        DateOfBirth: DateOfBirth || null,
        ProfilePicture: ProfilePicture || null,
        Job: Job || null,
        Address: Address || null,
        Major: Major || null,
        InstructorFee: InstructorFee ? parseFloat(InstructorFee) : null,
        Type: Type || "parttime",
        CV: req.body.CV || null,
      };

      console.log("[createInstructor] Creating instructor...");
      const [instructorResult] = await connection.execute(
        `INSERT INTO instructor (AccID, FullName, DateOfBirth, ProfilePicture, Job, Address, Major, InstructorFee, Type, CV)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instructorData.AccID,
          instructorData.FullName,
          instructorData.DateOfBirth,
          instructorData.ProfilePicture,
          instructorData.Job,
          instructorData.Address,
          instructorData.Major,
          instructorData.InstructorFee,
          instructorData.Type,
          instructorData.CV,
        ]
      );

      const newInstructor = {
        InstructorID: instructorResult.insertId,
        ...instructorData,
      };

      console.log(
        "[createInstructor] Instructor created, InstructorID:",
        newInstructor.InstructorID
      );

      // Commit transaction
      await connection.commit();
      transactionStarted = false;
      console.log("[createInstructor] Transaction committed successfully");

      connection.release();

      res.status(201).json({
        success: true,
        message: "Tạo giảng viên thành công",
        data: newInstructor,
      });
    } catch (error) {
      console.error("[createInstructor] Error:", error);
      console.error("[createInstructor] Error stack:", error.stack);

      // Rollback transaction nếu đã bắt đầu
      if (transactionStarted) {
        try {
          await connection.rollback();
          console.log("[createInstructor] Transaction rolled back");
        } catch (rollbackError) {
          console.error("[createInstructor] Rollback error:", rollbackError);
        }
      }

      // Release connection
      if (connection) {
        connection.release();
      }

      // Xử lý lỗi duplicate email
      if (error.code === "ER_DUP_ENTRY" && error.message?.includes("Email")) {
        return res.status(400).json({
          success: false,
          message: "Email đã được đăng ký",
          error: "Email has been registered!",
        });
      }

      // Xử lý lỗi database
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu trùng lặp",
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo giảng viên",
        error: error.message || "Lỗi không xác định",
      });
    }
  },

  // Cập nhật thông tin giảng viên
  updateInstructor: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const updateData = req.body;

      const updatedInstructor = await instructorService.updateInstructor(
        instructorId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Cập nhật thông tin giảng viên thành công",
        data: updatedInstructor,
      });
    } catch (error) {
      console.error("Error updating instructor:", error);
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin giảng viên",
        error: error.message,
      });
    }
  },

  // Xóa giảng viên
  deleteInstructor: async (req, res) => {
    try {
      const instructorId = req.params.id;

      await instructorService.deleteInstructor(instructorId);

      res.status(200).json({
        success: true,
        message: "Xóa giảng viên thành công",
      });
    } catch (error) {
      console.error("Error deleting instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy thông tin chi tiết giảng viên với khóa học
  getInstructorWithCourses: async (req, res) => {
    try {
      const instructorId = req.params.id;

      const instructorWithCourses =
        await instructorService.getInstructorWithCourses(instructorId);

      res.status(200).json({
        success: true,
        message: "Lấy thông tin giảng viên với khóa học thành công",
        data: instructorWithCourses,
      });
    } catch (error) {
      console.error("Error getting instructor with courses:", error);
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin giảng viên với khóa học",
        error: error.message,
      });
    }
  },

  // Lấy lịch dạy của giảng viên
  getInstructorSchedule: async (req, res) => {
    try {
      const instructorId = req.params.id;
      const { startDate, endDate } = req.query;

      const schedule = await instructorService.getInstructorSchedule(
        instructorId,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        message: "Lấy lịch dạy của giảng viên thành công",
        data: schedule,
      });
    } catch (error) {
      console.error("Error getting instructor schedule:", error);
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy lịch dạy của giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy thống kê giảng viên
  getInstructorStatistics: async (req, res) => {
    try {
      const instructorId = req.params.id;

      const statistics = await instructorService.getInstructorStatistics(
        instructorId
      );

      res.status(200).json({
        success: true,
        message: "Lấy thống kê giảng viên thành công",
        data: statistics,
      });
    } catch (error) {
      console.error("Error getting instructor statistics:", error);
      if (error.message === "Instructor not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê giảng viên",
        error: error.message,
      });
    }
  },

  // Upload ảnh đại diện cho giảng viên (lên Cloudinary)
  uploadAvatar: async (req, res) => {
    try {
      console.log("[uploadAvatar] Request received:", {
        hasFile: !!req.file,
        fileSize: req.file?.size,
        mimetype: req.file?.mimetype,
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được tải lên",
        });
      }

      // Upload lên Cloudinary
      console.log("[uploadAvatar] Uploading to Cloudinary...");
      const imageUrl = await uploadToCloudinary(
        req.file.buffer,
        "instructors/avatars"
      );
      console.log("[uploadAvatar] Upload successful, URL:", imageUrl);

      res.status(201).json({
        success: true,
        message: "Tải ảnh đại diện thành công",
        data: {
          url: imageUrl,
        },
      });
    } catch (error) {
      console.error("[uploadAvatar] Error uploading instructor avatar:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải ảnh đại diện",
        error: error.message,
      });
    }
  },

  // Upload CV cho giảng viên (lên Cloudinary)
  uploadCV: async (req, res) => {
    try {
      console.log("[uploadCV] Request received:", {
        hasFile: !!req.file,
        fileSize: req.file?.size,
        mimetype: req.file?.mimetype,
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được tải lên",
        });
      }

      // Upload lên Cloudinary (có thể là PDF hoặc file khác)
      console.log("[uploadCV] Uploading to Cloudinary...");
      const fileUrl = await uploadToCloudinary(
        req.file.buffer,
        "instructors/cvs"
      );
      console.log("[uploadCV] Upload successful, URL:", fileUrl);

      res.status(201).json({
        success: true,
        message: "Tải CV thành công",
        data: {
          url: fileUrl,
        },
      });
    } catch (error) {
      console.error("[uploadCV] Error uploading instructor CV:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải CV",
        error: error.message,
      });
    }
  },
};

module.exports = instructorController;
