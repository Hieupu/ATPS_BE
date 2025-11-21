-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

---

-- Schema mydb

---

---

-- Schema atps

---

---

-- Schema atps

---

CREATE SCHEMA IF NOT EXISTS `atps` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `atps` ;

---

-- Table `atps`.`account`

---

CREATE TABLE IF NOT EXISTS `atps`.`account` (
`AccID` INT NOT NULL AUTO_INCREMENT,
`Email` VARCHAR(100) NOT NULL,
`Phone` VARCHAR(20) NULL DEFAULT NULL,
`Password` VARCHAR(255) NOT NULL,
`Status` VARCHAR(50) NOT NULL,
`Provider` VARCHAR(45) NOT NULL,
`username` VARCHAR(45) NOT NULL,
`Gender` ENUM('male', 'female', 'other') NOT NULL,
PRIMARY KEY (`AccID`),
UNIQUE INDEX `Email` (`Email` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`feature`

---

CREATE TABLE IF NOT EXISTS `atps`.`feature` (
`FeatureID` INT NOT NULL AUTO_INCREMENT,
`Name` VARCHAR(100) NOT NULL,
`Description` TEXT NOT NULL,
`URL` VARCHAR(45) NOT NULL,
PRIMARY KEY (`FeatureID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`accountfeature`

---

CREATE TABLE IF NOT EXISTS `atps`.`accountfeature` (
`AccountID` INT NOT NULL,
`FeatureID` INT NOT NULL,
PRIMARY KEY (`AccountID`, `FeatureID`),
INDEX `FeatureID` (`FeatureID` ASC) VISIBLE,
CONSTRAINT `accountfeature_ibfk_1`
FOREIGN KEY (`AccountID`)
REFERENCES `atps`.`account` (`AccID`)
ON DELETE CASCADE
ON UPDATE CASCADE,
CONSTRAINT `accountfeature_ibfk_2`
FOREIGN KEY (`FeatureID`)
REFERENCES `atps`.`feature` (`FeatureID`)
ON DELETE CASCADE
ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`admin`

---

CREATE TABLE IF NOT EXISTS `atps`.`admin` (
`AdminID` INT NOT NULL AUTO_INCREMENT,
`FullName` VARCHAR(100) NOT NULL,
`DateOfBirth` DATE NULL DEFAULT NULL,
`ProfilePicture` VARCHAR(255) NULL DEFAULT NULL,
`Address` VARCHAR(255) NULL DEFAULT NULL,
`AccID` INT NOT NULL,
PRIMARY KEY (`AdminID`),
INDEX `fk_admin_account1_idx` (`AccID` ASC) VISIBLE,
CONSTRAINT `fk_admin_account1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`instructor`

---

CREATE TABLE IF NOT EXISTS `atps`.`instructor` (
`InstructorID` INT NOT NULL AUTO_INCREMENT,
`FullName` VARCHAR(100) NOT NULL,
`DateOfBirth` DATE NULL DEFAULT NULL,
`ProfilePicture` VARCHAR(255) NULL DEFAULT NULL,
`Job` VARCHAR(100) NULL DEFAULT NULL,
`Address` VARCHAR(255) NULL DEFAULT NULL,
`CV` VARCHAR(255) NULL DEFAULT NULL,
`AccID` INT NOT NULL,
`Major` VARCHAR(45) NULL DEFAULT NULL,
`Type` ENUM('fulltime', 'partime', 'fulltime_tutor', 'partime_tutor') NOT NULL,
`InstructorFee` DECIMAL(10,2) NULL,
PRIMARY KEY (`InstructorID`),
INDEX `fk_instructor_account1_idx` (`AccID` ASC) VISIBLE,
CONSTRAINT `fk_instructor_account1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
AUTO_INCREMENT = 6
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`course`

---

CREATE TABLE IF NOT EXISTS `atps`.`course` (
`CourseID` INT NOT NULL AUTO_INCREMENT,
`InstructorID` INT NOT NULL,
`Title` VARCHAR(255) NOT NULL,
`Description` TEXT NOT NULL,
`Image` VARCHAR(100) NOT NULL,
`Duration` DECIMAL(10,2) NOT NULL,
`Objectives` TEXT NOT NULL,
`Requirements` TEXT NOT NULL,
`Level` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL,
`Status` ENUM('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'DELETED') NOT NULL,
`Code` VARCHAR(10) NOT NULL,
PRIMARY KEY (`CourseID`),
INDEX `fk_course_instructor1_idx` (`InstructorID` ASC) VISIBLE,
CONSTRAINT `fk_course_instructor1`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`))
ENGINE = InnoDB
AUTO_INCREMENT = 11
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`unit`

---

CREATE TABLE IF NOT EXISTS `atps`.`unit` (
`UnitID` INT NOT NULL AUTO_INCREMENT,
`Title` VARCHAR(255) NOT NULL,
`Description` TEXT NOT NULL,
`Duration` DECIMAL(10,2) NOT NULL,
`CourseID` INT NOT NULL,
`Status` ENUM('VISIBLE', 'HIDDEN', 'DELETED') NOT NULL,
`OrderIndex` INT NOT NULL,
PRIMARY KEY (`UnitID`),
INDEX `fk_coursecontent_course1_idx` (`CourseID` ASC) VISIBLE,
CONSTRAINT `fk_coursecontent_course1`
FOREIGN KEY (`CourseID`)
REFERENCES `atps`.`course` (`CourseID`))
ENGINE = InnoDB
AUTO_INCREMENT = 22
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`assignment`

---

CREATE TABLE IF NOT EXISTS `atps`.`assignment` (
`AssignmentID` INT NOT NULL AUTO_INCREMENT,
`InstructorID` INT NOT NULL,
`UnitID` INT NULL DEFAULT NULL,
`Title` VARCHAR(255) NOT NULL,
`Description` TEXT NOT NULL,
`Deadline` DATETIME NULL DEFAULT NULL,
`FileURL` VARCHAR(200) NULL DEFAULT NULL,
`Status` ENUM('draft', 'published', 'scheduled', 'archived', 'deleted') NOT NULL DEFAULT 'draft',
`Type` ENUM('quiz', 'audio', 'video', 'document') NOT NULL DEFAULT 'document',
`ShowAnswersAfter` ENUM('after_submission', 'after_deadline', 'never') NOT NULL DEFAULT 'after_submission',
`MaxDuration` INT NULL DEFAULT NULL,
`MediaURL` VARCHAR(255) NULL DEFAULT NULL,
PRIMARY KEY (`AssignmentID`),
INDEX `fk_assignment_unit1_idx` (`UnitID` ASC) VISIBLE,
INDEX `fk_assignment_instructor` (`InstructorID` ASC) VISIBLE,
INDEX `ix_assignment_type_unit` (`Type` ASC, `UnitID` ASC) VISIBLE,
CONSTRAINT `fk_assignment_instructor`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`),
CONSTRAINT `fk_assignment_unit`
FOREIGN KEY (`UnitID`)
REFERENCES `atps`.`unit` (`UnitID`))
ENGINE = InnoDB
AUTO_INCREMENT = 32
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`question`

---

CREATE TABLE IF NOT EXISTS `atps`.`question` (
`QuestionID` INT NOT NULL AUTO_INCREMENT,
`Content` TEXT NOT NULL,
`Type` ENUM('multiple_choice', 'true_false', 'fill_in_blank', 'matching', 'essay', 'speaking') NOT NULL DEFAULT 'multiple_choice',
`CorrectAnswer` TEXT NULL DEFAULT NULL,
`InstructorID` INT NOT NULL,
`Status` VARCHAR(45) NOT NULL,
`Topic` VARCHAR(100) NULL DEFAULT NULL,
`Level` ENUM('Easy', 'Medium', 'Hard') NULL DEFAULT NULL,
`Point` INT NOT NULL DEFAULT '1',
`Explanation` TEXT NULL DEFAULT NULL,
PRIMARY KEY (`QuestionID`),
INDEX `fk_question_instructor1_idx` (`InstructorID` ASC) VISIBLE,
INDEX `ix_question_topic_level` (`Topic` ASC, `Level` ASC) VISIBLE,
CONSTRAINT `fk_question_instructor1`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`))
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`assignment_question`

---

CREATE TABLE IF NOT EXISTS `atps`.`assignment_question` (
`QuestionID` INT NOT NULL,
`AssignmentID` INT NOT NULL,
`AssignmentQuestionId` INT NOT NULL AUTO_INCREMENT,
PRIMARY KEY (`AssignmentQuestionId`),
UNIQUE INDEX `uq_assignment_question` (`AssignmentID` ASC, `QuestionID` ASC) VISIBLE,
INDEX `QuestionID` (`QuestionID` ASC) VISIBLE,
INDEX `ix_aq_assignment` (`AssignmentID` ASC) VISIBLE,
CONSTRAINT `assignment_question_ibfk_2`
FOREIGN KEY (`QuestionID`)
REFERENCES `atps`.`question` (`QuestionID`)
ON DELETE CASCADE
ON UPDATE CASCADE,
CONSTRAINT `assignment_question_ibfk_3`
FOREIGN KEY (`AssignmentID`)
REFERENCES `atps`.`assignment` (`AssignmentID`))
ENGINE = InnoDB
AUTO_INCREMENT = 8
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`learner`

---

CREATE TABLE IF NOT EXISTS `atps`.`learner` (
`LearnerID` INT NOT NULL AUTO_INCREMENT,
`FullName` VARCHAR(100) NOT NULL,
`DateOfBirth` DATE NULL DEFAULT NULL,
`ProfilePicture` VARCHAR(255) NULL DEFAULT NULL,
`Job` VARCHAR(100) NULL DEFAULT NULL,
`Address` VARCHAR(255) NULL DEFAULT NULL,
`AccID` INT NOT NULL,
PRIMARY KEY (`LearnerID`),
INDEX `fk_learner_account1_idx` (`AccID` ASC) VISIBLE,
CONSTRAINT `fk_learner_account1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`assignmentanswer`

---

CREATE TABLE IF NOT EXISTS `atps`.`assignmentanswer` (
`LearnerId` INT NOT NULL,
`Answer` VARCHAR(50) NULL DEFAULT NULL,
`AssignmentID` INT NOT NULL,
PRIMARY KEY (`LearnerId`, `AssignmentID`),
INDEX `fk_AssignmentAnswer_assignment1_idx` (`AssignmentID` ASC) VISIBLE,
CONSTRAINT `answer_learner_fk1`
FOREIGN KEY (`LearnerId`)
REFERENCES `atps`.`learner` (`LearnerID`),
CONSTRAINT `fk_AssignmentAnswer_assignment1`
FOREIGN KEY (`AssignmentID`)
REFERENCES `atps`.`assignment` (`AssignmentID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`assignmentquestion`

---

CREATE TABLE IF NOT EXISTS `atps`.`assignmentquestion` (
`AssignmentquestionId` INT NOT NULL AUTO_INCREMENT,
`AssignmentID` INT NOT NULL,
`LearnerID` INT NOT NULL,
PRIMARY KEY (`AssignmentquestionId`, `AssignmentID`, `LearnerID`),
INDEX `fk_assignmentquestion_AssignmentAnswer1_idx` (`AssignmentID` ASC) VISIBLE,
INDEX `fk_assignmentquestion_learner1_idx` (`LearnerID` ASC) VISIBLE,
CONSTRAINT `fk_assignmentquestion_AssignmentAnswer1`
FOREIGN KEY (`AssignmentID`)
REFERENCES `atps`.`assignmentanswer` (`AssignmentID`),
CONSTRAINT `fk_assignmentquestion_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`class`

---

CREATE TABLE IF NOT EXISTS `atps`.`class` (
`ClassID` INT NOT NULL AUTO_INCREMENT,
`ZoomID` VARCHAR(11) NOT NULL,
`Zoompass` VARCHAR(6) NOT NULL,
`Status` ENUM('DRAFT', 'WAITING','PENDING', 'APPROVED', 'ACTIVE','ON_GOING', 'CLOSE', 'CANCEL') NOT NULL,
`CourseID` INT NULL DEFAULT NULL,
`InstructorID` INT NOT NULL,
`Name` VARCHAR(45) NOT NULL,
`Fee` DECIMAL(10,2) NOT NULL,
`Maxstudent` INT NOT NULL,
`OpendatePlan` DATE NOT NULL,
`Opendate` DATE NULL DEFAULT NULL,
`EnddatePlan` DATE NOT NULL,
`Enddate` DATE NULL DEFAULT NULL,
`Numofsession` INT NOT NULL,
PRIMARY KEY (`ClassID`),
INDEX `fk_Class_course1_idx` (`CourseID` ASC) VISIBLE,
INDEX `fk_Class_instructor1_idx` (`InstructorID` ASC) VISIBLE,
CONSTRAINT `fk_Class_course1`
FOREIGN KEY (`CourseID`)
REFERENCES `atps`.`course` (`CourseID`),
CONSTRAINT `fk_Class_instructor1`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`timeslot`

---

CREATE TABLE IF NOT EXISTS `atps`.`timeslot` (
`TimeslotID` INT NOT NULL AUTO_INCREMENT,
`StartTime` TIME NOT NULL,
`EndTime` TIME NOT NULL,
`Day` VARCHAR(10) NOT NULL,
PRIMARY KEY (`TimeslotID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`session`

---

CREATE TABLE IF NOT EXISTS `atps`.`session` (
`SessionID` INT NOT NULL AUTO_INCREMENT,
`Title` VARCHAR(255) NOT NULL,
`Description` TEXT NULL,
`InstructorID` INT NOT NULL,
`TimeslotID` INT NOT NULL,
`ClassID` INT NOT NULL,
`Date` DATE NOT NULL,
`ZoomUUID` VARCHAR(45) NULL,
PRIMARY KEY (`SessionID`),
INDEX `fk_session_instructor1_idx` (`InstructorID` ASC) VISIBLE,
INDEX `fk_session_timeslot1_idx` (`TimeslotID` ASC) VISIBLE,
INDEX `fk_session_class1_idx` (`ClassID` ASC) VISIBLE,
CONSTRAINT `fk_session_class1`
FOREIGN KEY (`ClassID`)
REFERENCES `atps`.`class` (`ClassID`),
CONSTRAINT `fk_session_instructor1`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`),
CONSTRAINT `fk_session_timeslot1`
FOREIGN KEY (`TimeslotID`)
REFERENCES `atps`.`timeslot` (`TimeslotID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`attendance`

---

CREATE TABLE IF NOT EXISTS `atps`.`attendance` (
`AttendanceID` INT NOT NULL AUTO_INCREMENT,
`Status` VARCHAR(50) NOT NULL,
`Date` DATE NOT NULL,
`LearnerID` INT NOT NULL,
`SessionID` INT NOT NULL,
PRIMARY KEY (`AttendanceID`),
INDEX `fk_attendance_learner1_idx` (`LearnerID` ASC) VISIBLE,
INDEX `fk_attendance_lesson1_idx` (`SessionID` ASC) VISIBLE,
CONSTRAINT `fk_attendance_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`),
CONSTRAINT `fk_attendance_lesson1`
FOREIGN KEY (`SessionID`)
REFERENCES `atps`.`session` (`SessionID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`certificate`

---

CREATE TABLE IF NOT EXISTS `atps`.`certificate` (
`CertificateID` INT NOT NULL AUTO_INCREMENT,
`Title` VARCHAR(255) NOT NULL,
`FileURL` VARCHAR(255) NOT NULL,
`InstructorID` INT NOT NULL,
`Status` VARCHAR(45) NOT NULL,
PRIMARY KEY (`CertificateID`),
INDEX `fk_certificate_instructor1_idx` (`InstructorID` ASC) VISIBLE,
CONSTRAINT `fk_certificate_instructor1`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`enrollment`

---

CREATE TABLE IF NOT EXISTS `atps`.`enrollment` (
`EnrollmentID` INT NOT NULL AUTO_INCREMENT,
`EnrollmentDate` DATE NOT NULL,
`Status` VARCHAR(50) NOT NULL,
`LearnerID` INT NOT NULL,
`ClassID` INT NOT NULL,
`OrderCode` BIGINT NOT NULL,
PRIMARY KEY (`EnrollmentID`),
INDEX `fk_enrollment_learner1_idx` (`LearnerID` ASC) VISIBLE,
INDEX `fk_enrollment_class1_idx` (`ClassID` ASC) VISIBLE,
CONSTRAINT `fk_enrollment_class1`
FOREIGN KEY (`ClassID`)
REFERENCES `atps`.`class` (`ClassID`),
CONSTRAINT `fk_enrollment_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`exam`

---

CREATE TABLE IF NOT EXISTS `atps`.`exam` (
`ExamID` INT NOT NULL AUTO_INCREMENT,
`CourseID` INT NULL DEFAULT NULL,
`Title` VARCHAR(255) NOT NULL,
`Description` TEXT NOT NULL,
`StartTime` DATETIME NOT NULL,
`EndTime` DATETIME NOT NULL,
`Status` VARCHAR(50) NOT NULL,
PRIMARY KEY (`ExamID`),
INDEX `CourseID` (`CourseID` ASC) VISIBLE,
CONSTRAINT `exam_ibfk_1`
FOREIGN KEY (`CourseID`)
REFERENCES `atps`.`course` (`CourseID`)
ON DELETE CASCADE
ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`examquestion`

---

CREATE TABLE IF NOT EXISTS `atps`.`examquestion` (
`ExamquestionId` INT NOT NULL AUTO_INCREMENT,
`ExamID` INT NOT NULL,
`QuestionID` INT NOT NULL,
PRIMARY KEY (`ExamquestionId`, `ExamID`, `QuestionID`),
INDEX `fk_table1_question1_idx` (`QuestionID` ASC) VISIBLE,
INDEX `fk_table1_exam1` (`ExamID` ASC) VISIBLE,
CONSTRAINT `fk_table1_exam1`
FOREIGN KEY (`ExamID`)
REFERENCES `atps`.`exam` (`ExamID`),
CONSTRAINT `fk_table1_question1`
FOREIGN KEY (`QuestionID`)
REFERENCES `atps`.`question` (`QuestionID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`examanswer`

---

CREATE TABLE IF NOT EXISTS `atps`.`examanswer` (
`LearnerID` INT NOT NULL,
`ExamquestionId` INT NOT NULL,
`Answer` VARCHAR(50) NULL DEFAULT NULL,
PRIMARY KEY (`LearnerID`, `ExamquestionId`),
INDEX `fk_table1_learner1_idx` (`LearnerID` ASC) VISIBLE,
INDEX `fk_table1_examquestion1_idx` (`ExamquestionId` ASC) VISIBLE,
CONSTRAINT `fk_table1_examquestion1`
FOREIGN KEY (`ExamquestionId`)
REFERENCES `atps`.`examquestion` (`ExamquestionId`),
CONSTRAINT `fk_table1_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`examresult`

---

CREATE TABLE IF NOT EXISTS `atps`.`examresult` (
`ResultID` INT NOT NULL AUTO_INCREMENT,
`Score` DECIMAL(5,2) NULL DEFAULT NULL,
`Feedback` TEXT NULL DEFAULT NULL,
`SubmissionDate` DATETIME NOT NULL,
`LearnerID` INT NOT NULL,
`ExamID` INT NOT NULL,
PRIMARY KEY (`ResultID`),
INDEX `fk_examresult_learner1_idx` (`LearnerID` ASC) VISIBLE,
INDEX `fk_examresult_exam1_idx` (`ExamID` ASC) VISIBLE,
CONSTRAINT `fk_examresult_exam1`
FOREIGN KEY (`ExamID`)
REFERENCES `atps`.`exam` (`ExamID`),
CONSTRAINT `fk_examresult_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`instructorreview`

---

CREATE TABLE IF NOT EXISTS `atps`.`instructorreview` (
`ReviewID` INT NOT NULL AUTO_INCREMENT,
`Comment` TEXT NOT NULL,
`ReviewDate` DATE NOT NULL,
`Status` VARCHAR(50) NOT NULL,
`InstructorID` INT NOT NULL,
`LearnerID` INT NOT NULL,
PRIMARY KEY (`ReviewID`),
INDEX `fk_instructorreview_instructor1_idx` (`InstructorID` ASC) VISIBLE,
INDEX `fk_instructorreview_learner1_idx` (`LearnerID` ASC) VISIBLE,
CONSTRAINT `fk_instructorreview_instructor1`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`),
CONSTRAINT `fk_instructorreview_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`instructortimeslot`

---

CREATE TABLE IF NOT EXISTS `atps`.`instructortimeslot` (
`InstructortimeslotID` INT NOT NULL AUTO_INCREMENT,
`TimeslotID` INT NOT NULL,
`InstructorID` INT NOT NULL,
`Date` DATE NOT NULL,
`Status` VARCHAR(45) NULL DEFAULT NULL,
`Note` VARCHAR(45) NULL DEFAULT NULL,
INDEX `fk_instructortimeslot_timeslot1_idx` (`TimeslotID` ASC) VISIBLE,
INDEX `fk_instructortimeslot_instructor1_idx` (`InstructorID` ASC) VISIBLE,
PRIMARY KEY (`InstructortimeslotID`),
CONSTRAINT `fk_instructortimeslot_instructor1`
FOREIGN KEY (`InstructorID`)
REFERENCES `atps`.`instructor` (`InstructorID`),
CONSTRAINT `fk_instructortimeslot_timeslot1`
FOREIGN KEY (`TimeslotID`)
REFERENCES `atps`.`timeslot` (`TimeslotID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`lesson`

---

CREATE TABLE IF NOT EXISTS `atps`.`lesson` (
`LessonID` INT NOT NULL AUTO_INCREMENT,
`OrderIndex` INT NOT NULL,
`Title` VARCHAR(255) NOT NULL,
`Duration` DECIMAL(10,2) NOT NULL,
`Type` ENUM('video', 'document', 'audio') NOT NULL,
`FileURL` VARCHAR(255) NOT NULL,
`UnitID` INT NOT NULL,
`Status` ENUM('VISIBLE', 'HIDDEN', 'DELETED') NOT NULL,
PRIMARY KEY (`LessonID`),
INDEX `fk_lession_unit1_idx` (`UnitID` ASC) VISIBLE,
CONSTRAINT `fk_lession_unit1`
FOREIGN KEY (`UnitID`)
REFERENCES `atps`.`unit` (`UnitID`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`log`

---

CREATE TABLE IF NOT EXISTS `atps`.`log` (
`LogID` INT NOT NULL AUTO_INCREMENT,
`Action` VARCHAR(255) NOT NULL,
`Timestamp` DATETIME NOT NULL,
`AccID` INT NOT NULL,
`Detail` VARCHAR(255) NOT NULL,
PRIMARY KEY (`LogID`),
INDEX `fk_log_account1_idx` (`AccID` ASC) VISIBLE,
CONSTRAINT `fk_log_account1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`material`

---

CREATE TABLE IF NOT EXISTS `atps`.`material` (
`MaterialID` INT NOT NULL AUTO_INCREMENT,
`Title` VARCHAR(255) NOT NULL,
`FileURL` VARCHAR(255) NOT NULL,
`Status` ENUM('VISIBLE', 'HIDDEN', 'DELETED') NOT NULL,
`CourseID` INT NOT NULL,
PRIMARY KEY (`MaterialID`),
INDEX `fk_material_course1_idx` (`CourseID` ASC) VISIBLE,
CONSTRAINT `fk_material_course1`
FOREIGN KEY (`CourseID`)
REFERENCES `atps`.`course` (`CourseID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`staff`

---

CREATE TABLE IF NOT EXISTS `atps`.`staff` (
`StaffID` INT NOT NULL AUTO_INCREMENT,
`FullName` VARCHAR(100) NOT NULL,
`DateOfBirth` DATE NULL DEFAULT NULL,
`ProfilePicture` VARCHAR(255) NULL DEFAULT NULL,
`Address` VARCHAR(255) NULL DEFAULT NULL,
`AccID` INT NOT NULL,
PRIMARY KEY (`StaffID`),
INDEX `fk_staff_account1_idx` (`AccID` ASC) VISIBLE,
CONSTRAINT `fk_staff_account1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`news`

---

CREATE TABLE IF NOT EXISTS `atps`.`news` (
`NewsID` INT NOT NULL AUTO_INCREMENT,
`Title` VARCHAR(255) NOT NULL,
`Content` TEXT NOT NULL,
`PostedDate` DATETIME NOT NULL,
`Status` VARCHAR(50) NOT NULL,
`StaffID` INT NOT NULL,
`image` VARCHAR(255) NULL,
PRIMARY KEY (`NewsID`),
INDEX `fk_news_staff1_idx` (`StaffID` ASC) VISIBLE,
CONSTRAINT `fk_news_staff1`
FOREIGN KEY (`StaffID`)
REFERENCES `atps`.`staff` (`StaffID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`note`

---

CREATE TABLE IF NOT EXISTS `atps`.`note` (
`NoteID` INT NOT NULL AUTO_INCREMENT,
`AccID` INT NOT NULL,
`Content` TEXT NOT NULL,
`FileURL` VARCHAR(255) NOT NULL,
PRIMARY KEY (`NoteID`),
INDEX `UserID` (`AccID` ASC) VISIBLE,
CONSTRAINT `note_ibfk_1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`)
ON DELETE CASCADE
ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`notification`

---

CREATE TABLE IF NOT EXISTS `atps`.`notification` (
`NotificationID` INT NOT NULL AUTO_INCREMENT,
`Content` TEXT NOT NULL,
`Type` VARCHAR(100) NOT NULL,
`Status` VARCHAR(50) NOT NULL,
`AccID` INT NOT NULL,
PRIMARY KEY (`NotificationID`),
INDEX `fk_notification_account1_idx` (`AccID` ASC) VISIBLE,
CONSTRAINT `fk_notification_account1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`parent`

---

CREATE TABLE IF NOT EXISTS `atps`.`parent` (
`ParentID` INT NOT NULL AUTO_INCREMENT,
`FullName` VARCHAR(100) NOT NULL,
`DateOfBirth` DATE NULL DEFAULT NULL,
`ProfilePicture` VARCHAR(255) NULL DEFAULT NULL,
`Job` VARCHAR(100) NULL DEFAULT NULL,
`Address` VARCHAR(255) NULL DEFAULT NULL,
`AccID` INT NOT NULL,
PRIMARY KEY (`ParentID`),
INDEX `fk_parent_account1_idx` (`AccID` ASC) VISIBLE,
CONSTRAINT `fk_parent_account1`
FOREIGN KEY (`AccID`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`parentlearner`

---

CREATE TABLE IF NOT EXISTS `atps`.`parentlearner` (
`LearnerID` INT NOT NULL,
`ParentID` INT NOT NULL,
PRIMARY KEY (`LearnerID`, `ParentID`),
INDEX `ParentID` (`ParentID` ASC) VISIBLE,
CONSTRAINT `parentlearner_ibfk_1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`)
ON DELETE CASCADE
ON UPDATE CASCADE,
CONSTRAINT `parentlearner_ibfk_2`
FOREIGN KEY (`ParentID`)
REFERENCES `atps`.`parent` (`ParentID`)
ON DELETE CASCADE
ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`payment`

---

CREATE TABLE IF NOT EXISTS `atps`.`payment` (
`PaymentID` INT NOT NULL AUTO_INCREMENT,
`Amount` DECIMAL(10,2) NOT NULL,
`PaymentMethod` VARCHAR(100) NOT NULL,
`PaymentDate` DATE NOT NULL,
`EnrollmentID` INT NOT NULL,
`Status` VARCHAR(45) NOT NULL,
PRIMARY KEY (`PaymentID`),
INDEX `fk_payment_enrollment1_idx` (`EnrollmentID` ASC) VISIBLE,
CONSTRAINT `fk_payment_enrollment1`
FOREIGN KEY (`EnrollmentID`)
REFERENCES `atps`.`enrollment` (`EnrollmentID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`promotion`

---

CREATE TABLE IF NOT EXISTS `atps`.`promotion` (
`PromotionID` INT NOT NULL AUTO_INCREMENT,
`Code` VARCHAR(50) NOT NULL,
`Discount` DECIMAL(5,2) NOT NULL,
`StartDate` DATE NOT NULL,
`EndDate` DATE NULL DEFAULT NULL,
`CreateBy` INT NOT NULL,
`Status` VARCHAR(45) NOT NULL,
PRIMARY KEY (`PromotionID`),
INDEX `fk_promotion_user1_idx` (`CreateBy` ASC) VISIBLE,
CONSTRAINT `fk_promotion_user1`
FOREIGN KEY (`CreateBy`)
REFERENCES `atps`.`account` (`AccID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`question_option`

---

CREATE TABLE IF NOT EXISTS `atps`.`question_option` (
`OptionID` INT NOT NULL AUTO_INCREMENT,
`QuestionID` INT NOT NULL,
`Content` TEXT NOT NULL,
`IsCorrect` TINYINT(1) NOT NULL DEFAULT '0',
PRIMARY KEY (`OptionID`),
INDEX `idx_qo_question` (`QuestionID` ASC) VISIBLE,
CONSTRAINT `fk_qo_question`
FOREIGN KEY (`QuestionID`)
REFERENCES `atps`.`question` (`QuestionID`)
ON DELETE CASCADE
ON UPDATE CASCADE)
ENGINE = InnoDB
AUTO_INCREMENT = 10
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`refundrequest`

---

CREATE TABLE IF NOT EXISTS `atps`.`refundrequest` (
`RefundID` INT NOT NULL AUTO_INCREMENT,
`RequestDate` DATE NOT NULL,
`Reason` TEXT NOT NULL,
`Status` VARCHAR(50) NOT NULL,
`EnrollmentID` INT NOT NULL,
PRIMARY KEY (`RefundID`),
INDEX `fk_refundrequest_enrollment1_idx` (`EnrollmentID` ASC) VISIBLE,
CONSTRAINT `fk_refundrequest_enrollment1`
FOREIGN KEY (`EnrollmentID`)
REFERENCES `atps`.`enrollment` (`EnrollmentID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`submission`

---

CREATE TABLE IF NOT EXISTS `atps`.`submission` (
`SubmissionID` INT NOT NULL AUTO_INCREMENT,
`SubmissionDate` DATE NOT NULL,
`FileURL` VARCHAR(255) NULL DEFAULT NULL,
`Score` DECIMAL(5,2) NULL DEFAULT NULL,
`Feedback` TEXT NOT NULL,
`LearnerID` INT NOT NULL,
`AssignmentID` INT NOT NULL,
`Content` TEXT NULL DEFAULT NULL,
`AudioURL` VARCHAR(500) NULL DEFAULT NULL,
`DurationSec` INT NULL DEFAULT NULL,
`Status` ENUM('submitted', 'late', 'not_submitted') NOT NULL DEFAULT 'not_submitted',
PRIMARY KEY (`SubmissionID`),
INDEX `fk_submission_learner1_idx` (`LearnerID` ASC) VISIBLE,
INDEX `fk_submission_assignment1_idx` (`AssignmentID` ASC) VISIBLE,
INDEX `ix_sub_assignment` (`AssignmentID` ASC) VISIBLE,
CONSTRAINT `fk_submission_assignment1`
FOREIGN KEY (`AssignmentID`)
REFERENCES `atps`.`assignment` (`AssignmentID`),
CONSTRAINT `fk_submission_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`submission_asset`

---

CREATE TABLE IF NOT EXISTS `atps`.`submission_asset` (
`SubmissionAssetID` INT NOT NULL AUTO_INCREMENT,
`SubmissionID` INT NOT NULL,
`Kind` ENUM('audio', 'video', 'doc', 'image', 'other') NOT NULL,
`FileURL` VARCHAR(500) NOT NULL,
PRIMARY KEY (`SubmissionAssetID`),
INDEX `fk_sa_submission` (`SubmissionID` ASC) VISIBLE,
CONSTRAINT `fk_sa_submission`
FOREIGN KEY (`SubmissionID`)
REFERENCES `atps`.`submission` (`SubmissionID`)
ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`survey`

---

CREATE TABLE IF NOT EXISTS `atps`.`survey` (
`SurveyID` INT NOT NULL AUTO_INCREMENT,
`Title` VARCHAR(255) NOT NULL,
`Description` TEXT NOT NULL,
`Status` VARCHAR(50) NOT NULL,
`StaffID` INT NOT NULL,
PRIMARY KEY (`SurveyID`),
INDEX `fk_survey_staff1_idx` (`StaffID` ASC) VISIBLE,
CONSTRAINT `fk_survey_staff1`
FOREIGN KEY (`StaffID`)
REFERENCES `atps`.`staff` (`StaffID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

---

-- Table `atps`.`surveyresponse`

---

CREATE TABLE IF NOT EXISTS `atps`.`surveyresponse` (
`ResponseID` INT NOT NULL AUTO_INCREMENT,
`Response` TEXT NOT NULL,
`ResponseDate` DATETIME NOT NULL,
`SurveyID` INT NOT NULL,
`LearnerID` INT NOT NULL,
PRIMARY KEY (`ResponseID`),
INDEX `fk_surveyresponse_survey1_idx` (`SurveyID` ASC) VISIBLE,
INDEX `fk_surveyresponse_learner1_idx` (`LearnerID` ASC) VISIBLE,
CONSTRAINT `fk_surveyresponse_learner1`
FOREIGN KEY (`LearnerID`)
REFERENCES `atps`.`learner` (`LearnerID`),
CONSTRAINT `fk_surveyresponse_survey1`
FOREIGN KEY (`SurveyID`)
REFERENCES `atps`.`survey` (`SurveyID`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
