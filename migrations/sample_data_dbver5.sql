-- =====================================================
-- SAMPLE DATA FOR DBVER5 - Tất cả các trường hợp có thể xảy ra
-- =====================================================
-- File này chứa dữ liệu mẫu cho tất cả các bảng trong dbver5
-- Bao gồm tất cả các giá trị ENUM và Status có thể có
-- 
-- LƯU Ý: Chạy script tạo database (dbver5.md) trước khi chạy script này
-- =====================================================

USE `atps`;

-- =====================================================
-- 1. ACCOUNT - Tất cả các Status và Gender
-- =====================================================

-- Account với các Status khác nhau
INSERT INTO `account` (`Email`, `Phone`, `Password`, `Status`, `Provider`, `username`, `Gender`) VALUES
-- Active accounts
('admin@atps.com', '0123456789', '$2b$10$hashed_password', 'active', 'local', 'admin', 'male'),
('instructor1@atps.com', '0123456780', '$2b$10$hashed_password', 'active', 'local', 'instructor1', 'male'),
('instructor2@atps.com', '0123456781', '$2b$10$hashed_password', 'active', 'local', 'instructor2', 'female'),
('learner1@atps.com', '0123456782', '$2b$10$hashed_password', 'active', 'local', 'learner1', 'male'),
('learner2@atps.com', '0123456783', '$2b$10$hashed_password', 'active', 'local', 'learner2', 'female'),
('learner3@atps.com', '0123456784', '$2b$10$hashed_password', 'active', 'local', 'learner3', 'other'),
-- Inactive accounts
('inactive@atps.com', '0123456785', '$2b$10$hashed_password', 'inactive', 'local', 'inactive_user', 'male'),
-- Suspended accounts
('suspended@atps.com', '0123456786', '$2b$10$hashed_password', 'suspended', 'local', 'suspended_user', 'female'),
-- Pending accounts
('pending@atps.com', '0123456787', '$2b$10$hashed_password', 'pending', 'local', 'pending_user', 'other'),
-- Google OAuth
('google.user@gmail.com', NULL, NULL, 'active', 'google', 'google_user', 'male'),
-- Facebook OAuth
('facebook.user@facebook.com', NULL, NULL, 'active', 'facebook', 'facebook_user', 'female');

-- =====================================================
-- 2. ADMIN
-- =====================================================

INSERT INTO `admin` (`FullName`, `DateOfBirth`, `ProfilePicture`, `Address`, `AccID`) VALUES
('Admin User', '1990-01-01', '/uploads/admin1.jpg', '123 Admin Street', 1);

-- =====================================================
-- 3. INSTRUCTOR - Tất cả các Type
-- =====================================================

INSERT INTO `instructor` (`FullName`, `DateOfBirth`, `ProfilePicture`, `Job`, `Address`, `CV`, `AccID`, `Major`, `Type`, `InstructorFee`) VALUES
-- Fulltime instructors
('Nguyễn Văn A', '1985-05-15', '/uploads/instructor1.jpg', 'Senior Developer', '123 Instructor St', '/cv/instructor1.pdf', 2, 'Frontend Development', 'fulltime', 5000000.00),
('Trần Thị B', '1990-08-20', '/uploads/instructor2.jpg', 'Tech Lead', '456 Instructor Ave', '/cv/instructor2.pdf', 3, 'Backend Development', 'fulltime', 6000000.00),
-- Parttime instructors
('Lê Văn C', '1988-03-10', '/uploads/instructor3.jpg', 'Freelancer', '789 Instructor Rd', '/cv/instructor3.pdf', 4, 'Full Stack Development', 'parttime', 4000000.00);

-- =====================================================
-- 4. LEARNER
-- =====================================================

INSERT INTO `learner` (`FullName`, `DateOfBirth`, `ProfilePicture`, `Job`, `Address`, `AccID`) VALUES
('Phạm Văn D', '2000-01-15', '/uploads/learner1.jpg', 'Student', '123 Learner St', 4),
('Hoàng Thị E', '1998-06-20', '/uploads/learner2.jpg', 'Developer', '456 Learner Ave', 5),
('Vũ Văn F', '1995-12-05', '/uploads/learner3.jpg', 'Designer', '789 Learner Rd', 6);

-- =====================================================
-- 5. STAFF
-- =====================================================

INSERT INTO `staff` (`FullName`, `DateOfBirth`, `ProfilePicture`, `Address`, `AccID`) VALUES
('Staff User', '1992-03-15', '/uploads/staff1.jpg', '123 Staff Street', 7);

-- =====================================================
-- 6. COURSE - Tất cả các Level và Status
-- =====================================================

