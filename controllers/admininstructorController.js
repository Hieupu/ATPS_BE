const instructorService = require("../services/instructorService");
const uploadToCloudinary = require("../utils/uploadCloudinary");

const instructorController = {
  // Lấy tất cả giảng viên
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

  // Lấy một giảng viên theo ID
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

  // Tạo giảng viên mới
  createInstructor: async (req, res) => {
    try {
      const instructorData = {
        AccID: req.body.AccID,
        FullName: req.body.FullName,
        DateOfBirth: req.body.DateOfBirth,
        ProfilePicture: req.body.ProfilePicture,
        Job: req.body.Job,
        Address: req.body.Address,
        Major: req.body.Major,
        InstructorFee: req.body.InstructorFee,
      };

      // Validation
      if (!instructorData.AccID || !instructorData.FullName) {
        return res.status(400).json({
          success: false,
          message: "AccID và FullName là bắt buộc",
        });
      }

      const newInstructor = await instructorService.createInstructor(
        instructorData
      );

      res.status(201).json({
        success: true,
        message: "Tạo giảng viên thành công",
        data: newInstructor,
      });
    } catch (error) {
      console.error("Error creating instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo giảng viên",
        error: error.message,
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
