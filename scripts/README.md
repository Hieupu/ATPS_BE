# Test Suite Documentation

## Mô tả

File test `testClassNewsSession.test.js` chứa các test cases cho các chức năng chính:

1. **Tạo lớp (Class Creation)**

   - Tạo lớp thành công với đầy đủ thông tin
   - Validation khi thiếu thông tin bắt buộc
   - Validation khi InstructorID/CourseID không tồn tại

2. **Tạo tin tức (News Creation)**

   - Tạo tin tức thành công
   - Validation khi thiếu Title/Content/StaffID
   - Validation khi StaffID không tồn tại

3. **Tạo từng session (Single Session Creation)**

   - Tạo session thành công
   - Validation khi ClassID/TimeslotID không tồn tại
   - Validation khi Date không khớp với Day của Timeslot

4. **Tạo lịch học hàng loạt (Bulk Sessions Creation)**

   - Tạo nhiều sessions thành công
   - Xử lý khi một số sessions bị conflict
   - Validation khi không có dữ liệu

5. **Các hàm validation**

   - `validateDateDayConsistency`: Kiểm tra Date có khớp với Day của Timeslot
   - `validateInstructorLeave`: Kiểm tra lịch nghỉ của giảng viên
   - `validateSessionData`: Validation tổng hợp
   - `getDayOfWeek`: Chuyển đổi Date sang Day

6. **Validation số buổi dự kiến (Numofsession)**
   - Kiểm tra khi đã đủ số buổi dự kiến

## Cách chạy tests

### Chạy tất cả tests

```bash
npm test
```

### Chạy test cụ thể

```bash
npm run test:class-news-session
```

### Chạy test với watch mode

```bash
npm run test:watch
```

### Chạy test với coverage

```bash
npm run test:coverage
```

## Lưu ý

- Tests sẽ tự động tạo và cleanup dữ liệu test
- Đảm bảo database connection đã được cấu hình đúng trong `config/db.js`
- Tests sử dụng dữ liệu thật từ database, vì vậy cần cẩn thận khi chạy trên môi trường production

## Cấu trúc test

- `beforeAll`: Setup dữ liệu test (instructor, course, staff, timeslot)
- `afterAll`: Cleanup dữ liệu test đã tạo
- Mỗi test case độc lập và có thể chạy riêng lẻ