INSERT INTO `course` (`InstructorID`, `Title`, `Description`, `Image`, `Duration`, `Ojectives`, `Requirements`, `Level`, `Status`, `Code`) VALUES
-- BEGINNER level courses
(1, 'React Cơ bản', 'Khóa học React cho người mới bắt đầu', '/images/react-basic.jpg', 40.00, 'Nắm vững React cơ bản', 'HTML, CSS, JavaScript cơ bản', 'BEGINNER', 'DRAFT', 'REACT001'),
(1, 'JavaScript Fundamentals', 'Học JavaScript từ đầu', '/images/js-fund.jpg', 30.00, 'Thành thạo JavaScript', 'Không yêu cầu', 'BEGINNER', 'IN_REVIEW', 'JS001'),
(1, 'HTML/CSS Basics', 'Khóa học HTML/CSS cơ bản', '/images/html-css.jpg', 20.00, 'Tạo website cơ bản', 'Không yêu cầu', 'BEGINNER', 'APPROVED', 'HTML001'),
(1, 'Python for Beginners', 'Python cho người mới', '/images/python-basic.jpg', 35.00, 'Lập trình Python cơ bản', 'Không yêu cầu', 'BEGINNER', 'PUBLISHED', 'PY001'),
(1, 'Web Development 101', 'Web development cơ bản', '/images/web101.jpg', 50.00, 'Tạo website đơn giản', 'Không yêu cầu', 'BEGINNER', 'DELETED', 'WEB001'),

-- INTERMEDIATE level courses
(2, 'React Nâng cao', 'Khóa học React nâng cao', '/images/react-adv.jpg', 60.00, 'Thành thạo React nâng cao', 'React cơ bản', 'INTERMEDIATE', 'DRAFT', 'REACT002'),
(2, 'Node.js Development', 'Xây dựng backend với Node.js', '/images/nodejs.jpg', 50.00, 'Tạo API với Node.js', 'JavaScript, Express', 'INTERMEDIATE', 'IN_REVIEW', 'NODE001'),
(2, 'Database Design', 'Thiết kế cơ sở dữ liệu', '/images/db-design.jpg', 40.00, 'Thiết kế DB chuyên nghiệp', 'SQL cơ bản', 'INTERMEDIATE', 'APPROVED', 'DB001'),
(2, 'Full Stack Development', 'Phát triển Full Stack', '/images/fullstack.jpg', 80.00, 'Full Stack Developer', 'React, Node.js', 'INTERMEDIATE', 'PUBLISHED', 'FS001'),

-- ADVANCED level courses
(3, 'React Mastery', 'Thành thạo React chuyên sâu', '/images/react-master.jpg', 70.00, 'React Expert', 'React nâng cao', 'ADVANCED', 'DRAFT', 'REACT003'),
(3, 'System Architecture', 'Kiến trúc hệ thống', '/images/arch.jpg', 60.00, 'Thiết kế hệ thống lớn', 'Kinh nghiệm 3+ năm', 'ADVANCED', 'PUBLISHED', 'ARCH001');

-- =====================================================
-- 7. UNIT - Tất cả các Status
-- =====================================================

INSERT INTO `unit` (`Title`, `Description`, `Duration`, `CourseID`, `Status`, `OrderIndex`) VALUES
-- VISIBLE units
('Unit 1: Giới thiệu', 'Giới thiệu về React', 2.00, 1, 'VISIBLE', 1),
('Unit 2: Components', 'Học về Components', 3.00, 1, 'VISIBLE', 2),
('Unit 3: State & Props', 'State và Props trong React', 4.00, 1, 'VISIBLE', 3),
-- HIDDEN units
('Unit 4: Advanced Topics', 'Chủ đề nâng cao (chưa công khai)', 5.00, 1, 'HIDDEN', 4),
-- DELETED units
('Unit 5: Old Content', 'Nội dung cũ đã xóa', 2.00, 1, 'DELETED', 5);

-- =====================================================
-- 8. LESSON - Tất cả các Type và Status
-- =====================================================

INSERT INTO `lesson` (`OrderIndex`, `Title`, `Duration`, `Type`, `FileURL`, `UnitID`, `Status`) VALUES
-- Video lessons - VISIBLE
(1, 'Video: Giới thiệu React', 15.00, 'video', '/videos/react-intro.mp4', 1, 'VISIBLE'),
(2, 'Video: Cài đặt môi trường', 10.00, 'video', '/videos/react-setup.mp4', 1, 'VISIBLE'),
-- Document lessons - VISIBLE
(3, 'Tài liệu: React Basics', 5.00, 'document', '/docs/react-basics.pdf', 2, 'VISIBLE'),
(4, 'Tài liệu: Components Guide', 8.00, 'document', '/docs/components.pdf', 2, 'VISIBLE'),
-- Audio lessons - VISIBLE
(5, 'Audio: React Podcast', 20.00, 'audio', '/audio/react-podcast.mp3', 3, 'VISIBLE'),
-- HIDDEN lessons
(6, 'Video: Advanced Patterns', 25.00, 'video', '/videos/advanced.mp4', 4, 'HIDDEN'),
-- DELETED lessons
(7, 'Video: Old Content', 10.00, 'video', '/videos/old.mp4', 5, 'DELETED');

