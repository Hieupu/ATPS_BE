const express = require("express");
const {
  createAssignment,
  getAssignments,
  updateAssignment,
  updateAssignmentStatus,
} = require("../controllers/assignmentController");
const { verifyToken } = require("../middlewares/middware");

const router = express.Router();

router.use(verifyToken);

router.post("/assignments", createAssignment);
router.get("/assignments", getAssignments);
router.put("/assignments/:id", updateAssignment);    
router.patch("/assignments/:id/status", updateAssignmentStatus);  

module.exports = router;
