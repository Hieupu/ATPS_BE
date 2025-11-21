const { CLASS_STATUS } = require("../constants/classStatus");

/**
 * Hàm Validate Trạng thái: Đảm bảo Admin không sửa lịch của lớp đã đóng
 * @param {string} classStatus - Trạng thái hiện tại của lớp
 * @returns {boolean} - true nếu có thể chỉnh sửa
 * @throws {Error} - Nếu không thể chỉnh sửa
 */
function validateClassStatusForEdit(classStatus) {
  const lockedStatuses = [
    CLASS_STATUS.CLOSE,
    CLASS_STATUS.DONE,
    CLASS_STATUS.COMPLETED,
    CLASS_STATUS.CANCEL,
    CLASS_STATUS.CANCELLED,
  ];

  if (lockedStatuses.includes(classStatus)) {
    throw new Error(
      `Không thể chỉnh sửa lớp ở trạng thái ${classStatus}. Lớp đã đóng hoặc đã hủy.`
    );
  }

  return true;
}

/**
 * Kiểm tra lớp có thể đăng ký không (status phải là PUBLISHED hoặc OPEN)
 * @param {string} classStatus - Trạng thái hiện tại của lớp
 * @returns {boolean}
 */
function canEnroll(classStatus) {
  const enrollableStatuses = [
    CLASS_STATUS.PUBLISHED,
    "OPEN", // Alias cho PUBLISHED
  ];

  return enrollableStatuses.includes(classStatus);
}

/**
 * Kiểm tra lớp có thể chỉnh sửa không (status phải là DRAFT hoặc PENDING)
 * @param {string} classStatus - Trạng thái hiện tại của lớp
 * @returns {boolean}
 */
function canEdit(classStatus) {
  const editableStatuses = [
    CLASS_STATUS.DRAFT,
    CLASS_STATUS.PENDING,
    CLASS_STATUS.PENDING_APPROVAL,
  ];

  return editableStatuses.includes(classStatus);
}

/**
 * Kiểm tra lớp có thể duyệt không (status phải là PENDING hoặc PENDING_APPROVAL)
 * @param {string} classStatus - Trạng thái hiện tại của lớp
 * @returns {boolean}
 */
function canApprove(classStatus) {
  const approvableStatuses = [
    CLASS_STATUS.PENDING,
    CLASS_STATUS.PENDING_APPROVAL,
  ];

  return approvableStatuses.includes(classStatus);
}

/**
 * Kiểm tra lớp có thể xuất bản không (status phải là APPROVED)
 * @param {string} classStatus - Trạng thái hiện tại của lớp
 * @returns {boolean}
 */
function canPublish(classStatus) {
  return classStatus === CLASS_STATUS.APPROVED;
}

module.exports = {
  validateClassStatusForEdit,
  canEnroll,
  canEdit,
  canApprove,
  canPublish,
};