-- =====================================================
-- 9. MATERIAL - Tất cả các Status
-- =====================================================

INSERT INTO `material` (`Title`, `FileURL`, `Status`, `CourseID`) VALUES
('Tài liệu tham khảo React', '/materials/react-ref.pdf', 'VISIBLE', 1),
('Slide bài giảng', '/materials/react-slides.pdf', 'VISIBLE', 1),
('Bài tập thực hành', '/materials/react-exercises.pdf', 'HIDDEN', 1),
('Tài liệu cũ', '/materials/old-material.pdf', 'DELETED', 1);

-- =====================================================
-- 10. ASSIGNMENT - Tất cả các Status, Type, ShowAnswersAfter
-- =====================================================

INSERT INTO `assignment` (`InstructorID`, `UnitID`, `Title`, `Description`, `Deadline`, `FileURL`, `Status`, `Type`, `ShowAnswersAfter`, `MaxDuration`, `MediaURL`) VALUES
-- Quiz assignments
(1, 1, 'Quiz: React Basics', 'Bài quiz về React cơ bản', '2025-12-31 23:59:59', '/assignments/quiz1.pdf', 'draft', 'quiz', 'after_submission', 30, NULL),
(1, 1, 'Quiz: Components', 'Bài quiz về Components', '2025-12-31 23:59:59', '/assignments/quiz2.pdf', 'published', 'quiz', 'after_deadline', 30, NULL),
(1, 2, 'Quiz: State & Props', 'Bài quiz về State và Props', '2025-12-31 23:59:59', '/assignments/quiz3.pdf', 'scheduled', 'quiz', 'never', 30, NULL),
(1, 2, 'Quiz: Advanced', 'Bài quiz nâng cao', '2025-12-31 23:59:59', '/assignments/quiz4.pdf', 'archived', 'quiz', 'after_submission', 30, NULL),
(1, 3, 'Quiz: Old Quiz', 'Bài quiz cũ', '2025-12-31 23:59:59', '/assignments/quiz5.pdf', 'deleted', 'quiz', 'after_submission', 30, NULL),

-- Audio assignments
(1, 1, 'Audio: Speaking Practice', 'Luyện nói tiếng Anh', '2025-12-31 23:59:59', NULL, 'published', 'audio', 'after_submission', 60, '/audio/speaking-practice.mp3'),

-- Video assignments
(1, 2, 'Video: Presentation', 'Quay video thuyết trình', '2025-12-31 23:59:59', NULL, 'published', 'video', 'after_deadline', 300, '/videos/presentation-guide.mp4'),

-- Document assignments
(1, 3, 'Document: Essay', 'Viết bài luận', '2025-12-31 23:59:59', '/assignments/essay-template.pdf', 'published', 'document', 'after_submission', NULL, NULL);

-- =====================================================
-- 11. QUESTION - Tất cả các Type và Level
-- =====================================================

INSERT INTO `question` (`Content`, `Type`, `CorrectAnswer`, `InstructorID`, `Status`, `Topic`, `Level`, `Point`, `Explanation`) VALUES
-- Multiple choice questions
('React là gì?', 'multiple_choice', 'A', 1, 'active', 'React Basics', 'Easy', 1, 'React là một thư viện JavaScript'),
('Component trong React là gì?', 'multiple_choice', 'B', 1, 'active', 'Components', 'Easy', 1, 'Component là đơn vị cơ bản trong React'),
('State trong React dùng để làm gì?', 'multiple_choice', 'C', 1, 'active', 'State', 'Medium', 2, 'State lưu trữ dữ liệu của component'),
('Hook là gì?', 'multiple_choice', 'D', 1, 'active', 'Hooks', 'Hard', 3, 'Hook cho phép sử dụng state trong function component'),

-- True/False questions
('React là framework?', 'true_false', 'false', 1, 'active', 'React Basics', 'Easy', 1, 'React là library, không phải framework'),
('useState là một Hook?', 'true_false', 'true', 1, 'active', 'Hooks', 'Medium', 1, 'useState là một built-in Hook'),

-- Fill in blank questions
('React được phát triển bởi ____', 'fill_in_blank', 'Facebook', 1, 'active', 'React History', 'Easy', 1, 'Facebook (nay là Meta)'),

-- Matching questions
('Nối các khái niệm với mô tả', 'matching', 'A-1,B-2,C-3', 1, 'active', 'React Concepts', 'Medium', 2, 'Matching các khái niệm'),

