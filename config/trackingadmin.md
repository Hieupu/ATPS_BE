| Function/Screen                         | Non-UI | Feature                            | Sub Feature | Function/Screen Description (Tiếng Việt)                                                                                       |
| --------------------------------------- | ------ | ---------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Create a staff/admin/instructor Account | Screen | User Management Feature            |             | Admin tạo thủ công tài khoản nhân viên / quản trị viên / giảng viên.                                                           |
| Update User                             | Screen | User Management Feature            |             | Admin thay đổi vai trò, quyền hạn, trạng thái… của người dùng.                                                                 |
| View List of Users                      | Screen | User Management Feature            |             | Admin xem danh sách toàn bộ người dùng trong hệ thống.                                                                         |
| Add Instructor Leave                    | Screen | User Management Feature            |             | Admin thêm lịch nghỉ (instructortimeslot) cho giảng viên.                                                                      |
| View Instructor Calendar                | Screen | User Management Feature            |             | Admin xem lịch tổng hợp của một giảng viên, bao gồm buổi dạy (session) và buổi nghỉ (instructortimeslot).                      |
| Website Content Management              | Screen | Website Content Management Feature |             | Admin quản lý và cập nhật nội dung hiển thị công khai trên website.                                                            |
| View Payment History                    | Screen | Finance & Reporting Feature        |             | Admin xem lịch sử giao dịch và hóa đơn.                                                                                        |
| Process Refund                          | Screen | Finance & Reporting Feature        |             | Admin xử lý hoặc từ chối yêu cầu hoàn tiền của học viên.                                                                       |
| Create/Update Promotion/Discount        | Screen | Finance & Reporting Feature        |             | Admin tạo hoặc chỉnh sửa các chiến dịch khuyến mãi / mã giảm giá.                                                              |
| Instructor Payroll Report               | Screen | Finance & Reporting Feature        |             | Tạo báo cáo lương dựa trên số buổi dạy đã hoàn thành (Date < NOW()) của từng giảng viên.                                       |
| Create Class Wizard                     | Screen | Class & Schedule Management        |             | Admin tạo lớp học mới, thiết lập thông tin cơ bản (khóa học, giảng viên, học phí, trạng thái…).                                |
| Bulk Schedule Wizard                    | Screen | Class & Schedule Management        |             | Admin chọn lịch cố định (vd: T3 19h–22h, T5 19h–22h) từ bảng timeslot để tự động tạo toàn bộ session của lớp.                  |
| Reschedule Session                      | Screen | Class & Schedule Management        |             | Màn hình UI để dời lịch một buổi học.                                                                                          |
| Cancel Session                          | Screen | Class & Schedule Management        |             | Admin hủy một buổi học. Hệ thống tự động kích hoạt chức năng “Tìm buổi học bù” để thêm buổi bù vào cuối lịch học.              |
| Find Make-up Slot                       | Screen | Class & Schedule Management        |             | Admin tìm buổi học bù. Hệ thống gợi ý slot trống dựa trên lịch của giảng viên nhằm tránh phải kiểm tra nhiều học viên một lúc. |
| View Class Roster                       | Screen | Class & Schedule Management        |             | Admin xem danh sách học viên hiện đang đăng ký trong một ClassID.                                                              |
| Class Edit Screen                       | Screen | Class & Schedule Management        |             | Màn hình chi tiết/chỉnh sửa thông tin lớp (gán giảng viên, chỉnh học phí…).                                                    |
| Manage System Timeslots                 | Screen | System Config                      |             | Admin định nghĩa bảng timeslot tổng (ví dụ: “T2 9–10h”, “T2 10–11h”). Bulk Schedule Wizard phụ thuộc vào phần này.             |
| Manage Payment Gateways                 | Screen | System Config                      |             | Admin cấu hình API key và thiết lập cho cổng thanh toán VNPAY, MOMO…                                                           |
| Manage Notification Templates           | Screen | System Config                      |             | Admin chỉnh sửa template email/tin nhắn thông báo của hệ thống (ví dụ: “Hoàn tiền thành công”, “Hủy lớp học”).                 |
| View Courses                            | Screen | Course & Content Management        |             | Admin xem danh sách các khóa học được giảng viên gửi lên.                                                                      |
| Approve Courses                         | Screen | Course & Content Management        |             | Admin thay đổi trạng thái phê duyệt khóa học mà giảng viên gửi lên.                                                            |

Trong fe phần sidebar sửa lại:
Thông tin chung (droplist có quản lý tin tức(news,...))
Thống kê(droplist có Doanh thu, học viên,lớp học, nhân viên (gồm role staff và instructor))
Quản lý người dùng (droplist có quản lý học sinh, quản lý giảng viên, quản lý nhân viên,quản lý admin)
Hệ thống (quản lý cổng thanh toán, quản lý mẫu gửi mail,quản lý ca học(để thêm sửa xóa timeslot))
...
...
...
và một số yêu cầu để phù hợp với tracking
(tracking có thể đang mô tả chung chung nhưng cũng là khung chính của phần admin)
