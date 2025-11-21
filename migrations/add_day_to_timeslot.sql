-- Migration: Thêm cột Day vào bảng timeslot (dbver5)
-- Chạy script này để cập nhật database từ dbver3/dbver4 lên dbver5

USE `atps`;

-- Kiểm tra xem cột Day đã tồn tại chưa
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'timeslot' 
    AND COLUMN_NAME = 'Day'
);

-- Chỉ thêm cột nếu chưa tồn tại
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `timeslot` ADD COLUMN `Day` VARCHAR(10) NOT NULL DEFAULT "" AFTER `EndTime`',
  'SELECT "Column Day already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cập nhật dữ liệu mẫu (nếu cần)
-- Ví dụ: Nếu bạn có dữ liệu cũ, có thể cập nhật Day dựa trên logic nào đó
-- UPDATE timeslot SET Day = 'T2' WHERE ...;

SELECT 'Migration completed: Column Day added to timeslot table' as result;

