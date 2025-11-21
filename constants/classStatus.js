/**
 * Class Status Constants - dbver5
 * 
 * Quy trình status:
 * DRAFT -> WAITING -> PENDING -> APPROVED -> ACTIVE -> ON_GOING -> CLOSE
 * Hoặc có thể CANCEL ở bất kỳ giai đoạn nào
 * 
 * - DRAFT: Nháp (admin tạo lớp)
 * - WAITING: Admin gửi lớp cho instructor (chờ instructor xem xét)
 * - PENDING: Instructor gửi lại cho admin (chờ admin duyệt)
 * - APPROVED: Admin đã duyệt
 * - ACTIVE: Đang tuyển sinh (thay thế OPEN)
 * - ON_GOING: Đang diễn ra
 * - CLOSE: Đã kết thúc (thay thế CLOSED)
 * - CANCEL: Đã hủy (thay thế CANCELLED)
 */

const CLASS_STATUS = {
  // Trạng thái ban đầu: Lớp đang được tạo/chỉnh sửa
  DRAFT: "DRAFT",

  // Admin gửi lớp cho instructor (chờ instructor xem xét)
  WAITING: "WAITING",

  // Instructor gửi lại cho admin (chờ admin duyệt)
  PENDING: "PENDING",
  PENDING_APPROVAL: "PENDING", // Alias cho PENDING (backward compatibility)

  // Đã được duyệt: Sẵn sàng để xuất bản
  APPROVED: "APPROVED",

  // Đang tuyển sinh: Hiển thị trên hệ thống, học viên có thể đăng ký
  ACTIVE: "ACTIVE",
  OPEN: "ACTIVE", // Alias cho ACTIVE (backward compatibility)
  PUBLISHED: "ACTIVE", // Alias cho ACTIVE (backward compatibility)

  // Đang diễn ra: Lớp đã bắt đầu học
  ON_GOING: "ON_GOING",

  // Đã kết thúc: Lớp đã hoàn thành
  CLOSE: "CLOSE",
  CLOSED: "CLOSE", // Alias cho CLOSE (backward compatibility)
  DONE: "CLOSE", // Alias cho CLOSE
  COMPLETED: "CLOSE", // Alias cho CLOSE

  // Đã hủy: Lớp bị hủy ở bất kỳ giai đoạn nào
  CANCEL: "CANCEL",
  CANCELLED: "CANCEL", // Alias cho CANCEL (backward compatibility)
};

/**
 * Kiểm tra status có hợp lệ không
 */
function isValidStatus(status) {
  return Object.values(CLASS_STATUS).includes(status);
}

/**
 * Lấy danh sách tất cả status
 */
function getAllStatuses() {
  return Object.values(CLASS_STATUS);
}

/**
 * Kiểm tra status có thể chuyển sang status mới không
 */
function canTransitionTo(currentStatus, newStatus) {
  // Normalize status (hỗ trợ alias)
  const normalize = (status) => {
    if (status === CLASS_STATUS.PENDING_APPROVAL) return CLASS_STATUS.PENDING;
    if (status === CLASS_STATUS.OPEN || status === CLASS_STATUS.PUBLISHED) return CLASS_STATUS.ACTIVE;
    if (status === CLASS_STATUS.CLOSED || status === CLASS_STATUS.DONE || status === CLASS_STATUS.COMPLETED) return CLASS_STATUS.CLOSE;
    if (status === CLASS_STATUS.CANCELLED) return CLASS_STATUS.CANCEL;
    return status;
  };

  const current = normalize(currentStatus);
  const target = normalize(newStatus);

  const transitions = {
    [CLASS_STATUS.DRAFT]: [
      CLASS_STATUS.WAITING,
      CLASS_STATUS.CANCEL,
    ],
    [CLASS_STATUS.WAITING]: [
      CLASS_STATUS.PENDING,
      CLASS_STATUS.DRAFT, // Instructor từ chối, trả về DRAFT
      CLASS_STATUS.CANCEL,
    ],
    [CLASS_STATUS.PENDING]: [
      CLASS_STATUS.APPROVED,
      CLASS_STATUS.DRAFT, // Admin từ chối, trả về DRAFT
      CLASS_STATUS.CANCEL,
    ],
    [CLASS_STATUS.APPROVED]: [
      CLASS_STATUS.ACTIVE,
      CLASS_STATUS.CANCEL,
    ],
    [CLASS_STATUS.ACTIVE]: [
      CLASS_STATUS.ON_GOING,
      CLASS_STATUS.CANCEL,
    ],
    [CLASS_STATUS.ON_GOING]: [
      CLASS_STATUS.CLOSE,
      CLASS_STATUS.CANCEL,
    ],
    [CLASS_STATUS.CLOSE]: [], // Không thể chuyển từ CLOSE
    [CLASS_STATUS.CANCEL]: [], // Không thể chuyển từ CANCEL
  };

  return transitions[current]?.includes(target) || false;
}

module.exports = {
  CLASS_STATUS,
  isValidStatus,
  getAllStatuses,
  canTransitionTo,
};

