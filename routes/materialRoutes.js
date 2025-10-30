const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");

// Get materials for a course
router.get("/course/:courseId", materialController.getCourseMaterials);

// Get all materials for a learner's enrolled courses
router.get("/learner/:learnerId", materialController.getLearnerMaterials);

// Get specific material
router.get("/:materialId", materialController.getMaterialById);

// Create new material (instructor only)
router.post("/", materialController.createMaterial);

// Update material (instructor only)
router.put("/:materialId", materialController.updateMaterial);

// Delete material (instructor only)
router.delete("/:materialId", materialController.deleteMaterial);

module.exports = router;
