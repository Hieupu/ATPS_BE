const connectDB = require("../config/db");
const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const sessionRepository = require("../repositories/instructorSessionRepository");
const lessonRepository = require("../repositories/instructorLessionRepository");
const materialRepository = require("../repositories/InstructorMaterialRepository");
const timeslotRepository = require("../repositories/InstructorTimeslotRepository");
const classRepository = require("../repositories/classRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const ensureSessionBelongsToCourse = async (courseId, session) => {
  const klass = await classRepository.findById(session.ClassID);
  if (!klass) throw new ServiceError("Class của session không tồn tại", 404);
  if (Number(klass.CourseID) !== Number(courseId)) {
    console.log(klass.CourseID, courseId);

    throw new ServiceError("Session không thuộc về course này", 403);
  }
};

// ======================= COURSE =======================
const createCourseService = async (data) => {
  const { Title, Description, Duration, TuitionFee } = data;

  if (!Title) {
    throw new ServiceError("Title là bắt buộc", 400);
  }

  return await courseRepository.create({
    Title,
    Description,
    Duration,
    TuitionFee,
    Status: "draft",
  });
};

const updateCourseService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (!["draft", "rejected"].includes(course.Status)) {
    throw new ServiceError(
      "Chỉ có thể chỉnh sửa khi course ở trạng thái draft hoặc rejected",
      400
    );
  }

  const { InstructorID, ...safeData } = data || {};
  await courseRepository.update(courseId, safeData);
  return await courseRepository.findById(courseId);
};

const deleteCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (!["draft", "rejected"].includes(course.Status)) {
    throw new ServiceError(
      "Chỉ có thể xóa khi course ở trạng thái draft hoặc rejected",
      400
    );
  }

  await courseRepository.delete(courseId);
  return { message: "Đã xóa khóa học thành công" };
};

// ======================= UNIT =======================
const addUnitService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (course.Status !== "draft") {
    throw new ServiceError(
      "Chỉ có thể thêm Unit khi Course ở trạng thái draft",
      400
    );
  }

  // Không cho đổi CourseID qua body
  const { CourseID, ...safe } = data || {};
  return await unitRepository.create(courseId, safe);
};

const updateUnitService = async (courseId, unitId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  if (Number(unit.CourseID) !== Number(courseId)) {
    throw new ServiceError("Unit không thuộc về course này", 403);
  }

  if (!["draft", "rejected"].includes(course.Status)) {
    throw new ServiceError(
      "Không thể sửa Unit khi course đã được duyệt hoặc publish",
      400
    );
  }

  const { CourseID, ...safe } = data || {};
  await unitRepository.update(unitId, safe);

  // trả lại dữ liệu mới nhất
  return await unitRepository.findById(unitId);
};

const deleteUnitService = async (courseId, unitId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  if (Number(unit.CourseID) !== Number(courseId)) {
    throw new ServiceError("Unit không thuộc về course này", 403);
  }

  if (!["draft", "rejected"].includes(course.Status)) {
    throw new ServiceError(
      "Không thể xóa Unit khi course đã được duyệt hoặc publish",
      400
    );
  }

  await unitRepository.delete(unitId);
  return { message: "Đã xóa Unit thành công" };
};

// ======================= SESSION =======================
const createSessionService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const { Title, Description, InstructorID, ClassID, TimeslotID } = data || {};
  if (!Title || !Description || !InstructorID || !ClassID || !TimeslotID) {
    throw new ServiceError(
      "Title, Description, InstructorID, ClassID, TimeslotID là bắt buộc",
      400
    );
  }

  const klass = await classRepository.findById(ClassID);
  if (!klass) throw new ServiceError("Class không tồn tại", 404);
  if (Number(klass.CourseID) !== Number(courseId)) {
    throw new ServiceError("Class không thuộc về course này", 403);
  }

  if (Number(klass.InstructorID) !== Number(InstructorID)) {
    throw new ServiceError(
      "InstructorID không khớp với giảng viên của class",
      400
    );
  }

  return await sessionRepository.create({
    Title,
    Description,
    InstructorID,
    ClassID,
    TimeslotID,
  });
};

const updateSessionService = async (courseId, sessionId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  const currentClass = await classRepository.findById(session.ClassID);
  if (!currentClass)
    throw new ServiceError("Class của session không tồn tại", 404);
  if (Number(currentClass.CourseID) !== Number(courseId)) {
    throw new ServiceError("Session không thuộc về course này", 403);
  }

  if (data && data.ClassID !== undefined) {
    const newClass = await classRepository.findById(data.ClassID);
    if (!newClass) throw new ServiceError("ClassID mới không tồn tại", 404);
    if (Number(newClass.CourseID) !== Number(courseId)) {
      throw new ServiceError("ClassID mới không thuộc về course này", 403);
    }

    if (Number(newClass.InstructorID) !== Number(session.InstructorID)) {
      throw new ServiceError(
        "ClassID mới có giảng viên khác với session hiện tại",
        400
      );
    }
  }

  // Không cho đổi InstructorID ở đây (đổi qua quản lý class)
  if (data && data.InstructorID !== undefined) {
    throw new ServiceError(
      "Không được phép thay đổi InstructorID trong cập nhật session",
      400
    );
  }

  await sessionRepository.update(sessionId, {
    Title: data?.Title,
    Description: data?.Description,
    ClassID: data?.ClassID,
    TimeslotID: data?.TimeslotID,
  });

  return await sessionRepository.findById(sessionId);
};

