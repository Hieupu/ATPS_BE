## ATPS Backend – Ghi chú đồng bộ Schema và Logic (Tiếng Việt)

Backend đã được cập nhật để khớp với schema MySQL mới. Dưới đây là tóm tắt ngắn gọn: thay đổi gì, ở đâu trong code, và cách hoạt động end‑to‑end.

### 1) Đồng bộ tên trường (DB ⇄ API)

- course.Fee → xuất ra FE dưới tên TuitionFee
  - Repository trả về `COALESCE(c.Fee, 0) as TuitionFee` để FE không phải đổi code.
  - File liên quan:
    - `repositories/courseRepository.js` (all listing/detail queries)
    - `repositories/instructorRepository.js` (instructor course list)
- class.Name → xuất ra FE dưới tên ClassName
  - Dùng alias `cl.Name as ClassName` ở các truy vấn.
  - File:
    - `repositories/courseRepository.js`
    - `repositories/scheduleRepository.js`
    - `repositories/attendanceRepository.js`

### 2) Thay đổi cấu trúc Session/Timeslot

- Bỏ bảng trung gian sessiontimeslot. `session` giữ trực tiếp `TimeslotID` và `Date`.
  - Đọc: JOIN `session` → `timeslot` theo `TimeslotID`.
  - Ghi: khi đặt lịch 1‑1, tạo `timeslot` trước, sau đó tạo `session` gắn `TimeslotID` + `Date`.
  - File:
    - `repositories/scheduleRepository.js`
    - `services/scheduleService.js` (formatting responses)

`timeslot` có `StartTime`, `EndTime`, `Day` (thứ trong tuần). `session` giữ `Date` (ngày cụ thể).

### 3) Tham chiếu Attendance

- `attendance` tham chiếu trực tiếp `SessionID` (không còn `sessiontimeslotID`).
  - File:
    - `repositories/attendanceRepository.js` (all queries updated)
    - `repositories/progressRepository.js` (joins rewritten to use SessionID)

### 4) Điều chỉnh luồng thanh toán

- Số tiền đọc từ `COALESCE(class.Fee, course.Fee)`.
- FE gửi `classID`; server tạo `Enrollment` ở trạng thái Pending trước khi tạo link PayOS.
- `orderCode` = `EnrollmentID` (dễ đối soát và idempotent).
  - File: `controllers/paymentController.js`

### 5) Tránh NaN bằng giá trị mặc định

- Tất cả fee dùng `COALESCE(..., 0)` để luôn ra số.
- API luôn surface `TuitionFee`.
  - File: repository course/instructor

### 6) Luồng đặt lịch 1‑1 (Booking)

1. FE gọi `GET /schedule/instructor/:id/available-slots` → hiển thị slot (Day + StartTime + EndTime).
2. FE gọi `POST /schedule/booking` với `{ LearnerID, InstructorID, Title, Description, StartTime, EndTime, Date? }`.
   - Backend cho phép thiếu `Date` và tự điền ngày hôm nay nếu FE không gửi.
3. Repository thực hiện:
   - Tạo class 1‑1 (status 'active').
   - Enroll học viên (status 'Enrolled').
   - Tạo timeslot (Start/End/Day).
   - Tạo session gắn TimeslotID và Date.
4. API trả `{ SessionID, ClassID, EnrollmentID, TimeslotID }`.

### 7) Endpoint bị ảnh hưởng (chính)

- Courses
  - `GET /courses` – `TuitionFee` lấy từ `Fee`.
  - `GET /courses/:id` – chi tiết kèm `TuitionFee`, thông tin giảng viên, units, reviews.
  - `GET /courses/:id/classes` – trả `ClassName` (alias).
- Schedule
  - `GET /schedule/learner/:learnerId` – trả `Date`, `StartTime`, `EndTime`.
  - `GET /schedule/instructor/:instructorId`
  - `GET /schedule/session/:sessionId` – trả một object `Timeslot` (không phải mảng).
  - `POST /schedule/booking` – tạo booking 1‑1.
- Payment
  - `POST /payment/create-link` – tạo Enrollment(Pending), trả checkoutURL, `orderCode = EnrollmentID`.
  - `POST /payment/update-status` – cập nhật `Enrolled` khi thanh toán thành công.

### 8) File chính liên quan schema mới

- `repositories/courseRepository.js`
- `repositories/instructorRepository.js`
- `repositories/scheduleRepository.js`
- `repositories/attendanceRepository.js`
- `repositories/progressRepository.js`
- `controllers/paymentController.js`
- `services/scheduleService.js`

### 9) Giả định/Invariants

- `Fee` có thể NULL; API luôn trả `TuitionFee` dạng số.
- `Class.Name` tồn tại; alias `ClassName` để giữ FE không phải đổi.
- `Date` là bắt buộc với DB; backend sẽ tự điền nếu FE không gửi.

### 10) Checklist test nhanh

- Danh sách/chi tiết khóa học hiển thị `TuitionFee` không bị NaN.
- Lớp học hiển thị `ClassName` đúng.
- Lịch học hiển thị `formattedDate` + `timeRange`.
- Booking trả 201 kèm các ID.
- Thanh toán tạo được link và cập nhật Enrollment sang `Enrolled` khi thành công.