-- Essay questions
('Giải thích vòng đời của component trong React', 'essay', NULL, 1, 'active', 'Component Lifecycle', 'Hard', 5, 'Giải thích chi tiết lifecycle'),

-- Speaking questions
('Hãy nói về kinh nghiệm sử dụng React', 'speaking', NULL, 1, 'active', 'React Experience', 'Medium', 3, 'Trình bày bằng lời nói');

-- =====================================================
-- 12. TIMESLOT - Tất cả các Day trong tuần
-- =====================================================

INSERT INTO `timeslot` (`StartTime`, `EndTime`, `Day`) VALUES
-- Thứ Hai (T2)
('08:00:00', '10:00:00', 'T2'),
('10:00:00', '12:00:00', 'T2'),
('14:00:00', '16:00:00', 'T2'),
('18:00:00', '20:00:00', 'T2'),

-- Thứ Ba (T3)
('08:00:00', '10:00:00', 'T3'),
('10:00:00', '12:00:00', 'T3'),
('14:00:00', '16:00:00', 'T3'),
('18:00:00', '20:00:00', 'T3'),

-- Thứ Tư (T4)
('08:00:00', '10:00:00', 'T4'),
('10:00:00', '12:00:00', 'T4'),
('14:00:00', '16:00:00', 'T4'),
('18:00:00', '20:00:00', 'T4'),

-- Thứ Năm (T5)
('08:00:00', '10:00:00', 'T5'),
('10:00:00', '12:00:00', 'T5'),
('14:00:00', '16:00:00', 'T5'),
('18:00:00', '20:00:00', 'T5'),

-- Thứ Sáu (T6)
('08:00:00', '10:00:00', 'T6'),
('10:00:00', '12:00:00', 'T6'),
('14:00:00', '16:00:00', 'T6'),
('18:00:00', '20:00:00', 'T6'),

-- Thứ Bảy (T7)
('08:00:00', '10:00:00', 'T7'),
('10:00:00', '12:00:00', 'T7'),
('14:00:00', '16:00:00', 'T7'),

-- Chủ Nhật (CN)
('08:00:00', '10:00:00', 'CN'),
('10:00:00', '12:00:00', 'CN'),
('14:00:00', '16:00:00', 'CN');

-- =====================================================
-- 13. CLASS - Tất cả các Status
-- =====================================================

INSERT INTO `class` (`ZoomID`, `Zoompass`, `Status`, `CourseID`, `InstructorID`, `Name`, `Fee`, `Maxstudent`, `OpendatePlan`, `Opendate`, `EnddatePlan`, `Enddate`, `Numofsession`) VALUES
-- DRAFT classes
('12345678901', '123456', 'DRAFT', 1, 1, 'React Cơ bản - Lớp 1', 3000000.00, 30, '2025-12-01', NULL, '2026-02-28', NULL, 20),
('12345678902', '123457', 'DRAFT', 1, 1, 'React Cơ bản - Lớp 2', 3000000.00, 30, '2026-01-01', NULL, '2026-03-31', NULL, 20),

-- PENDING_APPROVAL classes
('12345678903', '123458', 'PENDING_APPROVAL', 2, 1, 'JavaScript Fundamentals - Lớp 1', 2500000.00, 25, '2025-12-15', NULL, '2026-03-15', NULL, 15),

-- APPROVED classes
('12345678904', '123459', 'APPROVED', 3, 1, 'HTML/CSS Basics - Lớp 1', 2000000.00, 20, '2025-12-20', NULL, '2026-02-20', NULL, 12),

-- OPEN (PUBLISHED) classes
('12345678905', '123460', 'OPEN', 4, 1, 'Python for Beginners - Lớp 1', 3500000.00, 35, '2026-01-05', NULL, '2026-04-05', NULL, 18),
('12345678906', '123461', 'OPEN', 4, 1, 'Python for Beginners - Lớp 2', 3500000.00, 35, '2026-01-10', NULL, '2026-04-10', NULL, 18),

-- ON_GOING classes (đã bắt đầu)
('12345678907', '123462', 'ON_GOING', 9, 2, 'Full Stack Development - Lớp 1', 5000000.00, 40, '2025-11-01', '2025-11-05', '2026-02-28', NULL, 20),
('12345678908', '123463', 'ON_GOING', 9, 2, 'Full Stack Development - Lớp 2', 5000000.00, 40, '2025-11-15', '2025-11-20', '2026-03-15', NULL, 20),

