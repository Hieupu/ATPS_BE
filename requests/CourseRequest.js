/**
 * CourseRequest - Class chứa dữ liệu gửi từ client khi tạo hoặc chỉnh sửa khóa học
 */
class CourseRequest {
  constructor(data) {
    this.Title = data.Title;
    this.Description = data.Description;
    this.Duration = data.Duration;
    this.TuitionFee = data.TuitionFee;
    this.Status = data.Status;
    this.InstructorID = data.InstructorID;
  }

  // Validation cho tạo mới
  validateForCreate() {
    const errors = [];

    if (!this.Title || this.Title.trim().length === 0) {
      errors.push("Title là bắt buộc");
    }

    if (this.Title && (this.Title.length < 3 || this.Title.length > 255)) {
      errors.push("Title phải từ 3-255 ký tự");
    }

    if (!this.Description || this.Description.trim().length === 0) {
      errors.push("Description là bắt buộc");
    }

    if (this.Description && this.Description.length < 10) {
      errors.push("Description phải tối thiểu 10 ký tự");
    }

    if (!this.Duration || this.Duration <= 0) {
      errors.push("Duration phải lớn hơn 0 (giờ)");
    }

    if (!this.TuitionFee || this.TuitionFee <= 0) {
      errors.push("TuitionFee phải lớn hơn 0 (VND)");
    }

    if (!this.Status) {
      errors.push("Status là bắt buộc");
    }

    const validStatuses = ["Published", "Draft", "Archived"];
    if (this.Status && !validStatuses.includes(this.Status)) {
      errors.push("Status phải là một trong: " + validStatuses.join(", "));
    }

    if (!this.InstructorID) {
      errors.push("InstructorID là bắt buộc");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validation cho cập nhật
  validateForUpdate() {
    const errors = [];

    if (this.Title !== undefined) {
      if (!this.Title || this.Title.trim().length === 0) {
        errors.push("Title không được để trống");
      }
      if (this.Title && (this.Title.length < 3 || this.Title.length > 255)) {
        errors.push("Title phải từ 3-255 ký tự");
      }
    }

    if (this.Description !== undefined) {
      if (!this.Description || this.Description.trim().length === 0) {
        errors.push("Description không được để trống");
      }
      if (this.Description && this.Description.length < 10) {
        errors.push("Description phải tối thiểu 10 ký tự");
      }
    }

    if (this.Duration !== undefined && this.Duration <= 0) {
      errors.push("Duration phải lớn hơn 0 (giờ)");
    }

    if (this.TuitionFee !== undefined && this.TuitionFee <= 0) {
      errors.push("TuitionFee phải lớn hơn 0 (VND)");
    }

    if (this.Status !== undefined) {
      const validStatuses = ["Published", "Draft", "Archived"];
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
      Title: this.Title,
      Description: this.Description,
      Duration: this.Duration,
      TuitionFee: this.TuitionFee,
      Status: this.Status,
      InstructorID: this.InstructorID,
    };
  }

  // Chuyển đổi thành object cho response
  toResponseObject() {
    return {
      Title: this.Title,
      Description: this.Description,
      Duration: this.Duration,
      TuitionFee: this.TuitionFee,
      Status: this.Status,
      InstructorID: this.InstructorID,
    };
  }
}

module.exports = CourseRequest;



