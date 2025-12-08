-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: mysql-353d5b0a-hieupu2003-6976.i.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '04b61993-c7ab-11f0-9d29-0aa856090103:1-2451';

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS account;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  AccID int NOT NULL AUTO_INCREMENT,
  Email varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Phone varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Provider varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Username varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Gender enum('male','female','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (AccID),
  UNIQUE KEY Email (Email)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accountfeature`
--

DROP TABLE IF EXISTS accountfeature;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE accountfeature (
  AccountID int NOT NULL,
  FeatureID int NOT NULL,
  PRIMARY KEY (AccountID,FeatureID),
  KEY FeatureID (FeatureID),
  CONSTRAINT accountfeature_ibfk_1 FOREIGN KEY (AccountID) REFERENCES `account` (AccID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT accountfeature_ibfk_2 FOREIGN KEY (FeatureID) REFERENCES feature (FeatureID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS admin;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  AdminID int NOT NULL AUTO_INCREMENT,
  FullName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DateOfBirth date DEFAULT NULL,
  ProfilePicture varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Address varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AccID int NOT NULL,
  PRIMARY KEY (AdminID),
  KEY fk_admin_account1_idx (AccID),
  CONSTRAINT fk_admin_account1 FOREIGN KEY (AccID) REFERENCES `account` (AccID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assignment`
--

DROP TABLE IF EXISTS assignment;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE assignment (
  AssignmentID int NOT NULL AUTO_INCREMENT,
  InstructorID int NOT NULL,
  UnitID int DEFAULT NULL,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Deadline datetime DEFAULT NULL,
  FileURL varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` enum('draft','active','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Type` enum('quiz','audio','video','document') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'document',
  ShowAnswersAfter enum('after_submission','after_deadline','never') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'after_submission',
  MaxDuration int DEFAULT NULL,
  MediaURL varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (AssignmentID),
  KEY fk_assignment_unit1_idx (UnitID),
  KEY fk_assignment_instructor (InstructorID),
  KEY ix_assignment_type_unit (`Type`,UnitID),
  CONSTRAINT fk_assignment_instructor FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID),
  CONSTRAINT fk_assignment_unit FOREIGN KEY (UnitID) REFERENCES unit (UnitID)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assignment_question`
--

DROP TABLE IF EXISTS assignment_question;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE assignment_question (
  QuestionID int NOT NULL,
  AssignmentID int NOT NULL,
  AssignmentQuestionId int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (AssignmentQuestionId),
  UNIQUE KEY uq_assignment_question (AssignmentID,QuestionID),
  KEY QuestionID (QuestionID),
  KEY ix_aq_assignment (AssignmentID),
  CONSTRAINT assignment_question_ibfk_2 FOREIGN KEY (QuestionID) REFERENCES question (QuestionID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT assignment_question_ibfk_3 FOREIGN KEY (AssignmentID) REFERENCES assignment (AssignmentID)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assignmentanswer`
--

DROP TABLE IF EXISTS assignmentanswer;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE assignmentanswer (
  LearnerId int NOT NULL,
  Answer varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AssignmentQuestionId int NOT NULL,
  PRIMARY KEY (LearnerId),
  KEY fk2_assignmentanswer_idx (AssignmentQuestionId),
  CONSTRAINT answer_learner_fk1 FOREIGN KEY (LearnerId) REFERENCES learner (LearnerID),
  CONSTRAINT fk2_assignmentanswer FOREIGN KEY (AssignmentQuestionId) REFERENCES assignment_question (AssignmentQuestionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS attendance;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE attendance (
  AttendanceID int NOT NULL AUTO_INCREMENT,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Date` datetime NOT NULL,
  LearnerID int NOT NULL,
  SessionID int NOT NULL,
  note varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (AttendanceID),
  KEY fk_attendance_learner1_idx (LearnerID),
  KEY fk_attendance_lesson1_idx (SessionID),
  CONSTRAINT fk_attendance_learner1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID),
  CONSTRAINT fk_attendance_lesson1 FOREIGN KEY (SessionID) REFERENCES `session` (SessionID)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `certificate`
--

DROP TABLE IF EXISTS certificate;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE certificate (
  CertificateID int NOT NULL AUTO_INCREMENT,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  FileURL varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  InstructorID int NOT NULL,
  `Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (CertificateID),
  KEY fk_certificate_instructor1_idx (InstructorID),
  CONSTRAINT fk_certificate_instructor1 FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class`
--

DROP TABLE IF EXISTS class;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE class (
  ClassID int NOT NULL AUTO_INCREMENT,
  ZoomID varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Zoompass varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` enum('DRAFT','APPROVED','ACTIVE','ONGOING','CLOSE','CANCEL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  CourseID int DEFAULT NULL,
  InstructorID int NOT NULL,
  `Name` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Fee decimal(10,2) NOT NULL,
  Maxstudent int NOT NULL,
  OpendatePlan date NOT NULL,
  Opendate date DEFAULT NULL,
  EnddatePlan date NOT NULL,
  Enddate date DEFAULT NULL,
  Numofsession int NOT NULL,
  PRIMARY KEY (ClassID),
  KEY fk_Class_course1_idx (CourseID),
  KEY fk_Class_instructor1_idx (InstructorID),
  CONSTRAINT fk_Class_course1 FOREIGN KEY (CourseID) REFERENCES course (CourseID),
  CONSTRAINT fk_Class_instructor1 FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course`
--

DROP TABLE IF EXISTS course;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE course (
  CourseID int NOT NULL AUTO_INCREMENT,
  InstructorID int NOT NULL,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Image varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Duration decimal(10,2) NOT NULL,
  Objectives text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Requirements text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Level` enum('BEGINNER','INTERMEDIATE','ADVANCED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` enum('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','DELETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (CourseID),
  KEY fk_course_instructor1_idx (InstructorID),
  CONSTRAINT fk_course_instructor1 FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `enrollment`
--

DROP TABLE IF EXISTS enrollment;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE enrollment (
  EnrollmentID int NOT NULL AUTO_INCREMENT,
  EnrollmentDate date NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  LearnerID int NOT NULL,
  ClassID int NOT NULL,
  OrderCode bigint NOT NULL,
  PRIMARY KEY (EnrollmentID),
  KEY fk_enrollment_learner1_idx (LearnerID),
  KEY fk_enrollment_class1_idx (ClassID),
  CONSTRAINT fk_enrollment_class1 FOREIGN KEY (ClassID) REFERENCES class (ClassID),
  CONSTRAINT fk_enrollment_learner1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exam`
--

DROP TABLE IF EXISTS exam;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE exam (
  ExamID int NOT NULL AUTO_INCREMENT,
  CourseID int DEFAULT NULL,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  StartTime datetime NOT NULL,
  EndTime datetime NOT NULL,
  `Status` enum('Pending','Ongoing','Completed','Cancelled','Archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  isRandomQuestion tinyint NOT NULL DEFAULT '0',
  isRandomAnswer tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (ExamID),
  KEY CourseID (CourseID),
  CONSTRAINT exam_ibfk_1 FOREIGN KEY (CourseID) REFERENCES course (CourseID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exam_class`
--

DROP TABLE IF EXISTS exam_class;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE exam_class (
  examId int NOT NULL,
  classId int NOT NULL,
  `status` enum('in_progress','done') NOT NULL,
  start_time datetime NOT NULL,
  end_time datetime NOT NULL,
  PRIMARY KEY (examId,classId),
  KEY fk2_idx (classId),
  CONSTRAINT fk1 FOREIGN KEY (examId) REFERENCES exam (ExamID),
  CONSTRAINT fk2 FOREIGN KEY (classId) REFERENCES class (ClassID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examanswer`
--

DROP TABLE IF EXISTS examanswer;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE examanswer (
  LearnerID int NOT NULL,
  ExamquestionId int NOT NULL,
  Answer varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (LearnerID,ExamquestionId),
  KEY fk_table1_learner1_idx (LearnerID),
  KEY fk_table1_examquestion1_idx (ExamquestionId),
  CONSTRAINT fk_table1_examquestion1 FOREIGN KEY (ExamquestionId) REFERENCES examquestion (ExamquestionId),
  CONSTRAINT fk_table1_learner1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examquestion`
--

DROP TABLE IF EXISTS examquestion;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE examquestion (
  ExamquestionId int NOT NULL AUTO_INCREMENT,
  QuestionId int NOT NULL,
  SectionId int NOT NULL,
  Order_Index int NOT NULL,
  PRIMARY KEY (ExamquestionId,QuestionId,SectionId),
  KEY fk_table1_question1_idx (QuestionId),
  KEY fk2_examquestion_idx (SectionId),
  CONSTRAINT fk2_examquestion FOREIGN KEY (SectionId) REFERENCES examsection (SectionId) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_table1_question1 FOREIGN KEY (QuestionId) REFERENCES question (QuestionID)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examresult`
--

DROP TABLE IF EXISTS examresult;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE examresult (
  ResultID int NOT NULL AUTO_INCREMENT,
  Score decimal(5,2) DEFAULT NULL,
  Feedback text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  SubmissionDate datetime NOT NULL,
  LearnerID int NOT NULL,
  ExamID int NOT NULL,
  PRIMARY KEY (ResultID),
  KEY fk_examresult_learner1_idx (LearnerID),
  KEY fk_examresult_exam1_idx (ExamID),
  CONSTRAINT fk_examresult_exam1 FOREIGN KEY (ExamID) REFERENCES exam (ExamID),
  CONSTRAINT fk_examresult_learner1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examsection`
--

DROP TABLE IF EXISTS examsection;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE examsection (
  SectionId int NOT NULL AUTO_INCREMENT,
  ExamId int NOT NULL,
  `Type` enum('Listening','Speaking','Reading','Writing') NOT NULL,
  OrderIndex int NOT NULL,
  ParentSectionId int DEFAULT NULL,
  PRIMARY KEY (SectionId),
  KEY fk1_idx (ExamId),
  KEY fk2_examsection_idx (ParentSectionId),
  CONSTRAINT fk1_examsection FOREIGN KEY (ExamId) REFERENCES exam (ExamID),
  CONSTRAINT fk2_examsection FOREIGN KEY (ParentSectionId) REFERENCES examsection (SectionId)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feature`
--

DROP TABLE IF EXISTS feature;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE feature (
  FeatureID int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `URL` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (FeatureID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `instructor`
--

DROP TABLE IF EXISTS instructor;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE instructor (
  InstructorID int NOT NULL AUTO_INCREMENT,
  FullName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DateOfBirth date DEFAULT NULL,
  ProfilePicture varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Job varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Address varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  CV varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AccID int NOT NULL,
  Major varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Type` enum('fulltime','parttime') COLLATE utf8mb4_unicode_ci NOT NULL,
  InstructorFee decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (InstructorID),
  KEY fk_instructor_account1_idx (AccID),
  CONSTRAINT fk_instructor_account1 FOREIGN KEY (AccID) REFERENCES `account` (AccID)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `instructorreview`
--

DROP TABLE IF EXISTS instructorreview;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE instructorreview (
  ReviewID int NOT NULL AUTO_INCREMENT,
  `Comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  ReviewDate date NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  InstructorID int NOT NULL,
  LearnerID int NOT NULL,
  PRIMARY KEY (ReviewID),
  KEY fk_instructorreview_instructor1_idx (InstructorID),
  KEY fk_instructorreview_learner1_idx (LearnerID),
  CONSTRAINT fk_instructorreview_instructor1 FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID),
  CONSTRAINT fk_instructorreview_learner1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `instructortimeslot`
--

DROP TABLE IF EXISTS instructortimeslot;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE instructortimeslot (
  InstructortimeslotID int NOT NULL AUTO_INCREMENT,
  TimeslotID int NOT NULL,
  InstructorID int NOT NULL,
  `Date` date NOT NULL,
  `Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Note varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (InstructortimeslotID),
  KEY fk_instructortimeslot_timeslot1_idx (TimeslotID),
  KEY fk_instructortimeslot_instructor1_idx (InstructorID),
  CONSTRAINT fk_instructortimeslot_instructor1 FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID),
  CONSTRAINT fk_instructortimeslot_timeslot1 FOREIGN KEY (TimeslotID) REFERENCES timeslot (TimeslotID)
) ENGINE=InnoDB AUTO_INCREMENT=577 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `learner`
--

DROP TABLE IF EXISTS learner;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE learner (
  LearnerID int NOT NULL AUTO_INCREMENT,
  FullName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DateOfBirth date DEFAULT NULL,
  ProfilePicture varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Job varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Address varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AccID int NOT NULL,
  PRIMARY KEY (LearnerID),
  KEY fk_learner_account1_idx (AccID),
  CONSTRAINT fk_learner_account1 FOREIGN KEY (AccID) REFERENCES `account` (AccID)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lesson`
--

DROP TABLE IF EXISTS lesson;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE lesson (
  LessonID int NOT NULL AUTO_INCREMENT,
  OrderIndex int NOT NULL,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Duration decimal(10,2) NOT NULL,
  `Type` enum('video','document','audio') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  FileURL varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  UnitID int NOT NULL,
  `Status` enum('VISIBLE','HIDDEN','DELETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (LessonID),
  KEY fk_lession_unit1_idx (UnitID),
  CONSTRAINT fk_lession_unit1 FOREIGN KEY (UnitID) REFERENCES unit (UnitID)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log`
--

DROP TABLE IF EXISTS log;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE log (
  LogID int NOT NULL AUTO_INCREMENT,
  `Action` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Timestamp` datetime NOT NULL,
  AccID int NOT NULL,
  Detail varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (LogID),
  KEY fk_log_account1_idx (AccID),
  CONSTRAINT fk_log_account1 FOREIGN KEY (AccID) REFERENCES `account` (AccID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS material;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE material (
  MaterialID int NOT NULL AUTO_INCREMENT,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  FileURL varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` enum('VISIBLE','HIDDEN','DELETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  CourseID int NOT NULL,
  PRIMARY KEY (MaterialID),
  KEY fk_material_course1_idx (CourseID),
  CONSTRAINT fk_material_course1 FOREIGN KEY (CourseID) REFERENCES course (CourseID)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS news;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE news (
  NewsID int NOT NULL AUTO_INCREMENT,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Content text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PostedDate datetime NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  StaffID int NOT NULL,
  Image varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (NewsID),
  KEY fk_news_staff1_idx (StaffID),
  CONSTRAINT fk_news_staff1 FOREIGN KEY (StaffID) REFERENCES staff (StaffID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `note`
--

DROP TABLE IF EXISTS note;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE note (
  NoteID int NOT NULL AUTO_INCREMENT,
  AccID int NOT NULL,
  Content text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  FileURL varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (NoteID),
  KEY UserID (AccID),
  CONSTRAINT note_ibfk_1 FOREIGN KEY (AccID) REFERENCES `account` (AccID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS notification;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE notification (
  NotificationID int NOT NULL AUTO_INCREMENT,
  Content text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  AccID int NOT NULL,
  PRIMARY KEY (NotificationID),
  KEY fk_notification_account1_idx (AccID),
  CONSTRAINT fk_notification_account1 FOREIGN KEY (AccID) REFERENCES `account` (AccID)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parent`
--

DROP TABLE IF EXISTS parent;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE parent (
  ParentID int NOT NULL AUTO_INCREMENT,
  FullName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DateOfBirth date DEFAULT NULL,
  ProfilePicture varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Job varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Address varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AccID int NOT NULL,
  PRIMARY KEY (ParentID),
  KEY fk_parent_account1_idx (AccID),
  CONSTRAINT fk_parent_account1 FOREIGN KEY (AccID) REFERENCES `account` (AccID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `parentlearner`
--

DROP TABLE IF EXISTS parentlearner;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE parentlearner (
  LearnerID int NOT NULL,
  ParentID int NOT NULL,
  PRIMARY KEY (LearnerID,ParentID),
  KEY ParentID (ParentID),
  CONSTRAINT parentlearner_ibfk_1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT parentlearner_ibfk_2 FOREIGN KEY (ParentID) REFERENCES parent (ParentID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS payment;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE payment (
  PaymentID int NOT NULL AUTO_INCREMENT,
  Amount decimal(10,2) NOT NULL,
  PaymentMethod varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PaymentDate date NOT NULL,
  EnrollmentID int NOT NULL,
  `Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (PaymentID),
  KEY fk_payment_enrollment1_idx (EnrollmentID),
  CONSTRAINT fk_payment_enrollment1 FOREIGN KEY (EnrollmentID) REFERENCES enrollment (EnrollmentID)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promotion`
--

DROP TABLE IF EXISTS promotion;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE promotion (
  PromotionID int NOT NULL AUTO_INCREMENT,
  `Code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Discount decimal(5,2) NOT NULL,
  StartDate date NOT NULL,
  EndDate date DEFAULT NULL,
  CreateBy int NOT NULL,
  `Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (PromotionID),
  KEY fk_promotion_user1_idx (CreateBy),
  CONSTRAINT fk_promotion_user1 FOREIGN KEY (CreateBy) REFERENCES `account` (AccID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question`
--

DROP TABLE IF EXISTS question;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE question (
  QuestionID int NOT NULL AUTO_INCREMENT,
  Content text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Type` enum('multiple_choice','true_false','fill_in_blank','matching','essay','speaking') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'multiple_choice',
  CorrectAnswer text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  InstructorID int NOT NULL,
  `Status` enum('Active','Inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Topic varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Level` enum('Easy','Medium','Hard') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Point` int NOT NULL DEFAULT '1',
  PRIMARY KEY (QuestionID),
  KEY fk_question_instructor1_idx (InstructorID),
  KEY ix_question_topic_level (Topic,`Level`),
  CONSTRAINT fk_question_instructor1 FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_option`
--

DROP TABLE IF EXISTS question_option;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE question_option (
  OptionID int NOT NULL AUTO_INCREMENT,
  QuestionID int NOT NULL,
  Content text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  IsCorrect tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (OptionID),
  KEY idx_qo_question (QuestionID),
  CONSTRAINT fk_qo_question FOREIGN KEY (QuestionID) REFERENCES question (QuestionID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refundrequest`
--

DROP TABLE IF EXISTS refundrequest;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE refundrequest (
  RefundID int NOT NULL AUTO_INCREMENT,
  RequestDate date NOT NULL,
  Reason text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  EnrollmentID int NOT NULL,
  PRIMARY KEY (RefundID),
  KEY fk_refundrequest_enrollment1_idx (EnrollmentID),
  CONSTRAINT fk_refundrequest_enrollment1 FOREIGN KEY (EnrollmentID) REFERENCES enrollment (EnrollmentID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS session;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  SessionID int NOT NULL AUTO_INCREMENT,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  InstructorID int NOT NULL,
  TimeslotID int NOT NULL,
  ClassID int NOT NULL,
  `Date` date NOT NULL,
  ZoomUUID varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (SessionID),
  KEY fk_session_instructor1_idx (InstructorID),
  KEY fk_session_timeslot1_idx (TimeslotID),
  KEY fk_session_class1_idx (ClassID),
  CONSTRAINT fk_session_class1 FOREIGN KEY (ClassID) REFERENCES class (ClassID),
  CONSTRAINT fk_session_instructor1 FOREIGN KEY (InstructorID) REFERENCES instructor (InstructorID),
  CONSTRAINT fk_session_timeslot1 FOREIGN KEY (TimeslotID) REFERENCES timeslot (TimeslotID)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS staff;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE staff (
  StaffID int NOT NULL AUTO_INCREMENT,
  FullName varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  DateOfBirth date DEFAULT NULL,
  ProfilePicture varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Address varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  AccID int NOT NULL,
  PRIMARY KEY (StaffID),
  KEY fk_staff_account1_idx (AccID),
  CONSTRAINT fk_staff_account1 FOREIGN KEY (AccID) REFERENCES `account` (AccID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `submission`
--

DROP TABLE IF EXISTS submission;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE submission (
  SubmissionID int NOT NULL AUTO_INCREMENT,
  SubmissionDate date NOT NULL,
  FileURL varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  Score decimal(5,2) DEFAULT NULL,
  Feedback text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  LearnerID int NOT NULL,
  AssignmentID int NOT NULL,
  Content text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  AudioURL varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  DurationSec int DEFAULT NULL,
  `Status` enum('submitted','late','not_submitted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_submitted',
  PRIMARY KEY (SubmissionID),
  KEY fk_submission_learner1_idx (LearnerID),
  KEY fk_submission_assignment1_idx (AssignmentID),
  KEY ix_sub_assignment (AssignmentID),
  CONSTRAINT fk_submission_assignment1 FOREIGN KEY (AssignmentID) REFERENCES assignment (AssignmentID),
  CONSTRAINT fk_submission_learner1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `submission_asset`
--

DROP TABLE IF EXISTS submission_asset;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE submission_asset (
  SubmissionAssetID int NOT NULL AUTO_INCREMENT,
  SubmissionID int NOT NULL,
  Kind enum('audio','video','doc','image','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  FileURL varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (SubmissionAssetID),
  KEY fk_sa_submission (SubmissionID),
  CONSTRAINT fk_sa_submission FOREIGN KEY (SubmissionID) REFERENCES submission (SubmissionID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `survey`
--

DROP TABLE IF EXISTS survey;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE survey (
  SurveyID int NOT NULL AUTO_INCREMENT,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  StaffID int NOT NULL,
  PRIMARY KEY (SurveyID),
  KEY fk_survey_staff1_idx (StaffID),
  CONSTRAINT fk_survey_staff1 FOREIGN KEY (StaffID) REFERENCES staff (StaffID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `surveyresponse`
--

DROP TABLE IF EXISTS surveyresponse;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE surveyresponse (
  ResponseID int NOT NULL AUTO_INCREMENT,
  Response text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  ResponseDate datetime NOT NULL,
  SurveyID int NOT NULL,
  LearnerID int NOT NULL,
  PRIMARY KEY (ResponseID),
  KEY fk_surveyresponse_survey1_idx (SurveyID),
  KEY fk_surveyresponse_learner1_idx (LearnerID),
  CONSTRAINT fk_surveyresponse_learner1 FOREIGN KEY (LearnerID) REFERENCES learner (LearnerID),
  CONSTRAINT fk_surveyresponse_survey1 FOREIGN KEY (SurveyID) REFERENCES survey (SurveyID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `timeslot`
--

DROP TABLE IF EXISTS timeslot;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE timeslot (
  TimeslotID int NOT NULL AUTO_INCREMENT,
  StartTime time NOT NULL,
  EndTime time NOT NULL,
  `Day` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (TimeslotID)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unit`
--

DROP TABLE IF EXISTS unit;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE unit (
  UnitID int NOT NULL AUTO_INCREMENT,
  Title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  Duration decimal(10,2) NOT NULL,
  CourseID int NOT NULL,
  `Status` enum('VISIBLE','HIDDEN','DELETED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  OrderIndex int NOT NULL,
  PRIMARY KEY (UnitID),
  KEY fk_coursecontent_course1_idx (CourseID),
  CONSTRAINT fk_coursecontent_course1 FOREIGN KEY (CourseID) REFERENCES course (CourseID)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
