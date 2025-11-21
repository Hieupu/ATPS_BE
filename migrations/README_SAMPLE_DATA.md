# Hướng dẫn Sử dụng Dữ liệu Mẫu - dbver5

## 📋 Tổng quan

File `sample_data_dbver5.sql` chứa dữ liệu mẫu cho **TẤT CẢ** các trường hợp có thể xảy ra trong database dbver5, bao gồm:

- ✅ Tất cả các giá trị ENUM có thể có
- ✅ Tất cả các Status có thể có ở mỗi bảng
- ✅ Dữ liệu mẫu đầy đủ cho tất cả các bảng
- ✅ Các trường hợp edge cases

---

## 🚀 Cách sử dụng

### Bước 1: Tạo Database Schema

Chạy script tạo database trước:

```bash
mysql -u root -p < config/dbver5.md
```

Hoặc mở file `config/dbver5.md` trong MySQL Workbench và chạy.

### Bước 2: Chạy Migration (nếu cần)

Nếu database chưa có các cột mới của dbver5:

```bash
mysql -u root -p atps < migrations/migrate_to_dbver5.sql
```

### Bước 3: Chèn Dữ liệu Mẫu

```bash
mysql -u root -p atps < migrations/sample_data_dbver5.sql
```

Hoặc mở file `migrations/sample_data_dbver5.sql` trong MySQL Workbench và chạy.

---

## 📊 Dữ liệu Mẫu Bao gồm

### 1. Account (10 records)

- ✅ Status: `active`, `inactive`, `suspended`, `pending`
- ✅ Gender: `male`, `female`, `other`
- ✅ Provider: `local`, `google`, `facebook`

### 2. Instructor (3 records)

- ✅ Type: `fulltime` (2), `parttime` (1)

### 3. Course (11 records)

- ✅ Level: `BEGINNER` (5), `INTERMEDIATE` (4), `ADVANCED` (2)
- ✅ Status: `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `DELETED`

### 4. Unit (5 records)

- ✅ Status: `VISIBLE` (3), `HIDDEN` (1), `DELETED` (1)

### 5. Lesson (7 records)

- ✅ Type: `video` (3), `document` (2), `audio` (1)
- ✅ Status: `VISIBLE` (5), `HIDDEN` (1), `DELETED` (1)

### 6. Material (4 records)

- ✅ Status: `VISIBLE` (2), `HIDDEN` (1), `DELETED` (1)

### 7. Assignment (8 records)

- ✅ Status: `draft`, `published`, `scheduled`, `archived`, `deleted`
- ✅ Type: `quiz`, `audio`, `video`, `document`
- ✅ ShowAnswersAfter: `after_submission`, `after_deadline`, `never`

### 8. Question (10 records)

- ✅ Type: `multiple_choice`, `true_false`, `fill_in_blank`, `matching`, `essay`, `speaking`
- ✅ Level: `Easy`, `Medium`, `Hard`
- ✅ Status: `active`

### 9. Timeslot (27 records)

- ✅ Day: `T2`, `T3`, `T4`, `T5`, `T6`, `T7`, `CN` (tất cả các thứ trong tuần)
- ✅ Các ca học: 8h-10h, 10h-12h, 14h-16h, 18h-20h

### 10. Class (11 records)

- ✅ Status: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `OPEN`, `ON_GOING`, `CLOSED`, `CANCELLED`
- ✅ Các trường hợp:
  - Lớp chưa bắt đầu (Opendate = NULL)
  - Lớp đang học (Opendate có giá trị, Enddate = NULL)
  - Lớp đã kết thúc (Opendate và Enddate đều có giá trị)

### 11. Session (9 records)

- ✅ Sessions cho các lớp `ON_GOING` và `CLOSED`
- ✅ Các ngày khác nhau trong tuần

### 12. InstructorTimeslot (7 records)

- ✅ Status: `Holiday`, `PersonalLeave`, `SickLeave`, `Other`
- ✅ Các ngày lễ và nghỉ phép

### 13. Enrollment (10 records)

- ✅ Status: `active`, `pending`, `completed`, `cancelled`

### 14. Attendance (10 records)

- ✅ Status: `present`, `absent`, `late`, `excused`

### 15. Payment (7 records)

- ✅ Status: `completed`, `pending`, `failed`, `refunded`
- ✅ PaymentMethod: `bank_transfer`, `credit_card`

### 16. Submission (6 records)

- ✅ Status: `submitted`, `late`, `not_submitted`

### 17. Submission_Asset (9 records)

- ✅ Kind: `audio`, `video`, `doc`, `image`, `other`

### 18. Exam (4 records)

- ✅ Status: `scheduled`, `upcoming`, `completed`, `cancelled`

### 19. Certificate (4 records)

- ✅ Status: `issued`, `pending`, `cancelled`

### 20. InstructorReview (4 records)

- ✅ Status: `published`, `pending`, `rejected`

### 21. News (4 records)

- ✅ Status: `published`, `pending`, `rejected`, `deleted`

### 22. Notification (4 records)

- ✅ Status: `unread`, `read`, `deleted`
- ✅ Type: `class_assigned`, `assignment_new`, `class_started`, `other`

### 23. Promotion (4 records)

- ✅ Status: `active`, `inactive`, `expired`

### 24. RefundRequest (4 records)

- ✅ Status: `pending`, `approved`, `rejected`, `completed`

### 25. Survey (4 records)

- ✅ Status: `published`, `pending`, `closed`, `deleted`

### 26. Các bảng liên kết

- ✅ `assignment_question` - Liên kết Assignment và Question
- ✅ `examquestion` - Liên kết Exam và Question
- ✅ `question_option` - Options cho Multiple Choice Questions
- ✅ `accountfeature` - Liên kết Account và Feature
- ✅ `parentlearner` - Liên kết Parent và Learner

---

## 🎯 Các Trường hợp Đặc biệt

### 1. Class Status Flow

```
DRAFT → PENDING_APPROVAL → APPROVED → OPEN → ON_GOING → CLOSED
         ↓                    ↓           ↓
      CANCELLED          CANCELLED    CANCELLED
