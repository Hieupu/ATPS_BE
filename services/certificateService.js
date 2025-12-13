const certificateRepository = require("../repositories/certificateRepository");
const notificationRepository = require("../repositories/notificationRepository");
const instructorRepository = require("../repositories/instructorRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

class CertificateService {
  async getAllCertificates(filters = {}) {
    try {
      const {
        instructorId,
        status,
        page = 1,
        pageSize = 10,
        search = null,
      } = filters;
      return await certificateRepository.getAllCertificates({
        instructorId,
        status,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        search,
      });
    } catch (error) {
      console.error("Error in getAllCertificates service:", error);
      throw error;
    }
  }

  async getCertificateById(certificateId) {
    try {
      const certificate = await certificateRepository.getCertificateById(
        certificateId
      );
      if (!certificate) {
        throw new ServiceError("Chứng chỉ không tồn tại", 404);
      }
      return certificate;
    } catch (error) {
      console.error("Error in getCertificateById service:", error);
      throw error;
    }
  }

  async updateCertificateStatus(certificateId, status, adminAccID = null) {
    try {
      // Validate status
      const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        throw new ServiceError(
          `Trạng thái không hợp lệ. Chỉ cho phép: ${validStatuses.join(", ")}`,
          400
        );
      }

      // Get certificate info
      const certificate = await certificateRepository.getCertificateById(
        certificateId
      );
      if (!certificate) {
        throw new ServiceError("Chứng chỉ không tồn tại", 404);
      }

      // Update status
      const updated = await certificateRepository.updateCertificateStatus(
        certificateId,
        status
      );
      if (!updated) {
        throw new ServiceError("Cập nhật trạng thái chứng chỉ thất bại", 500);
      }

      // Get instructor info for notification
      const instructor = await instructorRepository.findById(
        certificate.InstructorID
      );
      if (instructor && instructor.AccID) {
        // Send notification to instructor
        let notificationContent = "";
        if (status === "APPROVED") {
          notificationContent = `Chứng chỉ "${certificate.Title}" của bạn đã được duyệt.`;
        } else if (status === "REJECTED") {
          notificationContent = `Chứng chỉ "${certificate.Title}" của bạn đã bị từ chối.`;
        } else {
          notificationContent = `Trạng thái chứng chỉ "${certificate.Title}" của bạn đã được cập nhật thành ${status}.`;
        }

        await notificationRepository.create({
          Content: notificationContent,
          Type: "certificate_status_change",
          Status: "unread",
          AccID: instructor.AccID,
        });
      }

      return await certificateRepository.getCertificateById(certificateId);
    } catch (error) {
      console.error("Error in updateCertificateStatus service:", error);
      throw error;
    }
  }

  async getCertificatesByInstructorId(
    instructorId,
    { page = 1, pageSize = 10, search = null, status = null } = {}
  ) {
    try {
      return await certificateRepository.getCertificatesByInstructorId(
        instructorId,
        {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          search,
          status,
        }
      );
    } catch (error) {
      console.error("Error in getCertificatesByInstructorId service:", error);
      throw error;
    }
  }
}

module.exports = new CertificateService();