-- CLOSED classes (đã kết thúc)
('12345678909', '123464', 'CLOSED', 1, 1, 'React Cơ bản - Lớp 0 (Đã kết thúc)', 3000000.00, 30, '2025-09-01', '2025-09-05', '2025-11-30', '2025-11-28', 20),
('12345678910', '123465', 'CLOSED', 4, 1, 'Python for Beginners - Lớp 0 (Đã kết thúc)', 3500000.00, 35, '2025-08-01', '2025-08-05', '2025-10-31', '2025-10-30', 18),

-- CANCELLED classes
('12345678911', '123466', 'CANCELLED', 5, 1, 'Web Development 101 - Lớp 1 (Đã hủy)', 4000000.00, 30, '2025-10-01', NULL, '2025-12-31', NULL, 15);

-- =====================================================
-- 14. SESSION - Các session cho các lớp khác nhau
-- =====================================================

INSERT INTO `session` (`Title`, `Description`, `InstructorID`, `TimeslotID`, `ClassID`, `Date`, `ZoomUUID`) VALUES
-- Sessions cho lớp ON_GOING (ClassID = 7)
('Buổi 1: Giới thiệu', 'Giới thiệu về Full Stack Development', 2, 5, 7, '2025-11-05', 'zoom-uuid-001'),
('Buổi 2: Frontend Basics', 'Học về Frontend cơ bản', 2, 5, 7, '2025-11-12', 'zoom-uuid-002'),
('Buổi 3: Backend Basics', 'Học về Backend cơ bản', 2, 5, 7, '2025-11-19', 'zoom-uuid-003'),
('Buổi 4: Database', 'Học về Database', 2, 5, 7, '2025-11-26', 'zoom-uuid-004'),

-- Sessions cho lớp ON_GOING (ClassID = 8)
('Buổi 1: Giới thiệu', 'Giới thiệu về Full Stack Development', 2, 6, 8, '2025-11-20', 'zoom-uuid-005'),
('Buổi 2: Frontend Basics', 'Học về Frontend cơ bản', 2, 6, 8, '2025-11-27', 'zoom-uuid-006'),

-- Sessions cho lớp CLOSED (ClassID = 9)
('Buổi 1: Giới thiệu React', 'Giới thiệu về React', 1, 5, 9, '2025-09-05', 'zoom-uuid-007'),
('Buổi 2: Components', 'Học về Components', 1, 5, 9, '2025-09-12', 'zoom-uuid-008'),
('Buổi 20: Tổng kết', 'Tổng kết khóa học', 1, 5, 9, '2025-11-28', 'zoom-uuid-009');

-- =====================================================
-- 15. INSTRUCTORTIMESLOT - Tất cả các Status
-- =====================================================

INSERT INTO `instructortimeslot` (`TimeslotID`, `InstructorID`, `Date`, `Status`, `Note`) VALUES
-- Holiday (Ngày lễ)
(5, 1, '2025-12-25', 'Holiday', 'Giáng sinh'),
(5, 1, '2026-01-01', 'Holiday', 'Tết Dương lịch'),
(6, 2, '2025-12-25', 'Holiday', 'Giáng sinh'),

-- PersonalLeave (Nghỉ phép cá nhân)
(5, 1, '2025-12-10', 'PersonalLeave', 'Nghỉ phép'),
(6, 2, '2025-12-15', 'PersonalLeave', 'Nghỉ ốm'),

-- SickLeave (Nghỉ ốm)
(5, 1, '2025-12-20', 'SickLeave', 'Nghỉ ốm'),

-- Other (Khác)
(5, 1, '2025-12-30', 'Other', 'Nghỉ việc riêng');

-- =====================================================
-- 16. ENROLLMENT - Tất cả các Status
-- =====================================================

INSERT INTO `enrollment` (`EnrollmentDate`, `Status`, `LearnerID`, `ClassID`, `OrderCode`) VALUES
-- Active enrollments
('2025-10-15', 'active', 1, 7, 1000001),
('2025-10-15', 'active', 2, 7, 1000002),
('2025-10-16', 'active', 3, 7, 1000003),
('2025-10-20', 'active', 1, 8, 1000004),

-- Pending enrollments
('2025-11-01', 'pending', 2, 5, 1000005),
('2025-11-02', 'pending', 3, 5, 1000006),

-- Completed enrollments
('2025-08-15', 'completed', 1, 9, 1000007),
('2025-08-15', 'completed', 2, 9, 1000008),

-- Cancelled enrollments
('2025-10-10', 'cancelled', 3, 5, 1000009),
('2025-10-12', 'cancelled', 1, 5, 1000010);

-- =====================================================
-- 17. ATTENDANCE - Tất cả các Status
-- =====================================================

INSERT INTO `attendance` (`Status`, `Date`, `LearnerID`, `SessionID`) VALUES
-- Present (Có mặt)
('present', '2025-11-05', 1, 1),
('present', '2025-11-05', 2, 1),
('present', '2025-11-12', 1, 2),
('present', '2025-11-12', 2, 2),

