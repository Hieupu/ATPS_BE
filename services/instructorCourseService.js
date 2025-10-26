const connectDB = require("../config/db");
const courseRepository = require("../repositories/instructorCourseRepository");
const unitRepository = require("../repositories/instructorUnitRepository");
const sessionRepository = require("../repositories/instructorSessionRepository");
const lessionRepository = require("../repositories/instructorLessionRepository");
const materialRepository = require("../repositories/InstructorMaterialRepository");
const timeslotRepository = require("../repositories/InstructorTimeslotRepository");

class ServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ======================= COURSE =======================
const createCourseService = async (data) => {
  const { InstructorID, Title, Description, Duration, TuitionFee } = data;
  if (!InstructorID || !Title)
    throw new ServiceError("InstructorID và Title là bắt buộc", 400);

  return await courseRepository.create({
    InstructorID,
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

  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Chỉ có thể chỉnh sửa khi course ở trạng thái draft hoặc rejected",
      400
    );

  return await courseRepository.update(courseId, data);
};

const deleteCourseService = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  if (!["draft", "rejected"].includes(course.Status))
    throw new ServiceError(
      "Chỉ có thể xóa khi course ở trạng thái draft hoặc rejected",
      400
    );

  await courseRepository.delete(courseId);
  return { message: "Đã xóa khóa học thành công" };
};

// ======================= UNIT =======================
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

// ======================= SESSION =======================
const createSessionService = async (data) => {
  const { Title, Description, InstructorID } = data;
  if (!InstructorID || !Title)
    throw new ServiceError("InstructorID và Title là bắt buộc", 400);

  return await sessionRepository.create({ Title, Description, InstructorID });
};

const updateSessionService = async (sessionId, data) => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  return await sessionRepository.update(sessionId, data);
};

const deleteSessionService = async (sessionId) => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  await sessionRepository.delete(sessionId);
  return { message: "Đã xóa session thành công" };
};

// ======================= LESSION =======================
const addLessionService = async (unitId, sessionId, data) => {
  const unit = await unitRepository.findById(unitId);
  const session = await sessionRepository.findById(sessionId);
  if (!unit) throw new ServiceError("Unit không tồn tại", 404);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  return await lessionRepository.create(unitId, sessionId, data);
};

const updateLessionService = async (lessionId, data) => {
  const lession = await lessionRepository.findById(lessionId);
  if (!lession) throw new ServiceError("Lession không tồn tại", 404);

  return await lessionRepository.update(lessionId, data);
};

const deleteLessionService = async (lessionId) => {
  const lession = await lessionRepository.findById(lessionId);
  if (!lession) throw new ServiceError("Lession không tồn tại", 404);

  await lessionRepository.delete(lessionId);
  return { message: "Đã xóa lession thành công" };
};

// ======================= MATERIAL =======================
const addMaterialService = async (courseId, data) => {
  const course = await courseRepository.findById(courseId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);

  return await materialRepository.create(courseId, data);
};

const updateMaterialService = async (materialId, data) => {
  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  return await materialRepository.update(materialId, data);
};

const deleteMaterialService = async (materialId) => {
  const material = await materialRepository.findById(materialId);
  if (!material) throw new ServiceError("Material không tồn tại", 404);

  await materialRepository.delete(materialId);
  return { message: "Đã xóa material thành công" };
};

// ======================= TIMESLOT =======================
const addTimeslotService = async (courseId, sessionId, data) => {
  const course = await courseRepository.findById(courseId);
  const session = await sessionRepository.findById(sessionId);
  if (!course) throw new ServiceError("Course không tồn tại", 404);
  if (!session) throw new ServiceError("Session không tồn tại", 404);

  return await timeslotRepository.create(courseId, sessionId, data);
};

const updateTimeslotService = async (timeslotId, data) => {
  const timeslot = await timeslotRepository.findById(timeslotId);
  if (!timeslot) throw new ServiceError("Timeslot không tồn tại", 404);

  return await timeslotRepository.update(timeslotId, data);
};

const deleteTimeslotService = async (timeslotId) => {
  const timeslot = await timeslotRepository.findById(timeslotId);
  if (!timeslot) throw new ServiceError("Timeslot không tồn tại", 404);

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
    const lessions = await lessionRepository.listByUnit(u.UnitID);
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
  addLessionService,
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
  updateLessionService,
  deleteLessionService,
  updateMaterialService,
  deleteMaterialService,
  updateTimeslotService,
  deleteTimeslotService,
  getInstructorCoursesService,
  getInstructorSessionsService,
};
