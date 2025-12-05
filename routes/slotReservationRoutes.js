const express = require("express");
const router = express.Router();
const slotReservationController = require('../controllers/slotReservationController');
const { verifyToken } = require("../middlewares/middware");


// Giữ chỗ slot
router.post('/reserve', verifyToken, slotReservationController.reserveSlot);

// Hủy giữ chỗ slot
router.post('/release', verifyToken, slotReservationController.releaseSlot);

// Kiểm tra trạng thái slot
router.get('/check', verifyToken, slotReservationController.checkSlotStatus);

// Lấy danh sách slot đang giữ
router.get('/my-slots', verifyToken, slotReservationController.getUserReservedSlots);

// Hủy tất cả slot
router.post('/release-all', verifyToken, slotReservationController.releaseAllSlots);

module.exports = router;