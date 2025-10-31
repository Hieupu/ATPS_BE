const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const lessonRepository = require("../repositories/instructorLessonRepository"); // renamed
const materialRepository = require("../repositories/InstructorMaterialRepository");
const instructorRepository = require("../repositories/instructorRepository");

// ====================== Common ======================
class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

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
const listInstructorCoursesService = async (instructorId) => {
  const courses = await courseRepository.listByInstructor(instructorId);
  if (!courses || courses.length === 0) {
    throw new ServiceError("Không tìm thấy khóa học nào", 404);
  }
  return courses;
};

const createCourseService = async (data) => {
  const { InstructorID, Title, Description, Duration, Fee } = data;
  if (!InstructorID || !Title)
    throw new ServiceError("InstructorID và Title là bắt buộc", 400);

  return await courseRepository.create({
    InstructorID,
    Title,
    Description,
    Duration,
    Fee, // Fee!
    Status: "draft",
  });
};

const updateCourseService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Chỉ có thể chỉnh sửa khi course ở trạng thái draft hoặc rejected",
      400
    );

  const patch = {
    Title: data.Title,
    Description: data.Description,
    Duration: data.Duration,
    Fee: data.Fee,
  };
  return await courseRepository.update(courseId, patch);
};

const deleteCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Chỉ có thể xóa khi course ở trạng thái draft hoặc rejected",
      400
    );

  await courseRepository.markAsDeleted(courseId);
  return { message: "Khóa học đã được chuyển sang trạng thái deleted" };
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

  if (course.Status !== "draft")
    throw new ServiceError(
      "Chỉ có thể thêm Unit khi Course ở trạng thái draft",
      400
    );

  return await unitRepository.create(courseId, data);
};

const updateUnitService = async (unitId, data) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Không thể sửa Unit khi course đã được duyệt hoặc publish",
      400
    );

  return await unitRepository.update(unitId, data);
};

const deleteUnitService = async (unitId) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Không thể xóa Unit khi course đã được duyệt hoặc publish",
      400
    );

  await unitRepository.delete(unitId);
  return { message: "Đã xóa Unit thành công" };
};

// ======================= LESSON =======================
const listLessonsByUnitService = async (unitId) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const lessons = await lessonRepository.listByUnit(unitId);
  return { message: "Danh sách lesson theo unit", lessons };
};

const addLessonService = async (unitId, data) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Không thể thêm Lesson khi course đã được duyệt hoặc publish",
      400
    );

  const { Title, Time, Type, FileURL } = data || {};
  if (!Title) throw new ServiceError("Title là bắt buộc", 400);

  return await lessonRepository.create(unitId, { Title, Time, Type, FileURL });
};

const updateLessonService = async (lessonId, unitId, data) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Không thể sửa Lesson khi course đã được duyệt hoặc publish",
      400
    );

  const patch = {
    Title: data.Title,
    Time: data.Time,
    Type: data.Type,
    FileURL: data.FileURL,
  };
  await lessonRepository.update(lessonId, unitId, patch);
  return { message: "Đã cập nhật lesson" };
};

const deleteLessonService = async (lessonId, unitId) => {
  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  const course = await courseRepository.findById(unit.CourseID);
  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Không thể xóa Lesson khi course đã được duyệt hoặc publish",
      400
    );

  await lessonRepository.delete(lessonId, unitId);
  return { message: "Đã xóa lesson thành công" };
};

// ======================= MATERIAL =======================
const listMaterialsByCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const materials = await materialRepository.listByCourse(courseId);
  return { message: "Danh sách material theo course", materials };
};

const addMaterialService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);
  return await materialRepository.create(courseId, data);
};

const updateMaterialService = async (materialId, data) => {
  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  await materialRepository.update(materialId, data);
  return { message: "Đã cập nhật material" };
};

const deleteMaterialService = async (materialId) => {
  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  await materialRepository.delete(materialId);
  return { message: "Đã xóa material thành công" };
};

// ======================= WORKFLOW =======================
const submitCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);
  if (course.Status !== "draft")
    throw new ServiceError("Chỉ gửi duyệt khi trạng thái là draft", 400);

  await courseRepository.updateStatus(courseId, "pending");
  return { message: "Khóa học đã gửi duyệt", status: "pending" };
};

const approveCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  await courseRepository.updateStatus(courseId, "approved");
  return { message: "Course đã được duyệt", status: "approved" };
};

const publishCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);
  if (course.Status !== "approved")
    throw new ServiceError("Chỉ có thể publish khi course đã được duyệt", 400);

  await courseRepository.updateStatus(courseId, "published");
  return { message: "Course đã publish", status: "published" };
};

// ======================= GET DETAIL / LIST =======================
const getCourseDetailService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const units = await unitRepository.listByCourse(courseId);
  const materials = await materialRepository.listByCourse(courseId);

  for (const u of units) {
    const lessons = await lessonRepository.listByUnit(u.UnitID);
    u.Lessons = lessons; // rename Lessions -> Lessons
  }

  return { ...course, Units: units, Materials: materials };
};

const getInstructorCoursesService = async (instructorId) => {
  const courses = await courseRepository.findByInstructor(instructorId);
  return courses;
};

module.exports = {
  listInstructorCoursesService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
  submitCourseService,
  approveCourseService,
  publishCourseService,

  listUnitsByCourseService,
  addUnitService,
  updateUnitService,
  deleteUnitService,

  listLessonsByUnitService,
  addLessonService,
  updateLessonService,
  deleteLessonService,

  listMaterialsByCourseService,
  addMaterialService,
  updateMaterialService,
  deleteMaterialService,

  getCourseDetailService,
  getInstructorCoursesService,
};