-- Absent (Vắng)
('absent', '2025-11-05', 3, 1),
('absent', '2025-11-19', 2, 3),

-- Late (Đi muộn)
('late', '2025-11-12', 3, 2),
('late', '2025-11-26', 1, 4),

-- Excused (Có phép)
('excused', '2025-11-19', 1, 3),
('excused', '2025-11-26', 2, 4);

-- =====================================================
-- 18. PAYMENT - Tất cả các Status
-- =====================================================

INSERT INTO `payment` (`Amount`, `PaymentMethod`, `PaymentDate`, `EnrollmentID`, `Status`) VALUES
-- Completed payments
(3000000.00, 'bank_transfer', '2025-10-15', 1, 'completed'),
(3000000.00, 'credit_card', '2025-10-15', 2, 'completed'),
(5000000.00, 'bank_transfer', '2025-10-20', 4, 'completed'),

-- Pending payments
(3000000.00, 'bank_transfer', '2025-11-01', 5, 'pending'),
(3000000.00, 'credit_card', '2025-11-02', 6, 'pending'),

-- Failed payments
(3000000.00, 'credit_card', '2025-10-10', 9, 'failed'),
(3000000.00, 'bank_transfer', '2025-10-12', 10, 'failed'),

-- Refunded payments
(3000000.00, 'bank_transfer', '2025-10-11', 9, 'refunded');

-- =====================================================
-- 19. SUBMISSION - Tất cả các Status
-- =====================================================

INSERT INTO `submission` (`SubmissionDate`, `FileURL`, `Score`, `Feedback`, `LearnerID`, `AssignmentID`, `Content`, `AudioURL`, `DurationSec`, `Status`) VALUES
-- Submitted (Đã nộp)
('2025-11-10', '/submissions/sub1.pdf', 8.5, 'Tốt', 1, 2, NULL, NULL, NULL, 'submitted'),
('2025-11-11', '/submissions/sub2.pdf', 9.0, 'Rất tốt', 2, 2, NULL, NULL, NULL, 'submitted'),
('2025-11-12', '/submissions/sub3.pdf', 7.5, 'Cần cải thiện', 3, 2, NULL, NULL, NULL, 'submitted'),

-- Late (Nộp muộn)
('2025-11-15', '/submissions/sub4.pdf', 6.0, 'Nộp muộn, điểm bị trừ', 1, 3, NULL, NULL, NULL, 'late'),
('2025-11-16', '/submissions/sub5.pdf', 7.0, 'Nộp muộn', 2, 3, NULL, NULL, NULL, 'late'),

-- Not submitted (Chưa nộp)
('2025-11-20', NULL, NULL, 'Chưa nộp bài', 3, 3, NULL, NULL, NULL, 'not_submitted');

-- =====================================================
-- 20. SUBMISSION_ASSET - Tất cả các Kind
-- =====================================================

INSERT INTO `submission_asset` (`SubmissionID`, `Kind`, `FileURL`) VALUES
-- Audio assets
(1, 'audio', '/assets/audio1.mp3'),
(2, 'audio', '/assets/audio2.mp3'),

-- Video assets
(1, 'video', '/assets/video1.mp4'),
(2, 'video', '/assets/video2.mp4'),

-- Document assets
(1, 'doc', '/assets/doc1.pdf'),
(2, 'doc', '/assets/doc2.pdf'),

-- Image assets
(1, 'image', '/assets/image1.jpg'),
(2, 'image', '/assets/image2.jpg'),

-- Other assets
(1, 'other', '/assets/other1.zip');

-- =====================================================
-- 21. EXAM - Các Status khác nhau
-- =====================================================

INSERT INTO `exam` (`CourseID`, `Title`, `Description`, `StartTime`, `EndTime`, `Status`) VALUES
(1, 'Kiểm tra giữa kỳ', 'Bài kiểm tra giữa kỳ React', '2025-12-15 09:00:00', '2025-12-15 11:00:00', 'scheduled'),
(1, 'Kiểm tra cuối kỳ', 'Bài kiểm tra cuối kỳ React', '2026-01-15 09:00:00', '2026-01-15 11:00:00', 'upcoming'),
(1, 'Kiểm tra đã hoàn thành', 'Bài kiểm tra đã làm xong', '2025-11-15 09:00:00', '2025-11-15 11:00:00', 'completed'),
(1, 'Kiểm tra đã hủy', 'Bài kiểm tra bị hủy', '2025-10-15 09:00:00', '2025-10-15 11:00:00', 'cancelled');

-- =====================================================
-- 22. CERTIFICATE - Các Status khác nhau
-- =====================================================

