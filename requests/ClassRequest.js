/**
 * ClassRequest - Class chứa dữ liệu gửi từ client khi tạo hoặc chỉnh sửa lớp học
 */
class ClassRequest {
  constructor(data) {
    this.ClassName = data.ClassName;
    this.ZoomURL = data.ZoomURL;
    this.Status = data.Status;
    this.CourseID = data.CourseID;
    this.InstructorID = data.InstructorID;
  }

  // Validation cho tạo mới
  validateForCreate() {
    const errors = [];

    if (!this.ClassName || this.ClassName.trim().length === 0) {
      errors.push("ClassName là bắt buộc");
    }

    if (
      this.ClassName &&
      (this.ClassName.length < 1 || this.ClassName.length > 45)
    ) {
      errors.push("ClassName phải từ 1-45 ký tự");
    }

    if (this.ZoomURL && this.ZoomURL.trim().length > 0) {
      try {
        new URL(this.ZoomURL);
      } catch {
        errors.push("ZoomURL phải là URL hợp lệ");
      }
    }

    if (!this.Status) {
      errors.push("Status là bắt buộc");
    }

    const validStatuses = [
      "Chưa phân giảng viên",
      "Sắp khai giảng",
      "Đang hoạt động",
      "Đã kết thúc",
      "Tạm dừng",
    ];
    if (this.Status && !validStatuses.includes(this.Status)) {
      errors.push("Status phải là một trong: " + validStatuses.join(", "));
    }

    if (this.Status === "Đang hoạt động" && !this.InstructorID) {
      errors.push("Nếu Status = 'Đang hoạt động' thì phải có InstructorID");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validation cho cập nhật
  validateForUpdate() {
    const errors = [];

    if (this.ClassName !== undefined) {
      if (!this.ClassName || this.ClassName.trim().length === 0) {
        errors.push("ClassName không được để trống");
      }
      if (
        this.ClassName &&
        (this.ClassName.length < 1 || this.ClassName.length > 45)
      ) {
        errors.push("ClassName phải từ 1-45 ký tự");
      }
    }

    if (
      this.ZoomURL !== undefined &&
      this.ZoomURL &&
      this.ZoomURL.trim().length > 0
    ) {
      try {
        new URL(this.ZoomURL);
      } catch {
        errors.push("ZoomURL phải là URL hợp lệ");
      }
    }

    if (this.Status !== undefined) {
      const validStatuses = [
        "Chưa phân giảng viên",
        "Sắp khai giảng",
        "Đang hoạt động",
        "Đã kết thúc",
        "Tạm dừng",
      ];
      if (this.Status && !validStatuses.includes(this.Status)) {
        errors.push("Status phải là một trong: " + validStatuses.join(", "));
      }
    }

    if (this.Status === "Đang hoạt động" && !this.InstructorID) {
      errors.push("Nếu Status = 'Đang hoạt động' thì phải có InstructorID");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Chuyển đổi thành object cho database
  toDatabaseObject() {
    return {
      ClassName: this.ClassName,
      ZoomURL: this.ZoomURL || null,
      Status: this.Status,
      CourseID: this.CourseID || null,
      InstructorID: this.InstructorID || null,
    };
  }

  // Chuyển đổi thành object cho response
  toResponseObject() {
    return {
      ClassName: this.ClassName,
      ZoomURL: this.ZoomURL,
      Status: this.Status,
      CourseID: this.CourseID,
      InstructorID: this.InstructorID,
    };
  }
}

module.exports = ClassRequest;



