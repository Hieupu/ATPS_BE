-- Migration Script: Cập nhật Database từ dbver3/dbver4 lên dbver5
-- Chạy script này để thêm tất cả các cột mới của dbver5
-- 
-- LƯU Ý: Backup database trước khi chạy migration!

USE `atps`;

-- ============================================
-- 1. Bảng timeslot: Thêm cột Day
-- ============================================
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'timeslot' 
    AND COLUMN_NAME = 'Day'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `timeslot` ADD COLUMN `Day` VARCHAR(10) NOT NULL DEFAULT "" AFTER `EndTime`',
  'SELECT "timeslot.Day already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Bảng class: Thêm các cột mới
-- ============================================

-- ZoomID
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'ZoomID'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `ZoomID` VARCHAR(11) NOT NULL DEFAULT "" AFTER `ZoomURL`',
  'SELECT "class.ZoomID already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Zoompass
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'Zoompass'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `Zoompass` VARCHAR(6) NOT NULL DEFAULT "" AFTER `ZoomID`',
  'SELECT "class.Zoompass already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- OpendatePlan
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'OpendatePlan'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `OpendatePlan` DATE NULL AFTER `Fee`',
  'SELECT "class.OpendatePlan already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Opendate
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'Opendate'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `Opendate` DATE NULL AFTER `OpendatePlan`',
  'SELECT "class.Opendate already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- EnddatePlan
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'EnddatePlan'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `EnddatePlan` DATE NULL AFTER `Opendate`',
  'SELECT "class.EnddatePlan already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Enddate
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'Enddate'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `Enddate` DATE NULL AFTER `EnddatePlan`',
  'SELECT "class.Enddate already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Numofsession
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'Numofsession'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `Numofsession` INT NOT NULL DEFAULT 0 AFTER `Enddate`',
  'SELECT "class.Numofsession already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Maxstudent
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'Maxstudent'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `class` ADD COLUMN `Maxstudent` INT NOT NULL DEFAULT 0 AFTER `Numofsession`',
  'SELECT "class.Maxstudent already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. Bảng session: Thêm cột ZoomUUID
-- ============================================
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'session' 
    AND COLUMN_NAME = 'ZoomUUID'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `session` ADD COLUMN `ZoomUUID` VARCHAR(45) NOT NULL DEFAULT "" AFTER `Date`',
  'SELECT "session.ZoomUUID already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 4. Bảng instructor: Thêm cột Type
-- ============================================
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'instructor' 
    AND COLUMN_NAME = 'Type'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `instructor` ADD COLUMN `Type` ENUM(\'fulltime\', \'parttime\') NOT NULL DEFAULT \'fulltime\' AFTER `Major`',
  'SELECT "instructor.Type already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. Data Migration: Copy dữ liệu từ trường cũ sang trường mới (nếu có)
-- ============================================

-- Copy StartDate → OpendatePlan (nếu StartDate tồn tại)
SET @col_startdate_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'StartDate'
);

SET @sql = IF(@col_startdate_exists > 0,
  'UPDATE `class` SET OpendatePlan = StartDate WHERE OpendatePlan IS NULL OR OpendatePlan = "0000-00-00"',
  'SELECT "StartDate column does not exist, skipping data migration" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copy ExpectedSessions → Numofsession (nếu ExpectedSessions tồn tại)
SET @col_expected_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'ExpectedSessions'
);

SET @sql = IF(@col_expected_exists > 0,
  'UPDATE `class` SET Numofsession = ExpectedSessions WHERE Numofsession = 0',
  'SELECT "ExpectedSessions column does not exist, skipping data migration" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copy MaxLearners → Maxstudent (nếu MaxLearners tồn tại)
SET @col_maxlearners_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'atps' 
    AND TABLE_NAME = 'class' 
    AND COLUMN_NAME = 'MaxLearners'
);

SET @sql = IF(@col_maxlearners_exists > 0,
  'UPDATE `class` SET Maxstudent = MaxLearners WHERE Maxstudent = 0',
  'SELECT "MaxLearners column does not exist, skipping data migration" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. Kiểm tra kết quả
-- ============================================
SELECT 'Migration completed successfully!' as result;
SELECT 'Please verify the following columns exist:' as note;
SELECT '  - timeslot.Day' as check1;
SELECT '  - class.ZoomID, class.Zoompass' as check2;
SELECT '  - class.OpendatePlan, class.Opendate, class.EnddatePlan, class.Enddate' as check3;
SELECT '  - class.Numofsession, class.Maxstudent' as check4;
SELECT '  - session.ZoomUUID' as check5;
SELECT '  - instructor.Type' as check6;