INSERT INTO `certificate` (`Title`, `FileURL`, `InstructorID`, `Status`) VALUES
('Chứng chỉ React Cơ bản', '/certificates/react-basic.pdf', 1, 'issued'),
('Chứng chỉ JavaScript', '/certificates/js.pdf', 1, 'issued'),
('Chứng chỉ đang xử lý', '/certificates/pending.pdf', 1, 'pending'),
('Chứng chỉ đã hủy', '/certificates/cancelled.pdf', 1, 'cancelled');

-- =====================================================
-- 23. INSTRUCTORREVIEW - Các Status khác nhau
-- =====================================================

INSERT INTO `instructorreview` (`Comment`, `ReviewDate`, `Status`, `InstructorID`, `LearnerID`) VALUES
('Giảng viên rất nhiệt tình và dễ hiểu', '2025-11-20', 'published', 1, 1),
('Khóa học rất hay, giảng viên chuyên nghiệp', '2025-11-21', 'published', 1, 2),
('Đánh giá đang chờ duyệt', '2025-11-22', 'pending', 2, 1),
('Đánh giá đã bị từ chối', '2025-11-23', 'rejected', 2, 2);

-- =====================================================
-- 24. NEWS - Các Status khác nhau
-- =====================================================

INSERT INTO `news` (`Title`, `Content`, `PostedDate`, `Status`, `StaffID`) VALUES
('Tin tức đã xuất bản', 'Nội dung tin tức đã xuất bản', '2025-11-01 10:00:00', 'published', 1),
('Tin tức đang chờ duyệt', 'Nội dung tin tức chờ duyệt', '2025-11-02 10:00:00', 'pending', 1),
('Tin tức đã bị từ chối', 'Nội dung tin tức bị từ chối', '2025-11-03 10:00:00', 'rejected', 1),
('Tin tức đã xóa', 'Nội dung tin tức đã xóa', '2025-11-04 10:00:00', 'deleted', 1);

-- =====================================================
-- 25. NOTIFICATION - Các Status khác nhau
-- =====================================================

INSERT INTO `notification` (`Content`, `Type`, `Status`, `AccID`) VALUES
('Bạn có lớp học mới', 'class_assigned', 'unread', 4),
('Bạn có bài tập mới', 'assignment_new', 'read', 4),
('Lớp học của bạn đã bắt đầu', 'class_started', 'unread', 4),
('Thông báo đã xóa', 'other', 'deleted', 4);

-- =====================================================
-- 26. PROMOTION - Các Status khác nhau
-- =====================================================

INSERT INTO `promotion` (`Code`, `Discount`, `StartDate`, `EndDate`, `CreateBy`, `Status`) VALUES
('SUMMER2025', 20.00, '2025-06-01', '2025-08-31', 1, 'active'),
('WINTER2025', 15.00, '2025-12-01', '2025-12-31', 1, 'active'),
('SPRING2026', 25.00, '2026-03-01', '2026-05-31', 1, 'inactive'),
('OLD2024', 10.00, '2024-01-01', '2024-12-31', 1, 'expired');

-- =====================================================
-- 27. REFUNDREQUEST - Các Status khác nhau
-- =====================================================

INSERT INTO `refundrequest` (`RequestDate`, `Reason`, `Status`, `EnrollmentID`) VALUES
('2025-10-11', 'Không thể tham gia lớp học', 'pending', 9),
('2025-10-12', 'Lịch học không phù hợp', 'approved', 10),
('2025-10-13', 'Lý do không hợp lệ', 'rejected', 8),
('2025-10-14', 'Đã hoàn tiền', 'completed', 10);

-- =====================================================
-- 28. SURVEY - Các Status khác nhau
-- =====================================================

INSERT INTO `survey` (`Title`, `Description`, `Status`, `StaffID`) VALUES
('Khảo sát chất lượng khóa học', 'Khảo sát về chất lượng khóa học', 'published', 1),
('Khảo sát đang chờ duyệt', 'Khảo sát chờ duyệt', 'pending', 1),
('Khảo sát đã đóng', 'Khảo sát đã kết thúc', 'closed', 1),
('Khảo sát đã xóa', 'Khảo sát đã bị xóa', 'deleted', 1);

-- =====================================================
-- 29. ASSIGNMENT_QUESTION - Liên kết Assignment và Question
-- =====================================================

INSERT INTO `assignment_question` (`QuestionID`, `AssignmentID`) VALUES
(1, 2),  -- Quiz: Components - Câu hỏi 1
(2, 2),  -- Quiz: Components - Câu hỏi 2
(3, 3),  -- Quiz: State & Props - Câu hỏi 3
(4, 3);  -- Quiz: State & Props - Câu hỏi 4

-- =====================================================
-- 30. EXAMQUESTION - Liên kết Exam và Question
-- =====================================================