```

**Dữ liệu mẫu bao gồm:**

- ✅ Lớp ở trạng thái `DRAFT` (chưa gửi duyệt)
- ✅ Lớp ở trạng thái `PENDING_APPROVAL` (đang chờ duyệt)
- ✅ Lớp ở trạng thái `APPROVED` (đã duyệt, chưa publish)
- ✅ Lớp ở trạng thái `OPEN` (đã publish, đang tuyển sinh)
- ✅ Lớp ở trạng thái `ON_GOING` (đã bắt đầu học)
- ✅ Lớp ở trạng thái `CLOSED` (đã kết thúc)
- ✅ Lớp ở trạng thái `CANCELLED` (đã hủy)

### 2. Session với Opendate/Enddate

**Lớp ON_GOING:**

- `OpendatePlan`: Ngày dự kiến
- `Opendate`: Ngày thực tế (đã có giá trị)
- `EnddatePlan`: Ngày dự kiến kết thúc
- `Enddate`: NULL (chưa kết thúc)

**Lớp CLOSED:**

- `OpendatePlan`: Ngày dự kiến
- `Opendate`: Ngày thực tế
- `EnddatePlan`: Ngày dự kiến kết thúc
- `Enddate`: Ngày thực tế kết thúc (đã có giá trị)

### 3. Instructor Leave

**Các loại nghỉ:**

- `Holiday`: Ngày lễ (Giáng sinh, Tết)
- `PersonalLeave`: Nghỉ phép cá nhân
- `SickLeave`: Nghỉ ốm
- `Other`: Lý do khác

### 4. Enrollment Status

**Các trạng thái:**

- `active`: Đang học
- `pending`: Chờ xử lý
- `completed`: Đã hoàn thành
- `cancelled`: Đã hủy

### 5. Payment Status

**Các trạng thái:**

- `completed`: Đã thanh toán
- `pending`: Chờ thanh toán
- `failed`: Thanh toán thất bại
- `refunded`: Đã hoàn tiền

---

## 🔍 Kiểm tra Dữ liệu

Sau khi chèn dữ liệu, kiểm tra bằng các query sau:

```sql
-- Kiểm tra số lượng records
SELECT 'Accounts' as table_name, COUNT(*) as count FROM account
UNION ALL
SELECT 'Instructors', COUNT(*) FROM instructor
UNION ALL
SELECT 'Learners', COUNT(*) FROM learner
UNION ALL
SELECT 'Courses', COUNT(*) FROM course
UNION ALL
SELECT 'Classes', COUNT(*) FROM class
UNION ALL
SELECT 'Sessions', COUNT(*) FROM session
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollment;

-- Kiểm tra Class Status
SELECT Status, COUNT(*) as count
FROM class
GROUP BY Status;

-- Kiểm tra Course Level và Status
SELECT Level, Status, COUNT(*) as count
FROM course
GROUP BY Level, Status;

-- Kiểm tra Assignment Status và Type
SELECT Status, Type, COUNT(*) as count
FROM assignment
GROUP BY Status, Type;
```

---

## ⚠️ Lưu ý

1. **Foreign Keys**: Dữ liệu được chèn theo thứ tự để đảm bảo foreign keys hợp lệ
2. **Dates**: Các ngày được set trong tương lai để dễ test
3. **Passwords**: Tất cả passwords đều là placeholder, cần hash thật trong production
4. **File URLs**: Tất cả file URLs đều là placeholder, cần thay bằng URLs thật

---

## 🔄 Reset Database

Nếu muốn reset và chèn lại dữ liệu:

```sql
-- Xóa tất cả dữ liệu (cẩn thận!)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE account;
TRUNCATE TABLE instructor;
TRUNCATE TABLE learner;
-- ... (truncate tất cả các bảng)
SET FOREIGN_KEY_CHECKS = 1;

-- Sau đó chạy lại sample_data_dbver5.sql
```

---

## 📝 Customization

Bạn có thể chỉnh sửa file `sample_data_dbver5.sql` để:

- Thêm dữ liệu mẫu cho các trường hợp đặc biệt
- Thay đổi dates để phù hợp với nhu cầu test
- Thêm nhiều records hơn cho các bảng quan trọng

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-XX  
**Database Version**: dbver5
