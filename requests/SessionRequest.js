/**
 * SessionRequest - Class chứa dữ liệu gửi từ client khi tạo hoặc chỉnh sửa session
 */
class SessionRequest {
  constructor(data) {
    this.Title = data.Title;
    this.Description = data.Description;
    this.ClassID = data.ClassID;
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

    if (!this.ClassID) {
      errors.push("ClassID là bắt buộc");
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
      ClassID: this.ClassID,
      InstructorID: this.InstructorID,
    };
  }

  // Chuyển đổi thành object cho response
  toResponseObject() {
    return {
      Title: this.Title,
      Description: this.Description,
      ClassID: this.ClassID,
      InstructorID: this.InstructorID,
    };
  }
}

module.exports = SessionRequest;



