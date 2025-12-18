// controllers/slotReservationController.js
const slotReservationService = require('../services/slotReservationService');

class SlotReservationController {
  
  // Giữ chỗ slot
  async reserveSlot(req, res) {
    try {
      const { timeslotId, date, instructorId } = req.body; // ⭐️ Thêm instructorId
      const userId = req.user.id;
      
      if (!timeslotId || !date || !instructorId) {
        return res.status(400).json({
          success: false,
          message: 'TimeslotId, date và instructorId là bắt buộc'
        });
      }
      
      const result = await slotReservationService.reserveSlot(
        timeslotId, 
        date, 
        userId, 
        instructorId // ⭐️ Truyền instructorId
      );
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.renewed ? 'Gia hạn giữ chỗ thành công' : 'Giữ chỗ thành công',
          data: result
        });
      } else {
        return res.status(409).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in reserveSlot:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi giữ chỗ slot'
      });
    }
  }

  // Hủy giữ chỗ slot
  async releaseSlot(req, res) {
    try {
      const { timeslotId, date, instructorId } = req.body; // ⭐️ Thêm instructorId
      const userId = req.user.id;
      
      if (!timeslotId || !date || !instructorId) {
        return res.status(400).json({
          success: false,
          message: 'TimeslotId, date và instructorId là bắt buộc'
        });
      }
      
      const result = await slotReservationService.releaseSlot(
        timeslotId, 
        date, 
        userId, 
        instructorId // ⭐️ Truyền instructorId
      );
      
      return res.status(200).json({
        success: true,
        message: 'Hủy giữ chỗ thành công',
        data: result
      });
    } catch (error) {
      console.error('Error in releaseSlot:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy giữ chỗ slot'
      });
    }
  }

  // Kiểm tra trạng thái slot
  async checkSlotStatus(req, res) {
    try {
      const { timeslotId, date, instructorId } = req.query; // ⭐️ Thêm instructorId
      
      if (!timeslotId || !date || !instructorId) {
        return res.status(400).json({
          success: false,
          message: 'TimeslotId, date và instructorId là bắt buộc'
        });
      }
      
      const result = await slotReservationService.isSlotReserved(
        timeslotId, 
        date, 
        instructorId // ⭐️ Truyền instructorId
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in checkSlotStatus:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái slot'
      });
    }
  }

  // Lấy danh sách slot đang giữ của user
  async getUserReservedSlots(req, res) {
    try {
      const userId = req.user.id;
      
      const slots = await slotReservationService.getUserReservedSlots(userId);
      
      return res.status(200).json({
        success: true,
        data: slots
      });
    } catch (error) {
      console.error('Error in getUserReservedSlots:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách slot'
      });
    }
  }

  // Hủy tất cả slot của user
  async releaseAllSlots(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await slotReservationService.releaseAllUserSlots(userId);
      
      return res.status(200).json({
        success: true,
        message: `Đã hủy ${result.releasedCount} slot`,
        data: result
      });
    } catch (error) {
      console.error('Error in releaseAllSlots:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy tất cả slot'
      });
    }
  }
}

module.exports = new SlotReservationController();