const express = require("express");
const {
  createAssignment,
  getAssignments,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
  getUnits,
  getCourses,
  uploadFile,
} = require("../controllers/assignmentController");
const { verifyToken } = require("../middlewares/middware");

const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

router.use(verifyToken);

router.post("/assignments", createAssignment);
router.get("/assignments", getAssignments);
router.get("/assignments/:id", getAssignmentDetail);
router.put("/assignments/:id", updateAssignment);
router.delete("/assignments/:id", deleteAssignment);
router.get("/units", getUnits);
router.get("/courses", getCourses);
router.post("/uploads", upload.single("file"), uploadFile);

module.exports = router;