const deleteSessionService = async (courseId, sessionId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  const klass = await classRepository.findById(session.ClassID);
  if (!klass) throw new ServiceError("Class của session không tồn tại", 404);
  if (Number(klass.CourseID) !== Number(courseId)) {
    throw new ServiceError("Session không thuộc về course này", 403);
  }

  await sessionRepository.delete(sessionId);
  return { message: "Đã xóa session thành công" };
};

// ======================= LESSON =======================
const addLessonService = async (courseId, unitId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  if (Number(unit.CourseID) !== Number(courseId)) {
    throw new ServiceError("Unit không thuộc về course này", 403);
  }

  return await lessonRepository.create(unitId, data);
};

const updateLessonService = async (courseId, unitId, lessonId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  if (Number(unit.CourseID) !== Number(courseId)) {
    throw new ServiceError("Unit không thuộc về course này", 403);
  }

  const lesson = await lessonRepository.findById(lessonId);
  if (!lesson) throw new ServiceError("Lesson không tồn tại", 404);
  if (Number(lesson.UnitID) !== Number(unitId)) {
    throw new ServiceError("Lesson không thuộc về unit này", 403);
  }

  await lessonRepository.update(lessonId, unitId, data);
  return await lessonRepository.findById(lessonId);
};

const deleteLessonService = async (courseId, unitId, lessonId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const unit = await unitRepository.findById(unitId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);

  if (Number(unit.CourseID) !== Number(courseId)) {
    throw new ServiceError("Unit không thuộc về course này", 403);
  }

  const lesson = await lessonRepository.findById(lessonId);
  if (!lesson) throw new ServiceError("Lesson không tồn tại", 404);
  if (Number(lesson.UnitID) !== Number(unitId)) {
    throw new ServiceError("Lesson không thuộc về unit này", 403);
  }

  await lessonRepository.delete(lessonId, unitId);
  return { message: "Đã xóa lesson thành công" };
};

// ======================= MATERIAL =======================
const addMaterialService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (!data?.Title || !data?.FileURL)
    throw new ServiceError("Title và FileURL là bắt buộc", 400);

  // không cho đổi CourseID qua body
  const { CourseID, ...safe } = data || {};
  return await materialRepository.create(courseId, safe);
};

const updateMaterialService = async (courseId, materialId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  if (Number(material.CourseID) !== Number(courseId)) {
    throw new ServiceError("Material không thuộc về course này", 403);
  }

  // không cho đổi CourseID qua body
  const { CourseID, ...safe } = data || {};

  await materialRepository.update(materialId, safe);
  return await materialRepository.findById(materialId);
};

const deleteMaterialService = async (courseId, materialId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  if (Number(material.CourseID) !== Number(courseId)) {
    throw new ServiceError("Material không thuộc về course này", 403);
  }

  await materialRepository.delete(materialId);
  return { message: "Đã xóa material thành công" };
};

// ======================= TIMESLOT =======================
const addTimeslotService = async (courseId, sessionId, data) => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  // Đảm bảo session thuộc về đúng course
  await ensureSessionBelongsToCourse(courseId, session);

  if (session.TimeslotID) {
    throw new ServiceError(
      "Session đã có timeslot, hãy cập nhật thay vì tạo mới",
      400
    );
  }

  return await timeslotRepository.create(sessionId, data);
};

const updateTimeslotService = async (courseId, sessionId, timeslotId, data) => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  // Đảm bảo session thuộc về đúng course
  await ensureSessionBelongsToCourse(courseId, session);

  if (Number(session.TimeslotID) !== Number(timeslotId)) {
    throw new ServiceError("Timeslot không thuộc về session này", 403);
  }

  await timeslotRepository.update(timeslotId, data);
  return await timeslotRepository.getBySession(sessionId);
};

const deleteTimeslotService = async (courseId, sessionId, timeslotId) => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  // Đảm bảo session thuộc về đúng course
  await ensureSessionBelongsToCourse(courseId, session);

  if (Number(session.TimeslotID) !== Number(timeslotId)) {
    throw new ServiceError("Timeslot không thuộc về session này", 403);
  }

  await timeslotRepository.delete(timeslotId);
  return { message: "Đã xóa timeslot thành công" };
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
    const lessions = await lessonRepository.listByUnit(u.UnitID);
    u.Lessions = lessions;
  }

  return { ...course, Units: units, Materials: materials };
};

const getInstructorCoursesService = async (instructorId) => {
  const courses = await courseRepository.findByInstructor(instructorId);
  return courses;
};

const getInstructorSessionsService = async (instructorId) => {
  const sessions = await sessionRepository.listByInstructor(instructorId);
  return sessions;
};

module.exports = {
  createCourseService,
  updateCourseService,
  deleteCourseService,
  addUnitService,
  createSessionService,
  addLessonService,
  addMaterialService,
  submitCourseService,
  approveCourseService,
  publishCourseService,
  addTimeslotService,
  getCourseDetailService,
  updateUnitService,
  deleteUnitService,
  updateSessionService,
  deleteSessionService,
  updateLessonService,
  deleteLessonService,
  updateMaterialService,
  deleteMaterialService,
  updateTimeslotService,
  deleteTimeslotService,
  getInstructorCoursesService,
  getInstructorSessionsService,
};
