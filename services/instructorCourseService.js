const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const lessonRepository = require("../repositories/instructorLessonRepository"); // renamed
const materialRepository = require("../repositories/InstructorMaterialRepository");
const instructorRepository = require("../repositories/instructorRepository");
const uploadToCloudinary = require("../utils/uploadCloudinary");
// ====================== Common ======================
class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

//validate course
const ALLOWED_LEVELS = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const ALLOWED_STATUS = new Set([
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "DELETED",
]);

const upper = (v) =>
  String(v || "")
    .trim()
    .toUpperCase();

const toDecimal2 = (v, fallback = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n * 100) / 100;
};

const makeCourseCode = (title = "") => {
  const prefix =
    String(title)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4) || "COUR";
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${prefix}-${rand}`;
};

//validate unit
const ALLOWED_UNIT_STATUS = new Set(["VISIBLE", "HIDDEN", "DELETED"]);
//validate lesson
const ALLOWED_LESSON_TYPES = new Set(["video", "document", "audio"]);
const ALLOWED_LESSON_STATUS = new Set(["VISIBLE", "HIDDEN", "DELETED"]);
//validate material
const ALLOWED_MATERIAL_STATUS = new Set(["VISIBLE", "HIDDEN", "DELETED"]);

// async function resolveInstructorIdByAccId(accId) {
//   if (!accId) throw new ServiceError("Thiếu AccID từ token", 403);
//   const ins = await instructorRepository.findByAccountId(accId);
//   if (!ins) {
//     throw new ServiceError(
//       "Tài khoản chưa có hồ sơ giảng viên đã được duyệt",
//       403
//     );
//   }
//   return Number(ins.InstructorID);
// }

// ======================= COURSE =======================

const getCourseDetailService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  // Lấy danh sách units của course
  const units = await unitRepository.listByCourse(courseId);

  // Gắn lessons vào từng unit
  for (const unit of units) {
    const lessons = await lessonRepository.listByUnit(unit.UnitID);
    unit.Lessons = lessons;
  }

  // Lấy materials của course
  const materials = await materialRepository.listByCourse(courseId);

  return {
    ...course,
    Units: units,
    Materials: materials,
  };
};

const listInstructorCoursesService = async (instructorId) => {
  const courses = await courseRepository.listByInstructor(instructorId);
  if (!courses || courses.length === 0) {
    throw new ServiceError("Không tìm thấy khóa học nào", 404);
  }
  return courses;
};

const createCourseService = async (data, file) => {
  const {
    InstructorID,
    Title,
    Description,
    Image,
    Duration,
    Objectives,
    Requirements,
    Level,
    Status,
    Code,
  } = data || {};

  if (!InstructorID || !Title) {
    throw new ServiceError("InstructorID và Title là bắt buộc", 400);
  }

  // Level
  const levelUp = upper(Level || "BEGINNER");
  if (!ALLOWED_LEVELS.has(levelUp)) {
    throw new ServiceError(
      "Level không hợp lệ (BEGINNER|INTERMEDIATE|ADVANCED)",
      400
    );
  }

  // Status
  const statusUp = upper(Status || "DRAFT");
  if (!ALLOWED_STATUS.has(statusUp)) {
    throw new ServiceError(
      "Status không hợp lệ (DRAFT|IN_REVIEW|APPROVED|PUBLISHED|DELETED)",
      400
    );
  }

  const durationDec = toDecimal2(Duration, 0);
  const codeVal = (Code && String(Code).trim()) || makeCourseCode(Title);

  let imagePath = Image ?? "";

  if (file && file.buffer) {
    imagePath = await uploadToCloudinary(file.buffer, "courses");
  }

  const payload = {
    InstructorID,
    Title,
    Description: Description ?? "",
    Image: imagePath,
    Duration: durationDec,
    Objectives: (Objectives ?? "") + "",
    Requirements: (Requirements ?? "") + "",
    Level: levelUp,
    Status: statusUp,
    Code: codeVal,
  };

  return await courseRepository.create(payload);
};

const updateCourseService = async (courseId, data, file) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Chỉ có thể chỉnh sửa khi course ở trạng thái DRAFT",
      400
    );
  }

  let imagePatch;

  if (file && file.buffer) {
    // upload ảnh mới lên Cloudinary
    imagePatch = await uploadToCloudinary(file.buffer, "courses");
  } else if (Object.prototype.hasOwnProperty.call(data || {}, "Image")) {
    // nếu FE gửi Image (ví dụ URL text tự nhập), thì dùng
    imagePatch = data.Image;
  }

  const patch = {
    Title: data?.Title,
    Description: data?.Description,
    Duration:
      data?.Duration !== undefined ? toDecimal2(data.Duration, 0) : undefined,
    Objectives: data?.Objectives,
    Requirements: data?.Requirements,
    Level: data?.Level ? upper(data.Level) : undefined,
    Status: data?.Status ? upper(data.Status) : undefined,
  };

  if (imagePatch !== undefined) {
    patch.Image = imagePatch;
  }

  if (patch.Level && !ALLOWED_LEVELS.has(patch.Level)) {
    throw new ServiceError(
      "Level không hợp lệ (BEGINNER|INTERMEDIATE|ADVANCED)",
      400
    );
  }
  if (patch.Status && !ALLOWED_STATUS.has(patch.Status)) {
    throw new ServiceError(
      "Status không hợp lệ (DRAFT|IN_REVIEW|APPROVED|PUBLISHED|DELETED)",
      400
    );
  }

  await courseRepository.update(courseId, patch);
  return { message: "Cập nhật course thành công" };
};

const deleteCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError("Chỉ có thể xóa khi course ở trạng thái DRAFT", 400);
  }

  await courseRepository.markAsDeleted(courseId);
  return { message: "Khóa học đã được chuyển sang trạng thái DELETED" };
};

// ======================= UNIT =======================
const listUnitsByCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const units = await unitRepository.listByCourse(courseId);
  return { message: "Danh sách unit theo course", units };
};

const addUnitService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Chỉ có thể thêm Unit khi Course ở trạng thái DRAFT",
      400
    );
  }

  const title = data?.Title?.trim();
  if (!title) throw new ServiceError("Title là bắt buộc", 400);

  const payload = {
    Title: title,
    Description: data?.Description ?? "",
    Duration: toDecimal2(data?.Duration, 0),
    Status: data?.Status ? upper(data.Status) : "VISIBLE",
    OrderIndex: Number.isInteger(data?.OrderIndex) ? data.OrderIndex : 0,
  };

  if (!ALLOWED_UNIT_STATUS.has(payload.Status)) {
    throw new ServiceError("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)", 400);
  }

  return await unitRepository.create(courseId, payload);
};

const updateUnitService = async (unitId, data) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  // Chỉ cho sửa khi course đang DRAFT
  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể sửa Unit khi course không ở trạng thái DRAFT",
      400
    );
  }

  const patch = {
    Title: data?.Title !== undefined ? String(data.Title) : undefined,
    Description: data?.Description,
    Duration:
      data?.Duration !== undefined ? toDecimal2(data.Duration, 0) : undefined,
    Status: data?.Status ? upper(data.Status) : undefined,
    OrderIndex: Number.isInteger(data?.OrderIndex)
      ? data.OrderIndex
      : undefined,
  };

  if (patch.Status && !ALLOWED_UNIT_STATUS.has(patch.Status)) {
    throw new ServiceError("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)", 400);
  }

  // Không gửi patch rỗng
  if (Object.values(patch).every((v) => v === undefined)) {
    return { message: "Không có thay đổi để cập nhật" };
  }

  await unitRepository.update(unitId, patch);
  return { message: "Cập nhật Unit thành công" };
};

const deleteUnitService = async (unitId) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể xóa Unit khi course không ở trạng thái DRAFT",
      400
    );
  }

  await unitRepository.markAsDeleted(unitId);
  return { message: "Đã chuyển Unit sang trạng thái DELETED" };
};

const getAssignmentsByUnitIdService = async (unitId) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);
  if (unit.Status === "DELETED") throw new ServiceError("Unit đã bị xóa", 404);

  const assignments = await unitRepository.getAssignmentsByUnitId(unitId);

  return {
    message: "Danh sách Assignment của Unit",
    unit: { UnitID: unit.UnitID, Title: unit.Title, Status: unit.Status },
    total: assignments.length,
    assignments,
  };
};

// ======================= LESSON =======================
const listLessonsByUnitService = async (unitId) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const lessons = await lessonRepository.listByUnit(unitId);
  return { message: "Danh sách lesson theo unit", lessons };
};

const addLessonService = async (unitId, data, file) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể thêm Lesson khi course không ở trạng thái DRAFT",
      400
    );
  }

  const { Title, Duration, Type, Status, OrderIndex } = data || {};
  if (!Title?.trim()) throw new ServiceError("Title là bắt buộc", 400);

  // Type enum (video|document|audio)
  if (Type && !ALLOWED_LESSON_TYPES.has(String(Type).toLowerCase())) {
    throw new ServiceError("Type không hợp lệ (video|document|audio)", 400);
  }

  // Status enum
  const statusUp = Status ? upper(Status) : "VISIBLE";
  if (!ALLOWED_LESSON_STATUS.has(statusUp)) {
    throw new ServiceError("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)", 400);
  }

  // FileURL (nếu có upload)
  let fileURL = data?.FileURL ?? "";
  if (file) {
    fileURL = await uploadToCloudinary(file.buffer, "lessons");
  }

  const payload = {
    Title: Title.trim(),
    Duration: toDecimal2(Duration, 0),
    Type: Type ? String(Type).toLowerCase() : "video",
    FileURL: fileURL,
    OrderIndex: Number.isInteger(OrderIndex) ? OrderIndex : 0,
    Status: statusUp,
  };

  return await lessonRepository.create(unitId, payload);
};

const updateLessonService = async (lessonId, unitId, data, file) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể sửa Lesson khi course không ở trạng thái DRAFT",
      400
    );
  }

  // Chuẩn bị patch
  let fileURL = data?.FileURL;
  if (file) {
    fileURL = await uploadToCloudinary(file.buffer, "lessons");
  }

  const patch = {
    Title: data?.Title,
    Duration:
      data?.Duration !== undefined ? toDecimal2(data.Duration, 0) : undefined,
    Type: data?.Type
      ? (function (t) {
          const low = String(t).toLowerCase();
          if (!ALLOWED_LESSON_TYPES.has(low)) {
            throw new ServiceError(
              "Type không hợp lệ (video|document|audio)",
              400
            );
          }
          return low;
        })(data.Type)
      : undefined,
    FileURL: fileURL,
    OrderIndex: Number.isInteger(data?.OrderIndex)
      ? data.OrderIndex
      : undefined,
    Status: data?.Status
      ? (function (s) {
          const up = upper(s);
          if (!ALLOWED_LESSON_STATUS.has(up)) {
            throw new ServiceError(
              "Status không hợp lệ (VISIBLE|HIDDEN|DELETED)",
              400
            );
          }
          return up;
        })(data.Status)
      : undefined,
  };

  if (Object.values(patch).every((v) => v === undefined)) {
    return { message: "Không có thay đổi để cập nhật" };
  }

  await lessonRepository.update(lessonId, unitId, patch);
  return { message: "Đã cập nhật lesson" };
};

const deleteLessonService = async (lessonId, unitId) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể xóa Lesson khi course không ở trạng thái DRAFT",
      400
    );
  }

  // Xoá mềm theo repo
  await lessonRepository.markAsDeleted(lessonId, unitId);
  return { message: "Đã chuyển lesson sang trạng thái DELETED" };
};

// ======================= MATERIAL =======================
const listMaterialsByCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const materials = await materialRepository.listByCourse(courseId);
  return { message: "Danh sách material theo course", materials };
};

const addMaterialService = async (courseId, data, file) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể thêm Material khi course không ở trạng thái DRAFT",
      400
    );
  }

  const { Title, Status } = data || {};
  if (!Title?.trim()) throw new ServiceError("Title là bắt buộc", 400);

  let fileURL = data?.FileURL ?? "";
  if (file) fileURL = await uploadToCloudinary(file.buffer, "materials");

  const statusUp = Status ? upper(Status) : "VISIBLE";
  if (!ALLOWED_MATERIAL_STATUS.has(statusUp)) {
    throw new ServiceError("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)", 400);
  }

  return await materialRepository.create(courseId, {
    Title: Title.trim(),
    FileURL: fileURL,
    Status: statusUp,
  });
};

const updateMaterialService = async (materialId, data, file) => {
  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  // Kiểm tra course của material
  const course = await courseRepository.findById(material.CourseID);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể cập nhật Material khi course không ở trạng thái DRAFT",
      400
    );
  }

  let fileURL = data?.FileURL ?? material.FileURL;
  if (file) fileURL = await uploadToCloudinary(file.buffer, "materials");

  // Chuẩn bị patch (chỉ các field repo cho phép)
  const patch = {
    Title: data?.Title !== undefined ? String(data.Title) : undefined,
    FileURL: fileURL,
    Status: data?.Status ? upper(data.Status) : undefined,
  };

  if (patch.Status && !ALLOWED_MATERIAL_STATUS.has(patch.Status)) {
    throw new ServiceError("Status không hợp lệ (VISIBLE|HIDDEN|DELETED)", 400);
  }

  // Không gửi patch rỗng
  if (Object.values(patch).every((v) => v === undefined)) {
    return { message: "Không có thay đổi để cập nhật" };
  }

  await materialRepository.update(materialId, patch);
  return { message: "Đã cập nhật material" };
};

const deleteMaterialService = async (materialId) => {
  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  const course = await courseRepository.findById(material.CourseID);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Không thể xóa Material khi course không ở trạng thái DRAFT",
      400
    );
  }

  // Xoá mềm theo repo/DB
  await materialRepository.markAsDeleted(materialId);
  return { message: "Đã chuyển material sang trạng thái DELETED" };
};

// ======================= WORKFLOW =======================
const submitCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "DRAFT") {
    throw new ServiceError(
      "Chỉ có thể gửi duyệt khi course đang ở trạng thái DRAFT",
      400
    );
  }

  await courseRepository.updateStatus(courseId, "IN_REVIEW");
  return { message: "Khóa học đã gửi duyệt", status: "IN_REVIEW" };
};

const approveCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "IN_REVIEW") {
    throw new ServiceError(
      "Chỉ có thể duyệt khi course đang ở trạng thái IN_REVIEW",
      400
    );
  }

  await courseRepository.updateStatus(courseId, "APPROVED");
  return { message: "Course đã được duyệt", status: "APPROVED" };
};

const publishCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (upper(course.Status) !== "APPROVED") {
    throw new ServiceError(
      "Chỉ có thể publish khi course đã ở trạng thái APPROVED",
      400
    );
  }

  await courseRepository.updateStatus(courseId, "PUBLISHED");
  return { message: "Course đã publish", status: "PUBLISHED" };
};

module.exports = {
  listInstructorCoursesService,
  getCourseDetailService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
  submitCourseService,
  approveCourseService,
  publishCourseService,
  toDecimal2,
  listUnitsByCourseService,
  addUnitService,
  updateUnitService,
  deleteUnitService,
  getAssignmentsByUnitIdService,
  makeCourseCode,
  listLessonsByUnitService,
  addLessonService,
  updateLessonService,
  deleteLessonService,

  listMaterialsByCourseService,
  addMaterialService,
  updateMaterialService,
  deleteMaterialService,

  // utils
  makeCourseCode,
  toDecimal2,
};
