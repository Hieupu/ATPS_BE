const certificateService = require("../services/certificateService");

const certificateController = {
  // Lấy tất cả chứng chỉ (có thể filter theo instructorId và status)
  getAllCertificates: async (req, res) => {
    try {
      const { instructorId, status, page, pageSize, search } = req.query;
      const filters = {};
      if (instructorId) filters.instructorId = parseInt(instructorId);
      if (status) filters.status = status;
      if (page) filters.page = parseInt(page);
      if (pageSize) filters.pageSize = parseInt(pageSize);
      if (search) filters.search = search;

      const result = await certificateService.getAllCertificates(filters);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách chứng chỉ thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error getting certificates:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách chứng chỉ",
        error: error.message,
      });
    }
  },

  // Lấy một chứng chỉ theo ID
  getCertificateById: async (req, res) => {
    try {
      const certificateId = req.params.id;
      const certificate = await certificateService.getCertificateById(
        certificateId
      );

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chứng chỉ",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin chứng chỉ thành công",
        data: certificate,
      });
    } catch (error) {
      console.error("Error getting certificate:", error);
      if (error.message === "Certificate not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chứng chỉ",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin chứng chỉ",
        error: error.message,
      });
    }
  },

  // Cập nhật trạng thái chứng chỉ (APPROVED, REJECTED)
  updateCertificateStatus: async (req, res) => {
    try {
      const certificateId = req.params.id;
      const { status } = req.body;
      const adminAccID = req.user ? req.user.AccID : null;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status là bắt buộc",
        });
      }

      const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status không hợp lệ. Phải là một trong: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      const updatedCertificate =
        await certificateService.updateCertificateStatus(
          certificateId,
          status,
          adminAccID
        );

      res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái chứng chỉ thành công",
        data: updatedCertificate,
      });
    } catch (error) {
      console.error("Error updating certificate status:", error);
      if (error.message === "Certificate not found") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chứng chỉ",
          error: error.message,
        });
      }
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái chứng chỉ",
        error: error.message,
      });
    }
  },

  // Lấy chứng chỉ theo instructorId
  getCertificatesByInstructorId: async (req, res) => {
    try {
      const instructorId = req.params.instructorId;
      const { page, pageSize, search, status } = req.query;
      const paginationOptions = {};
      if (page) paginationOptions.page = parseInt(page);
      if (pageSize) paginationOptions.pageSize = parseInt(pageSize);
      if (search) paginationOptions.search = search;
      if (status) paginationOptions.status = status;

      const result = await certificateService.getCertificatesByInstructorId(
        instructorId,
        paginationOptions
      );

      res.status(200).json({
        success: true,
        message: "Lấy danh sách chứng chỉ thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error getting certificates by instructor ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách chứng chỉ",
        error: error.message,
      });
    }
  },
};

module.exports = certificateController;
