// controllers/instructorCourseController.js
const {
  createCourseService,
  addUnitService,
  createSessionService,
  addLessionService,
  addMaterialService,
  submitCourseService,
  approveCourseService,
  publishCourseService,
  addTimeslotService,
  getCourseDetailService,
} = require("../services/instructorCourseService");

// ======================= COURSE =======================
const createCourse = async (req, res) => {
  try {
    const course = await createCourseService(req.body);
    res.json({ message: "Course created", course });
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
    res.json({ message: "Unit added to course", unit });
  } catch (error) {
    console.error("addUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const unit = await updateUnitService(Number(unitId), req.body);
    res.json({ message: "Unit updated", unit });
  } catch (error) {
    console.error("updateUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const result = await deleteUnitService(Number(unitId));
    res.json(result);
  } catch (error) {
    console.error("deleteUnit error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= SESSION =======================
const createSession = async (req, res) => {
  try {
    const session = await createSessionService(req.body);
    res.json({ message: "Session created", session });
  } catch (error) {
    console.error("createSession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await updateSessionService(Number(sessionId), req.body);
    res.json({ message: "Session updated", session });
  } catch (error) {
    console.error("updateSession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await deleteSessionService(Number(sessionId));
    res.json(result);
  } catch (error) {
    console.error("deleteSession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= LESSION =======================
const addLession = async (req, res) => {
  try {
    const { unitId, sessionId } = req.params;
    const lession = await addLessionService(
      Number(unitId),
      Number(sessionId),
      req.body
    );
    res.json({ message: "Lession added", lession });
  } catch (error) {
    console.error("addLession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateLession = async (req, res) => {
  try {
    const { lessionId } = req.params;
    const lession = await updateLessionService(Number(lessionId), req.body);
    res.json({ message: "Lession updated", lession });
  } catch (error) {
    console.error("updateLession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteLession = async (req, res) => {
  try {
    const { lessionId } = req.params;
    const result = await deleteLessionService(Number(lessionId));
    res.json(result);
  } catch (error) {
    console.error("deleteLession error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= MATERIAL =======================
const addMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const material = await addMaterialService(Number(courseId), req.body);
    res.json({ message: "Material added", material });
  } catch (error) {
    console.error("addMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await updateMaterialService(Number(materialId), req.body);
    res.json({ message: "Material updated", material });
  } catch (error) {
    console.error("updateMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const result = await deleteMaterialService(Number(materialId));
    res.json(result);
  } catch (error) {
    console.error("deleteMaterial error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

// ======================= TIMESLOT =======================
const addTimeslot = async (req, res) => {
  try {
    const { courseId, sessionId } = req.params;
    const timeslot = await addTimeslotService(
      Number(courseId),
      Number(sessionId),
      req.body
    );
    res.json({ message: "Timeslot added", timeslot });
  } catch (error) {
    console.error("addTimeslot error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const updateTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;
    const timeslot = await updateTimeslotService(Number(timeslotId), req.body);
    res.json({ message: "Timeslot updated", timeslot });
  } catch (error) {
    console.error("updateTimeslot error:", error);
    res.status(error.status || 400).json({ message: error.message });
  }
};

const deleteTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;
    const result = await deleteTimeslotService(Number(timeslotId));
    res.json(result);
  } catch (error) {
    console.error("deleteTimeslot error:", error);
    res.status(error.status || 400).json({ message: error.message });
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
  addLession,
  updateLession,
  deleteLession,
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
};
