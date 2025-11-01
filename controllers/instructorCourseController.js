// controllers/instructorCourseController.js
const {
  // COURSE
  createCourseService,
  updateCourseService,
  deleteCourseService,
  listInstructorCoursesService,
  submitCourseService,
  approveCourseService,
  publishCourseService,

  // UNIT
  listUnitsByCourseService,
  addUnitService,
  updateUnitService,
  deleteUnitService,

  // LESSON
  listLessonsByUnitService,
  addLessonService,
  updateLessonService,
  deleteLessonService,

  // MATERIAL
  listMaterialsByCourseService,
  addMaterialService,
  updateMaterialService,
  deleteMaterialService,

  // DETAIL
  getCourseDetailService,
} = require("../services/instructorCourseService");

/* ======================= COURSE ======================= */
const listInstructorCourses = async (req, res) => {
  try {
    const instructorId = Number(req.user.id);
    const courses = await listInstructorCoursesService(instructorId);
    res.json(courses);
  } catch (err) {
    console.error("listInstructorCourses error:", err);
    res.status(err.status || 500).json({
      message: err.message || "Lỗi khi lấy danh sách khóa học",
    });
  }
};

const createCourse = async (req, res) => {
  try {
    // body phải dùng Fee thay vì TuitionFee theo DB
    const course = await createCourseService(req.body);
    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error("createCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const course = await updateCourseService(courseId, req.body);
    res.json({ message: "Course updated", course });
  } catch (error) {
    console.error("updateCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await deleteCourseService(courseId);
    res.json(result);
  } catch (error) {
    console.error("deleteCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

/* ======================= UNIT ======================= */
const listUnitsByCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await listUnitsByCourseService(courseId);
    res.json(result);
  } catch (error) {
    console.error("listUnitsByCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const addUnit = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const unit = await addUnitService(courseId, req.body);
    res.status(201).json({ message: "Unit added to course", unit });
  } catch (error) {
    console.error("addUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const unit = await updateUnitService(unitId, req.body);
    res.json({ message: "Unit updated", unit });
  } catch (error) {
    console.error("updateUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const result = await deleteUnitService(unitId);
    res.json(result);
  } catch (error) {
    console.error("deleteUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

/* ======================= LESSON ======================= */
const listLessonsByUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const result = await listLessonsByUnitService(unitId);
    res.json(result);
  } catch (error) {
    console.error("listLessonsByUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};
const addLesson = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const lesson = await addLessonService(unitId, req.body, req.file);
    res.status(201).json({ message: "Lesson added", lesson });
  } catch (error) {
    console.error("addLesson error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateLesson = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const lessonId = Number(req.params.lessonId);
    const result = await updateLessonService(
      lessonId,
      unitId,
      req.body,
      req.file
    );
    res.json({ message: "Lesson updated", ...result });
  } catch (error) {
    console.error("updateLesson error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const lessonId = Number(req.params.lessonId);
    const result = await deleteLessonService(lessonId, unitId);
    res.json(result);
  } catch (error) {
    console.error("deleteLesson error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

/* ======================= MATERIAL ======================= */
const listMaterialsByCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await listMaterialsByCourseService(courseId);
    res.json(result);
  } catch (error) {
    console.error("listMaterialsByCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};
const addMaterial = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const material = await addMaterialService(courseId, req.body);
    res.status(201).json({ message: "Material added", material });
  } catch (error) {
    console.error("addMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const materialId = Number(req.params.materialId);
    const result = await updateMaterialService(materialId, req.body);
    res.json(result);
  } catch (error) {
    console.error("updateMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const materialId = Number(req.params.materialId);
    const result = await deleteMaterialService(materialId);
    res.json(result);
  } catch (error) {
    console.error("deleteMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

/* ======================= WORKFLOW & DETAIL ======================= */
const submitCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await submitCourseService(courseId);
    res.json(result);
  } catch (error) {
    console.error("submitCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const approveCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await approveCourseService(courseId);
    res.json(result);
  } catch (error) {
    console.error("approveCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const publishCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await publishCourseService(courseId);
    res.json(result);
  } catch (error) {
    console.error("publishCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const getCourseDetail = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const detail = await getCourseDetailService(courseId);
    res.json({ message: "Course detail", course: detail });
  } catch (error) {
    console.error("getCourseDetail error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

module.exports = {
  listInstructorCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourse,
  approveCourse,
  publishCourse,

  listUnitsByCourse,
  addUnit,
  updateUnit,
  deleteUnit,

  listLessonsByUnit,
  addLesson,
  updateLesson,
  deleteLesson,

  listMaterialsByCourse,
  addMaterial,
  updateMaterial,
  deleteMaterial,

  getCourseDetail,
};
