const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/auth");
const materialController = require("../controllers/materialController");

// Admin APIs
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  materialController.createMaterial
);
router.get(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  materialController.getAllMaterials
);
router.get(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  materialController.getMaterialById
);
router.get(
  "/course/:courseId",
  verifyToken,
  authorizeFeature("admin"),
  materialController.getMaterialsByCourse
);
router.put(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  materialController.updateMaterial
);
router.delete(
  "/:id",
  verifyToken,
  authorizeFeature("admin"),
  materialController.deleteMaterial
);
router.get(
  "/:id/download",
  verifyToken,
  authorizeFeature("admin"),
  materialController.downloadMaterial
);

// Instructor APIs
router.post(
  "/instructor",
  verifyToken,
  authorizeFeature("instructor"),
  materialController.createMaterial
);
router.get(
  "/instructor",
  verifyToken,
  authorizeFeature("instructor"),
  materialController.getAllMaterials
);
router.get(
  "/instructor/:id",
  verifyToken,
  authorizeFeature("instructor"),
  materialController.getMaterialById
);
router.get(
  "/instructor/course/:courseId",
  verifyToken,
  authorizeFeature("instructor"),
  materialController.getMaterialsByCourse
);
router.put(
  "/instructor/:id",
  verifyToken,
  authorizeFeature("instructor"),
  materialController.updateMaterial
);
router.delete(
  "/instructor/:id",
  verifyToken,
  authorizeFeature("instructor"),
  materialController.deleteMaterial
);
router.get(
  "/instructor/:id/download",
  verifyToken,
  authorizeFeature("instructor"),
  materialController.downloadMaterial
);

// Learner APIs
router.get(
  "/learner",
  verifyToken,
  authorizeFeature("learner"),
  materialController.getAllMaterials
);
router.get(
  "/learner/:id",
  verifyToken,
  authorizeFeature("learner"),
  materialController.getMaterialById
);
router.get(
  "/learner/course/:courseId",
  verifyToken,
  authorizeFeature("learner"),
  materialController.getMaterialsByCourse
);
router.get(
  "/learner/:id/download",
  verifyToken,
  authorizeFeature("learner"),
  materialController.downloadMaterial
);

// Public APIs
router.get("/public", materialController.getPublicMaterials);
router.get("/public/:id", materialController.getMaterialById);

module.exports = router;
