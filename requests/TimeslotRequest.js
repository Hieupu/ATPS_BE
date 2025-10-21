/**
 * TimeslotRequest - Class chứa dữ liệu gửi từ client khi tạo hoặc chỉnh sửa timeslot
 */
class TimeslotRequest {
  constructor(data) {
    this.StartTime = data.StartTime;
    this.EndTime = data.EndTime;
    this.Date = data.Date;
  }

  // Validation cho tạo mới
  validateForCreate() {
    const errors = [];

    if (!this.StartTime) {
      errors.push("StartTime là bắt buộc");
    }

    if (!this.EndTime) {
      errors.push("EndTime là bắt buộc");
    }

    if (!this.Date) {
      errors.push("Date là bắt buộc");
    }

    // Validate time format
    if (this.StartTime && !this.isValidTimeFormat(this.StartTime)) {
      errors.push("StartTime phải có format HH:mm:ss");
    }

    if (this.EndTime && !this.isValidTimeFormat(this.EndTime)) {
      errors.push("EndTime phải có format HH:mm:ss");
    }

    // Validate date format
    if (this.Date && !this.isValidDateFormat(this.Date)) {
      errors.push("Date phải có format YYYY-MM-DD");
    }

    // Validate time logic
    if (this.StartTime && this.EndTime && this.StartTime >= this.EndTime) {
      errors.push("EndTime phải sau StartTime");
    }

    // Validate date not in past (for create)
    if (this.Date && this.isDateInPast(this.Date)) {
      errors.push("Date không được là ngày đã qua");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Validation cho cập nhật
  validateForUpdate() {
    const errors = [];

    if (this.StartTime !== undefined) {
      if (!this.StartTime) {
        errors.push("StartTime không được để trống");
      }
      if (this.StartTime && !this.isValidTimeFormat(this.StartTime)) {
        errors.push("StartTime phải có format HH:mm:ss");
      }
    }

    if (this.EndTime !== undefined) {
      if (!this.EndTime) {
        errors.push("EndTime không được để trống");
      }
      if (this.EndTime && !this.isValidTimeFormat(this.EndTime)) {
        errors.push("EndTime phải có format HH:mm:ss");
      }
    }

    if (this.Date !== undefined) {
      if (!this.Date) {
        errors.push("Date không được để trống");
      }
      if (this.Date && !this.isValidDateFormat(this.Date)) {
        errors.push("Date phải có format YYYY-MM-DD");
      }
    }

    // Validate time logic if both are provided
    if (this.StartTime && this.EndTime && this.StartTime >= this.EndTime) {
      errors.push("EndTime phải sau StartTime");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Helper methods
  isValidTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  isValidDateFormat(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  }

  isDateInPast(date) {
    const today = new Date();
    const inputDate = new Date(date);
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate < today;
  }

  // Chuyển đổi thành object cho database
  toDatabaseObject() {
    return {
      StartTime: this.StartTime,
      EndTime: this.EndTime,
      Date: this.Date,
    };
  }

  // Chuyển đổi thành object cho response
  toResponseObject() {
    return {
      StartTime: this.StartTime,
      EndTime: this.EndTime,
      Date: this.Date,
    };
  }
}

module.exports = TimeslotRequest;



