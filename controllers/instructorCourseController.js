const {
  createCourseService,
  addUnitService,
  createSessionService,
  addLessonService,
  addMaterialService,
  submitCourseService,
  approveCourseService,
  publishCourseService,
  addTimeslotService,
  getCourseDetailService,
  updateCourseService,
  deleteCourseService,
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
  listInstructorCoursesService,
} = require("../services/instructorCourseService");

// ======================= COURSE =======================
const listInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const courses = await listInstructorCoursesService(instructorId);
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || "Lỗi khi lấy danh sách khóa học",
    });
  }
};

const createCourse = async (req, res) => {
  try {
    const course = await createCourseService(req.body);
    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error("createCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await updateCourseService(Number(courseId), req.body);
    res.json({ message: "Course updated", course });
  } catch (error) {
    console.error("updateCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await deleteCourseService(Number(courseId));
    res.json(result);
  } catch (error) {
    console.error("deleteCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= UNIT =======================
const addUnit = async (req, res) => {
  try {
    const { courseId } = req.params;
    const unit = await addUnitService(Number(courseId), req.body);
    res.status(201).json({ message: "Unit added to course", unit });
  } catch (error) {
    console.error("addUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { courseId, unitId } = req.params;
    const unit = await updateUnitService(
      Number(courseId),
      Number(unitId),
      req.body
    );
    res.json({ message: "Unit updated", unit });
  } catch (error) {
    console.error("updateUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const { courseId, unitId } = req.params;
    const result = await deleteUnitService(Number(courseId), Number(unitId));
    res.json(result);
  } catch (error) {
    console.error("deleteUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= SESSION =======================
const createSession = async (req, res) => {
  try {
    const { courseId } = req.params;
    const session = await createSessionService(Number(courseId), req.body);
    res.status(201).json({ message: "Session created", session });
  } catch (error) {
    console.error("createSession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const { courseId, sessionId } = req.params;
    const session = await updateSessionService(
      Number(courseId),
      Number(sessionId),
      req.body
    );
    res.json({ message: "Session updated", session });
  } catch (error) {
    console.error("updateSession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { courseId, sessionId } = req.params;
    const result = await deleteSessionService(
      Number(courseId),
      Number(sessionId)
    );
    res.json(result);
  } catch (error) {
    console.error("deleteSession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= LESSION =======================
const addLesson = async (req, res) => {
  try {
    const { courseId, unitId } = req.params;
    const lesson = await addLessonService(
      Number(courseId),
      Number(unitId),
      req.body
    );
    res.status(201).json({ message: "Lesson added", lesson });
  } catch (error) {
    console.error("addLesson error:", error);
    res
      .status(error.status || 400)
      .json({ message: error.message || "Add lesson failed" });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { courseId, unitId, lessonId } = req.params;
    const lesson = await updateLessonService(
      Number(courseId),
      Number(unitId),
      Number(lessonId),
      req.body
    );
    res.json({ message: "Lesson updated", lesson });
  } catch (error) {
    console.error("updateLesson error:", error);
    res
      .status(error.status || 400)
      .json({ message: error.message || "Update lesson failed" });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { courseId, unitId, lessonId } = req.params;
    const result = await deleteLessonService(
      Number(courseId),
      Number(unitId),
      Number(lessonId)
    );
    res.json(result); // { message: "Đã xóa lesson thành công" }
  } catch (error) {
    console.error("deleteLesson error:", error);
    res
      .status(error.status || 400)
      .json({ message: error.message || "Delete lesson failed" });
  }
};

// ======================= MATERIAL =======================
const addMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const material = await addMaterialService(Number(courseId), req.body);
    res.status(201).json({ message: "Material added", material });
  } catch (error) {
    console.error("addMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { courseId, materialId } = req.params;
    const material = await updateMaterialService(
      Number(courseId),
      Number(materialId),
      req.body
    );
    res.json({ message: "Material updated", material });
  } catch (error) {
    console.error("updateMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { courseId, materialId } = req.params;
    const result = await deleteMaterialService(
      Number(courseId),
      Number(materialId)
    );
    res.json(result);
  } catch (error) {
    console.error("deleteMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= TIMESLOT =======================
const addTimeslot = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const sessionId = Number(req.params.sessionId);
    console.log("Params:", req.params);

    const timeslot = await addTimeslotService(courseId, sessionId, req.body);
    res.status(201).json({ message: "Timeslot added", timeslot });
  } catch (error) {
    console.error("addTimeslot error:", error);
    res
      .status(error.status || 400)
      .json({ message: error.message || "Add timeslot failed" });
  }
};

const updateTimeslot = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const sessionId = Number(req.params.sessionId);
    const timeslotId = Number(req.params.timeslotId);

    const timeslot = await updateTimeslotService(
      courseId,
      sessionId,
      timeslotId,
      req.body
    );
    res.json({ message: "Timeslot updated", timeslot });
  } catch (error) {
    console.error("updateTimeslot error:", error);
    res
      .status(error.status || 400)
      .json({ message: error.message || "Update timeslot failed" });
  }
};

const deleteTimeslot = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const sessionId = Number(req.params.sessionId);
    const timeslotId = Number(req.params.timeslotId);

    const result = await deleteTimeslotService(courseId, sessionId, timeslotId);
    res.json(result);
  } catch (error) {
    console.error("deleteTimeslot error:", error);
    res
      .status(error.status || 400)
      .json({ message: error.message || "Delete timeslot failed" });
  }
};

// ======================= WORKFLOW & DETAIL =======================
const submitCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await submitCourseService(Number(courseId));
    res.json(result);
  } catch (error) {
    console.error("submitCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const approveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await approveCourseService(Number(courseId));
    res.json(result);
  } catch (error) {
    console.error("approveCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await publishCourseService(Number(courseId));
    res.json(result);
  } catch (error) {
    console.error("publishCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const detail = await getCourseDetailService(Number(courseId));
    res.json({ message: "Course detail", course: detail });
  } catch (error) {
    console.error("getCourseDetail error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  addUnit,
  updateUnit,
  deleteUnit,
  createSession,
  updateSession,
  deleteSession,
  addLesson,
  updateLesson,
  deleteLesson,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  addTimeslot,
  updateTimeslot,
  deleteTimeslot,
  submitCourse,
  approveCourse,
  publishCourse,
  getCourseDetail,
  listInstructorCourses,
};
