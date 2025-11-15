const express = require('express');
const router = express.Router();
const zoomController = require('../controllers/zoomController');
const attendanceController = require('../controllers/attendanceController');

router.post('/signature', zoomController.generateSignature);
router.post('/attendance', attendanceController.recordAttendance);
router.get('/attendance/:sessionId', attendanceController.getAttendanceBySession);

module.exports = router;