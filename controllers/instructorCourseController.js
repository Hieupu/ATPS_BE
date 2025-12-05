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
  getAssignmentsByUnitIdService,

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

const courseRepository = require("../repositories/instructorCourseRepository");

/* ======================= COURSE ======================= */
const listInstructorCourses = async (req, res) => {
  try {
    const accId = Number(req.user.id);
    const instructorId = await courseRepository.findInstructorIdByAccountId(
      accId
    );

    if (!instructorId) {
      return res.status(400).json({ message: "Instructor không tồn tại" });
    }

    const result = await listInstructorCoursesService(instructorId);
    res.status(200).json(result);
  } catch (error) {
    console.error("listInstructorCourses error:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Lỗi khi lấy danh sách khóa học" });
  }
};

const createCourse = async (req, res) => {
  const accId = Number(req.user.id);

  const instructorId = await courseRepository.findInstructorIdByAccountId(
    accId
  );

  if (!instructorId) {
    return res.status(400).json({ message: "Instructor không tồn tại" });
  }
  try {
    const payload = {
      ...req.body,
      InstructorID: instructorId,
    };

    // truyền thêm req.file xuống service
    const course = await createCourseService(payload, req.file);

    res.status(201).json({ message: "Course created", data: course });
  } catch (error) {
    console.error("createCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const payload = {
      ...req.body,
    };

    const result = await updateCourseService(courseId, payload, req.file);

    res.status(200).json(result);
  } catch (error) {
    console.error("updateCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await deleteCourseService(courseId);
    res.status(200).json(result);
  } catch (error) {
    console.error("deleteCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

/* ======================= WORKFLOW ======================= */
const submitCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await submitCourseService(courseId);
    res.status(200).json(result);
  } catch (error) {
    console.error("submitCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const approveCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await approveCourseService(courseId);
    res.status(200).json(result);
  } catch (error) {
    console.error("approveCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const publishCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await publishCourseService(courseId);
    res.status(200).json(result);
  } catch (error) {
    console.error("publishCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

/* ======================= UNIT ======================= */
const listUnitsByCourse = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = await listUnitsByCourseService(courseId);
    res.status(200).json(result);
  } catch (error) {
    console.error("listUnitsByCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const addUnit = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const unit = await addUnitService(courseId, req.body);
    res.status(201).json({ message: "Unit added", data: unit });
  } catch (error) {
    console.error("addUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const result = await updateUnitService(unitId, req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("updateUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const result = await deleteUnitService(unitId);
    res.status(200).json(result);
  } catch (error) {
    console.error("deleteUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};
const getAssignmentsByUnitId = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const result = await getAssignmentsByUnitIdService(unitId);
    res.status(200).json(result);
  } catch (error) {
    console.error("getAssignmentsByUnitId error:", error);
    res.status(error.status || 404).json({ message: error.message });
  }
};

/* ======================= LESSON ======================= */
const listLessonsByUnit = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const result = await listLessonsByUnitService(unitId);
    res.status(200).json(result);
  } catch (error) {
    console.error("listLessonsByUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const addLesson = async (req, res) => {
  try {
    const unitId = Number(req.params.unitId);
    const lesson = await addLessonService(unitId, req.body, req.file);
    res.status(201).json({ message: "Lesson added", data: lesson });
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
    res.status(200).json(result);
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
    res.status(200).json(result);
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
    res.status(200).json(result);
  } catch (error) {
    console.error("listMaterialsByCourse error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const addMaterial = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const material = await addMaterialService(courseId, req.body, req.file);
    res.status(201).json({ message: "Material added", data: material });
  } catch (error) {
    console.error("addMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const materialId = Number(req.params.materialId);
    const result = await updateMaterialService(materialId, req.body, req.file);
    res.status(200).json(result);
  } catch (error) {
    console.error("updateMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const materialId = Number(req.params.materialId);
    const result = await deleteMaterialService(materialId);
    res.status(200).json(result);
  } catch (error) {
    console.error("deleteMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

/* ======================= DETAIL ======================= */
const getCourseDetail = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const detail = await getCourseDetailService(courseId);
    res.status(200).json({ message: "Course detail", data: detail });
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
  getAssignmentsByUnitId,

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
