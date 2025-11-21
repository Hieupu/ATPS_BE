# Migration Scripts - dbver5

## Vấn đề

Database hiện tại có thể chưa có các cột mới từ dbver5:
- `timeslot.Day` - Thứ trong tuần
- `class.ZoomID`, `class.Zoompass` - Thông tin Zoom
- `class.OpendatePlan`, `class.Opendate`, `class.EnddatePlan`, `class.Enddate` - Ngày bắt đầu/kết thúc
- `class.Numofsession`, `class.Maxstudent` - Số buổi và sĩ số
- `session.ZoomUUID` - UUID phòng Zoom
- `instructor.Type` - Loại giảng viên

## Giải pháp

### Cách 1: Chạy Migration Script (Khuyến nghị)

1. Chạy script SQL để thêm các cột mới:

```bash
# Sử dụng MySQL Workbench hoặc MySQL CLI
mysql -u your_username -p atps < migrations/add_day_to_timeslot.sql
```

Hoặc chạy từng script trong MySQL Workbench.

### Cách 2: Code tự động xử lý (Đã implement)

Code đã được cập nhật để:
- Tự động kiểm tra xem cột có tồn tại không
- Nếu không có, trả về `NULL` cho các trường mới
- Không gây lỗi khi cột chưa tồn tại

**Lưu ý**: Cách này chỉ là tạm thời. Bạn vẫn nên chạy migration script để có đầy đủ tính năng.

## Migration Scripts

### 1. `add_day_to_timeslot.sql`
Thêm cột `Day` vào bảng `timeslot`.

### 2. `add_dbver5_columns.sql` (Cần tạo)
Thêm tất cả các cột mới của dbver5.

## Cách chạy Migration

### Option 1: MySQL Workbench
1. Mở MySQL Workbench
2. Kết nối với database `atps`
3. Mở file migration script
4. Chạy script (Ctrl+Shift+Enter)

### Option 2: MySQL CLI
```bash
mysql -u root -p atps < migrations/add_day_to_timeslot.sql
```

### Option 3: Node.js Script (Có thể tạo)
```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'atps'
  });

  const sql = fs.readFileSync('migrations/add_day_to_timeslot.sql', 'utf8');
  await connection.query(sql);
  await connection.end();
  
  console.log('Migration completed!');
}

runMigration();
```

## Kiểm tra Migration

Sau khi chạy migration, kiểm tra bằng:

```sql
-- Kiểm tra cột Day trong timeslot
DESCRIBE timeslot;

-- Hoặc
SHOW COLUMNS FROM timeslot LIKE 'Day';
```

## Rollback (Nếu cần)

Nếu cần rollback, chạy:

```sql
ALTER TABLE timeslot DROP COLUMN IF EXISTS Day;
```

---

**Lưu ý**: 
- Backup database trước khi chạy migration
- Test trên môi trường dev trước
- Kiểm tra kỹ các ràng buộc (constraints) trước khi xóa cột

