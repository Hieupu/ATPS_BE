const express = require('express');
const router = express.Router();
const publicnewController = require('../controllers/publicnewController');

// Get all active news
router.get('/', publicnewController.getPublicNews);

// Get news detail by ID - Sửa tên hàm thành getNewsById
router.get('/:newsId', publicnewController.getNewsById);

module.exports = router;