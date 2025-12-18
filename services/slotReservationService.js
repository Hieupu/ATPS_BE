// services/slotReservationService.js
const { redisClient } = require('../config/redisClient');  

const RESERVATION_EXPIRE_SECONDS = 120; 

class SlotReservationService {
  
  // ⭐️ FIX: Thêm instructorId vào key để phân biệt từng instructor
  getReservationKey(timeslotId, date, instructorId) {
    return `slot:${instructorId}:${timeslotId}:${date}`;
  }

  // Giữ chỗ slot
  async reserveSlot(timeslotId, date, userId, instructorId) {
    try {
      const key = this.getReservationKey(timeslotId, date, instructorId);
      
      // Kiểm tra xem slot đã được giữ chưa
      const existingReservation = await redisClient.get(key);
      
      if (existingReservation) {
        const reservation = JSON.parse(existingReservation);
        
        // Nếu người dùng hiện tại đã giữ slot này, gia hạn thời gian
        if (reservation.userId === userId) {
          await redisClient.setEx(
            key, 
            RESERVATION_EXPIRE_SECONDS, 
            JSON.stringify({
              userId,
              instructorId,
              timeslotId,
              date,
              reservedAt: Date.now()
            })
          );
          return { success: true, renewed: true };
        }
        
        // Slot đang được người khác giữ
        return { 
          success: false, 
          message: 'Slot đang được giữ bởi người khác',
          reservedBy: reservation.userId
        };
      }
      
      // Giữ slot mới với TTL
      await redisClient.setEx(
        key, 
        RESERVATION_EXPIRE_SECONDS, 
        JSON.stringify({
          userId,
          instructorId,
          timeslotId,
          date,
          reservedAt: Date.now()
        })
      );
      
      return { success: true, renewed: false };
    } catch (error) {
      console.error('Error reserving slot:', error);
      throw error;
    }
  }

  // Hủy giữ chỗ slot
  async releaseSlot(timeslotId, date, userId, instructorId) {
    try {
      const key = this.getReservationKey(timeslotId, date, instructorId);
      const existingReservation = await redisClient.get(key);
      
      if (existingReservation) {
        const reservation = JSON.parse(existingReservation);
        
        // Chỉ cho phép người giữ slot hủy
        if (reservation.userId === userId) {
          await redisClient.del(key);
          return { success: true };
        }
        
        return { 
          success: false, 
          message: 'Bạn không có quyền hủy slot này' 
        };
      }
      
      return { success: true, message: 'Slot chưa được giữ' };
    } catch (error) {
      console.error('Error releasing slot:', error);
      throw error;
    }
  }

  // Kiểm tra slot có đang được giữ không
  async isSlotReserved(timeslotId, date, instructorId) {
    try {
      const key = this.getReservationKey(timeslotId, date, instructorId);
      const reservation = await redisClient.get(key);
      
      if (reservation) {
        const data = JSON.parse(reservation);
        return {
          reserved: true,
          userId: data.userId,
          instructorId: data.instructorId,
          reservedAt: data.reservedAt
        };
      }
      
      return { reserved: false };
    } catch (error) {
      console.error('Error checking slot reservation:', error);
      throw error;
    }
  }

  // Lấy tất cả slot đang được giữ bởi userId
  async getUserReservedSlots(userId) {
    try {
      const keys = await redisClient.keys('slot:*');
      const userSlots = [];
      
      for (const key of keys) {
        const reservation = await redisClient.get(key);
        if (reservation) {
          const data = JSON.parse(reservation);
          if (data.userId === userId) {
            userSlots.push({
              instructorId: data.instructorId,
              timeslotId: data.timeslotId,
              date: data.date,
              reservedAt: data.reservedAt
            });
          }
        }
      }
      
      return userSlots;
    } catch (error) {
      console.error('Error getting user reserved slots:', error);
      throw error;
    }
  }

  // Hủy tất cả slot của user
  async releaseAllUserSlots(userId) {
    try {
      const keys = await redisClient.keys('slot:*');
      let releasedCount = 0;
      
      for (const key of keys) {
        const reservation = await redisClient.get(key);
        if (reservation) {
          const data = JSON.parse(reservation);
          if (data.userId === userId) {
            await redisClient.del(key);
            releasedCount++;
          }
        }
      }
      
      return { success: true, releasedCount };
    } catch (error) {
      console.error('Error releasing all user slots:', error);
      throw error;
    }
  }
}

module.exports = new SlotReservationService();