INSERT INTO `examquestion` (`ExamID`, `QuestionID`) VALUES
(1, 1),  -- Kiểm tra giữa kỳ - Câu hỏi 1
(1, 2),  -- Kiểm tra giữa kỳ - Câu hỏi 2
(1, 3),  -- Kiểm tra giữa kỳ - Câu hỏi 3
(2, 4),  -- Kiểm tra cuối kỳ - Câu hỏi 4
(2, 5);  -- Kiểm tra cuối kỳ - Câu hỏi 5

-- =====================================================
-- 31. QUESTION_OPTION - Options cho Multiple Choice Questions
-- =====================================================

INSERT INTO `question_option` (`QuestionID`, `Content`, `IsCorrect`) VALUES
-- Options cho câu hỏi 1 (React là gì?)
(1, 'Một thư viện JavaScript', 1),
(1, 'Một framework JavaScript', 0),
(1, 'Một ngôn ngữ lập trình', 0),
(1, 'Một database', 0),

-- Options cho câu hỏi 2 (Component trong React là gì?)
(2, 'Một function', 0),
(2, 'Đơn vị cơ bản trong React', 1),
(2, 'Một biến', 0),
(2, 'Một object', 0);

-- =====================================================
-- 32. ACCOUNTFEATURE - Liên kết Account và Feature
-- =====================================================

-- Tạo features trước
INSERT INTO `feature` (`Name`, `Description`, `URL`) VALUES
('Quản lý lớp học', 'Quản lý các lớp học', '/classes'),
('Quản lý khóa học', 'Quản lý các khóa học', '/courses'),
('Quản lý học viên', 'Quản lý học viên', '/learners'),
('Báo cáo', 'Xem báo cáo', '/reports');

-- Gán features cho accounts
INSERT INTO `accountfeature` (`AccountID`, `FeatureID`) VALUES
(1, 1),  -- Admin có tất cả features
(1, 2),
(1, 3),
(1, 4),
(2, 1),  -- Instructor có quản lý lớp học
(2, 2);  -- Instructor có quản lý khóa học

-- =====================================================
-- 33. PARENT - Phụ huynh
-- =====================================================

INSERT INTO `parent` (`FullName`, `DateOfBirth`, `ProfilePicture`, `Job`, `Address`, `AccID`) VALUES
('Phụ huynh 1', '1975-05-10', '/uploads/parent1.jpg', 'Kinh doanh', '123 Parent St', 8),
('Phụ huynh 2', '1980-08-15', '/uploads/parent2.jpg', 'Giáo viên', '456 Parent Ave', 9);

-- Liên kết phụ huynh với học viên
INSERT INTO `parentlearner` (`LearnerID`, `ParentID`) VALUES
(1, 1),  -- Learner 1 - Parent 1
(2, 2);  -- Learner 2 - Parent 2

-- =====================================================
-- 34. LOG - Các log mẫu
-- =====================================================

INSERT INTO `log` (`Action`, `Timestamp`, `AccID`, `Detail`) VALUES
('CREATE_CLASS', '2025-11-01 10:00:00', 1, 'Tạo lớp học mới'),
('UPDATE_CLASS', '2025-11-02 11:00:00', 1, 'Cập nhật lớp học'),
('DELETE_CLASS', '2025-11-03 12:00:00', 1, 'Xóa lớp học'),
('ENROLL', '2025-10-15 09:00:00', 4, 'Đăng ký lớp học'),
('CANCEL_ENROLLMENT', '2025-10-10 10:00:00', 6, 'Hủy đăng ký');

-- =====================================================
-- 35. NOTE - Ghi chú
-- =====================================================

INSERT INTO `note` (`AccID`, `Content`, `FileURL`) VALUES
(4, 'Ghi chú bài học React', '/notes/note1.pdf'),
(5, 'Ghi chú bài học JavaScript', '/notes/note2.pdf'),
(6, 'Ghi chú bài học HTML/CSS', '/notes/note3.pdf');

-- =====================================================
-- KẾT THÚC
-- =====================================================

SELECT 'Sample data inserted successfully!' as result;
SELECT 'Total records inserted:' as summary;
SELECT 
  (SELECT COUNT(*) FROM account) as accounts,
  (SELECT COUNT(*) FROM instructor) as instructors,
  (SELECT COUNT(*) FROM learner) as learners,
  (SELECT COUNT(*) FROM course) as courses,
  (SELECT COUNT(*) FROM class) as classes,
  (SELECT COUNT(*) FROM session) as sessions,
  (SELECT COUNT(*) FROM enrollment) as enrollments,
  (SELECT COUNT(*) FROM assignment) as assignments,
  (SELECT COUNT(*) FROM question) as questions,
  (SELECT COUNT(*) FROM timeslot) as timeslots;

