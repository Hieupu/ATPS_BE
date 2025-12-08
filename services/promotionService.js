const promotionRepository = require("../repositories/promotionRepository");

class PromotionService {
  // Tạo promotion mới
  async createPromotion(promotionData) {
    try {
      // Validate required fields
      if (
        !promotionData.Code ||
        !promotionData.Discount ||
        !promotionData.StartDate
      ) {
        throw new Error("Code, Discount và StartDate là bắt buộc");
      }

      // Validate discount (0-100)
      if (promotionData.Discount < 0 || promotionData.Discount > 100) {
        throw new Error("Discount phải nằm trong khoảng 0-100");
      }

      // Kiểm tra code đã tồn tại chưa
      const existingPromotion = await promotionRepository.findByCode(
        promotionData.Code
      );
      if (existingPromotion) {
        throw new Error("Mã promotion đã tồn tại");
      }

      // Validate dates
      if (
        promotionData.EndDate &&
        promotionData.EndDate < promotionData.StartDate
      ) {
        throw new Error("EndDate phải sau StartDate");
      }

      const promotion = {
        Code: promotionData.Code.toUpperCase(),
        Discount: promotionData.Discount,
        StartDate: promotionData.StartDate,
        EndDate: promotionData.EndDate || null,
        CreateBy: promotionData.CreateBy,
        Status: promotionData.Status || "active",
      };

      return await promotionRepository.create(promotion);
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả promotions
  async getAllPromotions(options = {}) {
    try {
      await promotionRepository.expireOutdatedPromotions();
      const promotions = await promotionRepository.findAll(options);
      const total = await promotionRepository.count(options);

      return {
        data: promotions,
        total,
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: Math.ceil(total / (options.limit || 10)),
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy promotion theo ID
  async getPromotionById(promotionId) {
    try {
      await promotionRepository.expireOutdatedPromotions();
      const promotion = await promotionRepository.findById(promotionId);
      if (!promotion) {
        throw new Error("Không tìm thấy promotion");
      }
      return promotion;
    } catch (error) {
      throw error;
    }
  }

  // Lấy promotion theo Code
  async getPromotionByCode(code) {
    try {
      await promotionRepository.expireOutdatedPromotions();
      const promotion = await promotionRepository.findByCode(code);
      if (!promotion) {
        throw new Error("Không tìm thấy promotion");
      }
      return promotion;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật promotion
  async updatePromotion(promotionId, updateData) {
    try {
      // Kiểm tra promotion tồn tại
      const existingPromotion = await promotionRepository.findById(promotionId);
      if (!existingPromotion) {
        throw new Error("Không tìm thấy promotion");
      }

      // Validate discount nếu có
      if (updateData.Discount !== undefined) {
        if (updateData.Discount < 0 || updateData.Discount > 100) {
          throw new Error("Discount phải nằm trong khoảng 0-100");
        }
      }

      // Validate dates nếu có
      if (updateData.EndDate && updateData.StartDate) {
        if (updateData.EndDate < updateData.StartDate) {
          throw new Error("EndDate phải sau StartDate");
        }
      }

      // Nếu cập nhật code, kiểm tra code mới có trùng không
      if (updateData.Code && updateData.Code !== existingPromotion.Code) {
        const existingCode = await promotionRepository.findByCode(
          updateData.Code
        );
        if (existingCode) {
          throw new Error("Mã promotion đã tồn tại");
        }
        updateData.Code = updateData.Code.toUpperCase();
      }

      // Loại bỏ CreateBy khỏi updateData (không được phép update CreateBy)
      // CreateBy chỉ được set khi tạo mới, không thay đổi khi update
      const { CreateBy, ...dataToUpdate } = updateData;

      return await promotionRepository.update(promotionId, dataToUpdate);
    } catch (error) {
      throw error;
    }
  }

  // Xóa promotion
  async deletePromotion(promotionId) {
    try {
      const deleted = await promotionRepository.delete(promotionId);
      if (!deleted) {
        throw new Error("Không tìm thấy promotion");
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy promotions theo trạng thái
  async getPromotionsByStatus(status) {
    try {
      return await promotionRepository.findByStatus(status);
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra promotion có hợp lệ không
  async validatePromotion(code) {
    try {
      const promotion = await promotionRepository.findValidPromotion(code);
      return promotion;
    } catch (error) {
      throw error;
    }
  }

  // Kích hoạt promotion
  async activatePromotion(promotionId) {
    try {
      return await promotionRepository.update(promotionId, {
        Status: "active",
      });
    } catch (error) {
      throw error;
    }
  }

  // Vô hiệu hóa promotion
  async deactivatePromotion(promotionId) {
    try {
      return await promotionRepository.update(promotionId, {
        Status: "inactive",
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PromotionService();
