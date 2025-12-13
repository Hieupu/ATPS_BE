const express = require("express");
const router = express.Router();
const { verifyToken, authorizeFeature } = require("../middlewares/middware");
const lessonController = require("../controllers/lessonController");

// Lesson APIs
router.post(
  "/",
  verifyToken,
  authorizeFeature("admin"),
  lessonController.createLesson
);

router.get("/", verifyToken, lessonController.getAllLessons);

router.get("/:lessonId", verifyToken, lessonController.getLessonById);

router.get("/unit/:unitId", verifyToken, lessonController.getLessonsByUnit);

router.put(
  "/:lessonId",
  verifyToken,
  authorizeFeature("admin"),
  lessonController.updateLesson
);

router.delete(
  "/:lessonId",
  verifyToken,
  authorizeFeature("admin"),
  lessonController.deleteLesson
);

module.exports = router;
