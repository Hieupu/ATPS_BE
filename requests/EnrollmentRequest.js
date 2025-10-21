/**
 * EnrollmentRequest - Class chứa dữ liệu gửi từ client khi tạo enrollment
 */
class EnrollmentRequest {
  constructor(data) {
    this.ClassID = data.ClassID;
    this.LearnerID = data.LearnerID;
    this.Status = data.Status || "Pending";
    this.EnrollmentDate = data.EnrollmentDate || new Date().toISOString();
  }

  // Validation cho tạo mới
  validateForCreate() {
    const errors = [];

    if (!this.ClassID) {
      errors.push("ClassID là bắt buộc");
    }

    if (!this.LearnerID) {
      errors.push("LearnerID là bắt buộc");
    }

    if (this.Status) {
      const validStatuses = ["Pending", "Paid", "Cancelled"];
      if (!validStatuses.includes(this.Status)) {
        errors.push("Status phải là một trong: " + validStatuses.join(", "));
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validation cho cập nhật
  validateForUpdate() {
    const errors = [];

    if (this.Status !== undefined) {
      const validStatuses = ["Pending", "Paid", "Cancelled"];
      if (this.Status && !validStatuses.includes(this.Status)) {
        errors.push("Status phải là một trong: " + validStatuses.join(", "));
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Chuyển đổi thành object cho database
  toDatabaseObject() {
    return {
      ClassID: this.ClassID,
      LearnerID: this.LearnerID,
      Status: this.Status,
      EnrollmentDate: this.EnrollmentDate,
    };
  }

  // Chuyển đổi thành object cho response
  toResponseObject() {
    return {
      ClassID: this.ClassID,
      LearnerID: this.LearnerID,
      Status: this.Status,
      EnrollmentDate: this.EnrollmentDate,
    };
  }
}

module.exports = EnrollmentRequest;



