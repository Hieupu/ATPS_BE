# PHÂN TÍCH BACKEND - HỆ THỐNG TẠO LỚP HỌC

## 📋 MỤC LỤC
1. [Tổng quan](#tổng-quan)
2. [Routes & API Endpoints](#routes--api-endpoints)
3. [Controllers](#controllers)
4. [Services](#services)
5. [Repositories & Database Queries](#repositories--database-queries)
6. [Validation & Error Handling](#validation--error-handling)
7. [Flow xử lý chi tiết](#flow-xử-lý-chi-tiết)

---

## 📌 TỔNG QUAN

Backend xử lý tạo lớp học theo kiến trúc **3-layer**:
- **Route Layer**: Định nghĩa API endpoints và middleware
- **Controller Layer**: Xử lý request/response, validation cơ bản
- **Service Layer**: Business logic phức tạp
- **Repository Layer**: Database operations (SQL queries)

---

## 🔌 ROUTES & API ENDPOINTS

### File: `ATPS_BE/routes/classRouter.js`

#### 1. Tạo lớp mới
```javascript
POST /api/classes
Middleware: verifyToken, authorizeFeature("admin")
Controller: classController.createClass
```

#### 2. Cập nhật lớp
```javascript
PUT /api/classes/:classId
Middleware: verifyToken, authorizeFeature("admin")
Controller: classController.updateClass
```

#### 3. Tạo sessions hàng loạt
```javascript
POST /api/sessions/bulk
Middleware: verifyToken, authorizeFeature("admin")
Controller: sessionController.createBulkSessions
```

#### 4. Cập nhật schedule (Edit mode)
```javascript
POST /api/classes/:classId/schedule/update
Middleware: verifyToken, authorizeFeature("admin")
Controller: classScheduleController.updateClassSchedule
```

#### 5. Phân tích lịch bận
```javascript
POST /api/classes/instructor/analyze-blocked-days
Middleware: verifyToken, authorizeFeature("admin")
Controller: classScheduleController.analyzeBlockedDays
```

#### 6. Tìm ca rảnh
```javascript
GET /api/classes/instructor/available-slots
Query Params: InstructorID, TimeslotID, Day, startDate, numSuggestions, excludeClassId
Middleware: verifyToken
Controller: classScheduleController.findAvailableInstructorSlots
```

#### 7. Tìm ngày bắt đầu phù hợp
```javascript
POST /api/classes/search-timeslots
Middleware: verifyToken, authorizeFeature("admin")
Controller: classScheduleController.searchTimeslots
```

---

## 🎮 CONTROLLERS

### File: `ATPS_BE/controllers/classController.js`

#### `createClass(req, res)`
**Chức năng**: Tạo lớp học mới

**Validation**:
- `Name`: required, non-empty
- `InstructorID`: required, number > 0
- `OpendatePlan`: required, format YYYY-MM-DD
- `Numofsession`: required, number > 0
- `Maxstudent`: required, number > 0

**Flow**:
```javascript
1. Validate required fields
2. Validate date format (YYYY-MM-DD)
3. Validate số buổi > 0, sĩ số > 0
4. classService.createClass(classData)
   ↓
   classRepository.create(classData)
   ↓
   INSERT INTO `class` (...)
5. Nếu có sessions trong body:
   sessionRepository.createBulk(sessionsData)
6. Return { success: true, data: classData, ClassID }
```

#### `updateClass(req, res)`
**Chức năng**: Cập nhật thông tin lớp học

**Flow**:
```javascript
1. Validate classId
2. classService.updateClass(classId, updateData)
   ↓
   classRepository.update(classId, updateData)
   ↓
   UPDATE `class` SET ... WHERE ClassID = ?
3. Return { success: true, data: updatedClass }
```

### File: `ATPS_BE/controllers/classScheduleController.js`

#### `updateClassSchedule(req, res)`
**Chức năng**: Cập nhật schedule cho lớp học (Edit mode)

**Request Body**:
```javascript
{
  sessions: [
    {
      Title: "Session 1",
      Date: "2024-01-15",
      TimeslotID: 1,
      InstructorID: 1,
      ClassID: 16
    },
    ...
  ],
  startDate: "2024-01-15", // Optional
  endDate: "2024-02-15"   // Optional
}
```

**Flow**:
```javascript
1. Validate ClassID, sessions array
2. Validate single timeslot pattern (nếu là DRAFT)
3. classCreationWizardService.updateClassSchedule(params)
   ↓
   a. Lấy existingSessions
   b. Xác định vùng thời gian cần cập nhật
   c. Xóa sessions cũ trong vùng (deleteSession)
   d. Preserve ZoomUUID từ sessions cũ
   e. sessionService.createBulkSessions(preparedSessions)
4. Return { success, conflicts, summary }
```

#### `analyzeBlockedDays(req, res)`
**Chức năng**: Phân tích lịch bận của instructor

**Request Body**:
```javascript
{
  InstructorID: 1,
  OpendatePlan: "2024-01-15",
  Numofsession: 10,
  DaysOfWeek: [1, 3, 5],
  TimeslotsByDay: {
    1: [1],  // T2: ca 1
    3: [1],  // T4: ca 1
    5: [1]   // T6: ca 1
  }
}
```

**Flow**:
```javascript
1. Validate params
2. classCreationWizardService.analyzeBlockedDays(params)
   ↓
   a. Tính số tuần dự kiến
   b. Lấy blockedSchedules (instructorTimeslot với Status = OTHER)
   c. Lấy teachingSchedules (sessions)
   d. Phân tích từng ngày trong tuần và timeslot
3. Return { blockedDays, analysis, summary }
```

#### `findAvailableInstructorSlots(req, res)`
**Chức năng**: Tìm ca rảnh của instructor

**Query Params**:
- `InstructorID`: ID giảng viên
- `TimeslotID`: ID ca học
- `Day`: Thứ trong tuần (T2, T3, ...)
- `startDate`: Ngày bắt đầu tìm
- `numSuggestions`: Số gợi ý (default: 5)
- `excludeClassId`: Loại trừ class này

**Flow**:
```javascript
1. Validate params
2. classCreationWizardService.findAvailableInstructorSlots(params)
   ↓
   a. Vòng lặp tìm trong 50 ngày
   b. Với mỗi ngày cùng thứ (Day):
      - Kiểm tra lịch nghỉ (validateInstructorLeave)
      - Kiểm tra lịch dạy (checkSessionConflictInfo)
   c. Return [{ date, available, reason }, ...]
3. Return availableSlots
```

---

## ⚙️ SERVICES

### File: `ATPS_BE/services/ClassService.js`

#### `createClass(data)`
**Chức năng**: Tạo lớp học mới

**Flow**:
```javascript
1. Validate Name, InstructorID
2. Check course exists (nếu có CourseID)
3. Check instructor exists
4. classRepository.create(classData)
   ↓
   INSERT INTO `class` (...)
5. Return classData với ClassID
```

#### `updateClass(id, data)`
**Chức năng**: Cập nhật lớp học

**Flow**:
```javascript
1. Check class exists
2. Filter allowed fields
3. classRepository.update(id, filteredData)
   ↓
   UPDATE `class` SET ... WHERE ClassID = ?
4. Return updatedClass
```

### File: `ATPS_BE/services/classCreationWizardService.js`

#### `updateClassSchedule(params)`
**Chức năng**: Cập nhật schedule cho lớp học

**Params**:
```javascript
{
  ClassID: 16,
  sessions: [...],
  startDate: "2024-01-15", // Optional
  endDate: "2024-02-15"   // Optional
}
```

**Flow**:
```javascript
1. Validate ClassID, sessions array
2. Validate single timeslot pattern (nếu DRAFT)
3. Lấy existingSessions
4. Xác định vùng thời gian cần cập nhật
5. Xóa sessions cũ trong vùng:
   sessionService.deleteSession(sessionId)
   ↓
   DELETE FROM session WHERE SessionID = ?
   ↓
   DELETE FROM attendance WHERE SessionID = ?
6. Preserve ZoomUUID từ sessions cũ
7. sessionService.createBulkSessions(preparedSessions)
   ↓
   INSERT INTO session (...) VALUES (...), (...), ...
8. Return { success, conflicts, summary }
```

#### `analyzeBlockedDays(params)`
**Chức năng**: Phân tích lịch bận của instructor

**Params**:
```javascript
{
  InstructorID: 1,
  OpendatePlan: "2024-01-15",
  Numofsession: 10,
  DaysOfWeek: [1, 3, 5],
  TimeslotsByDay: { 1: [1], 3: [1], 5: [1] }
}
```

**Flow**:
```javascript
1. Validate params
2. Tính số tuần dự kiến:
   totalWeeks = Math.ceil(Numofsession / sessionsPerWeek)
3. Lấy blockedSchedules:
   instructorTimeslotRepository.findByDateRange(
     startDate,
     endDate,
     InstructorID
   )
   ↓
   SELECT it.*, t.StartTime, t.EndTime, t.Day
   FROM instructortimeslot it
   LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
   WHERE it.Date >= ? AND it.Date <= ?
     AND it.InstructorID = ?
     AND it.Status = 'OTHER'
4. Lấy teachingSchedules:
   sessionRepository.findByDateRange(startDate, endDate, {
     instructorId: InstructorID
   })
   ↓
   SELECT s.*, t.StartTime, t.EndTime
   FROM session s
   LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
   WHERE s.Date >= ? AND s.Date <= ?
     AND s.InstructorID = ?
5. Phân tích từng ngày trong tuần và timeslot:
   - Với mỗi (dayOfWeek, timeslotID):
     - Đếm số lần bận (manualOccurrences, sessionOccurrences)
     - Xác định isBlocked
     - Lưu blockedDates
6. Return { blockedDays, analysis, summary }
```

#### `findAvailableInstructorSlots(params)`
**Chức năng**: Tìm ca rảnh của instructor

**Params**:
```javascript
{
  InstructorID: 1,
  TimeslotID: 1,
  Day: "T2",
  startDate: "2024-01-15",
  numSuggestions: 5,
  excludeClassId: 16
}
```

**Flow**:
```javascript
1. Validate params
2. Lấy thông tin timeslot và instructor
3. Vòng lặp tìm trong 50 ngày:
   for (let i = 0; i < 50; i++) {
     const candidateDate = addDays(startDate, i);
     const dayOfWeek = getDayOfWeek(candidateDate);
     
     // Chỉ kiểm tra ngày cùng thứ
     if (dayOfWeek !== Day) continue;
     
     // Kiểm tra lịch nghỉ
     const leaveCheck = await validateInstructorLeave({
       InstructorID,
       TimeslotID,
       Date: candidateDate
     });
     
     // Kiểm tra lịch dạy
     const sessionCheck = await checkSessionConflictInfo({
       InstructorID,
       TimeslotID,
       Date: candidateDate
     }, null, excludeClassId);
     
     if (!leaveCheck.hasConflict && !sessionCheck.hasConflict) {
       availableSlots.push({ date: candidateDate, available: true });
     } else {
       busySlots.push({ date: candidateDate, available: false, reason: ... });
     }
   }
4. Return availableSlots + busySlots (nếu cần)
```

### File: `ATPS_BE/services/sessionService.js`

#### `createBulkSessions(sessionsData)`
**Chức năng**: Tạo nhiều sessions cùng lúc

**Flow**:
```javascript
1. Validate sessionsData array
2. Với mỗi session:
   a. checkSessionConflictInfo(sessionData)
      - validateInstructorLeave()
      - Query sessions trùng
   b. Nếu có conflict → thêm vào conflicts
   c. Nếu không → thêm vào success
3. Tạo sessions thành công:
   sessionRepository.createBulk(successSessions)
   ↓
   INSERT INTO session (...) VALUES (...), (...), ...
4. Return { success, conflicts, summary }
```

#### `checkSessionConflictInfo(sessionData, excludeSessionId, excludeClassId)`
**Chức năng**: Kiểm tra conflict cho một session

**Flow**:
```javascript
1. Kiểm tra lịch nghỉ:
   validateInstructorLeave(sessionData, instructorType)
   ↓
   instructorTimeslotRepository.checkConflict(
     InstructorID,
     TimeslotID,
     Date
   )
   ↓
   SELECT * FROM instructortimeslot
   WHERE InstructorID = ? AND TimeslotID = ? AND Date = ?
   
   - Fulltime: Chỉ conflict nếu có HOLIDAY
   - Parttime: Phải có AVAILABLE, conflict nếu có HOLIDAY/CLOSE

2. Kiểm tra lịch dạy (Session đã tồn tại):
   sessionRepository.findByInstructorAndDateRange(...)
   ↓
   SELECT DISTINCT s.SessionID, s.Title, c.Name, c.ClassID, s.Date, t.StartTime, t.EndTime
   FROM session s
   INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
   INNER JOIN `class` c ON s.ClassID = c.ClassID
   WHERE s.InstructorID = ?
     AND s.Date = ?
     AND s.TimeslotID = ?
     AND s.ClassID != ?  -- excludeClassId

3. Return { hasConflict, conflictType, conflictInfo }
```

---

## 💾 REPOSITORIES & DATABASE QUERIES

### File: `ATPS_BE/repositories/classRepository.js`

#### `create(classData)`
**Query**:
```sql
INSERT INTO `class` (
  Name, CourseID, InstructorID, Status, ZoomID, Zoompass, Fee, 
  OpendatePlan, Opendate, EnddatePlan, Enddate,
  Numofsession, Maxstudent
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**Parameters**:
- `Name`: Tên lớp học
- `CourseID`: ID khóa học (nullable)
- `InstructorID`: ID giảng viên
- `Status`: Trạng thái (default: 'DRAFT')
- `ZoomID`: Zoom ID (nullable)
- `Zoompass`: Zoom password (nullable)
- `Fee`: Học phí (default: 0)
- `OpendatePlan`: Ngày bắt đầu dự kiến (nullable)
- `Opendate`: NULL (sẽ được sync từ session)
- `EnddatePlan`: Ngày kết thúc dự kiến (nullable)
- `Enddate`: NULL (sẽ được sync từ session)
- `Numofsession`: Số buổi học (default: 0)
- `Maxstudent`: Sĩ số tối đa (default: 0)

#### `findById(id)`
**Query**:
```sql
SELECT 
  c.*,
  co.Title as courseTitle,
  co.Description as courseDescription,
  i.FullName as instructorName,
  i.Major as instructorMajor,
  COUNT(e.EnrollmentID) as currentLearners
FROM `class` c
LEFT JOIN course co ON c.CourseID = co.CourseID
LEFT JOIN instructor i ON c.InstructorID = i.InstructorID
LEFT JOIN enrollment e ON c.ClassID = e.ClassID AND e.Status = 'active'
WHERE c.ClassID = ?
GROUP BY c.ClassID
```

#### `update(id, updateData)`
**Query**:
```sql
UPDATE `class` 
SET Name = ?, CourseID = ?, Fee = ?, Maxstudent = ?, ...
WHERE ClassID = ?
```

**Dynamic fields**: Tạo từ `updateData` object

#### `findByInstructorId(instructorId)`
**Query**:
```sql
SELECT 
  c.*,
  co.Title as courseTitle,
  co.Description as courseDescription
FROM `class` c
LEFT JOIN course co ON c.CourseID = co.CourseID
WHERE c.InstructorID = ?
ORDER BY c.ClassID DESC
```

### File: `ATPS_BE/repositories/sessionRepository.js`

#### `create(sessionData)`
**Query**:
```sql
INSERT INTO session (
  Title, Description, InstructorID, ClassID, TimeslotID, Date, ZoomUUID
) VALUES (?, ?, ?, ?, ?, ?, ?)
```

**Parameters**:
- `Title`: Tên buổi học
- `Description`: Mô tả (nullable)
- `InstructorID`: ID giảng viên
- `ClassID`: ID lớp học
- `TimeslotID`: ID ca học
- `Date`: Ngày học (YYYY-MM-DD)
- `ZoomUUID`: UUID phòng Zoom (auto-generate nếu null)

#### `createBulk(sessionsData)`
**Query**:
```sql
INSERT INTO session (
  Title, Description, InstructorID, ClassID, TimeslotID, Date, ZoomUUID
) VALUES 
  (?, ?, ?, ?, ?, ?, ?),
  (?, ?, ?, ?, ?, ?, ?),
  ...
```

**Parameters**: Array of session data

#### `findByClassId(classId)`
**Query**:
```sql
SELECT 
  s.*,
  t.StartTime, t.EndTime, t.Day,
  c.Name as ClassName,
  i.FullName as InstructorName
FROM session s
LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
LEFT JOIN `class` c ON s.ClassID = c.ClassID
LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
WHERE s.ClassID = ?
ORDER BY s.Date ASC, t.StartTime ASC
```

#### `findByDateRange(startDate, endDate, filters = {})`
**Query**:
```sql
SELECT 
  s.*,
  t.StartTime, t.EndTime,
  c.Name as ClassName,
  i.FullName as InstructorName
FROM session s
LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
LEFT JOIN `class` c ON s.ClassID = c.ClassID
LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
WHERE s.Date >= ? AND s.Date <= ?
  [AND s.ClassID = ?]  -- if filters.classId
  [AND s.ClassID IN (?, ?, ...)]  -- if filters.classIds
  [AND s.InstructorID = ?]  -- if filters.instructorId
ORDER BY s.Date ASC, t.StartTime ASC
```

#### `findByInstructorAndDateRange(instructorId, startDate, endDate)`
**Query**:
```sql
SELECT 
  s.*,
  t.StartTime, t.EndTime,
  c.Name as ClassName,
  i.FullName as InstructorName
FROM session s
LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
LEFT JOIN `class` c ON s.ClassID = c.ClassID
LEFT JOIN instructor i ON s.InstructorID = i.InstructorID
WHERE s.InstructorID = ? 
  AND s.Date >= ? 
  AND s.Date <= ?
ORDER BY s.Date ASC, t.StartTime ASC
```

#### `delete(sessionId)`
**Query**:
```sql
DELETE FROM session WHERE SessionID = ?
```

**Note**: Cần xóa attendance trước (cascade):
```sql
DELETE FROM attendance WHERE SessionID = ?
```

#### `update(sessionId, updateData)`
**Query**:
```sql
UPDATE session 
SET Title = ?, Description = ?, Date = ?, TimeslotID = ?, ...
WHERE SessionID = ?
```

### File: `ATPS_BE/repositories/InstructorTimeslotRepository.js`

#### `findByDateRange(startDate, endDate, instructorId = null)`
**Query**:
```sql
SELECT 
  it.*,
  t.StartTime, t.EndTime, t.Day
FROM instructortimeslot it
LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
WHERE it.Date >= ? AND it.Date <= ?
  [AND it.InstructorID = ?]  -- if instructorId
ORDER BY it.Date ASC, t.StartTime ASC
```

#### `checkConflict(instructorId, timeslotId, date)`
**Query**:
```sql
SELECT * FROM instructortimeslot 
WHERE InstructorID = ? 
  AND TimeslotID = ? 
  AND Date = ?
```

**Return**: Row nếu có conflict, null nếu không

#### `checkSessionConflict(instructorId, timeslotId, date)`
**Query**:
```sql
SELECT s.SessionID, s.Title, c.Name as ClassName
FROM session s
JOIN `class` c ON s.ClassID = c.ClassID
WHERE s.InstructorID = ? 
  AND s.TimeslotID = ? 
  AND s.Date = ?
```

**Return**: Row nếu có conflict với session, null nếu không

#### `deleteByDateRange(instructorId, startDate, endDate, excludeStatuses = [])`
**Query**:
```sql
DELETE FROM instructortimeslot 
WHERE InstructorID = ? 
  AND Date >= ? 
  AND Date <= ?
  [AND Status NOT IN (?, ?, ...)]  -- if excludeStatuses
```

### File: `ATPS_BE/repositories/timeslotRepository.js`

#### `findById(timeslotId)`
**Query**:
```sql
SELECT * FROM timeslot WHERE TimeslotID = ?
```

**Return**: Timeslot object với các trường:
- `TimeslotID`
- `StartTime`
- `EndTime`
- `Day` (nullable)

---

## ✅ VALIDATION & ERROR HANDLING

### File: `ATPS_BE/utils/sessionValidation.js`

#### `validateInstructorLeave(sessionData, instructorType, excludeSessionId)`
**Chức năng**: Kiểm tra xung đột với lịch nghỉ/bận của instructor

**Logic**:
- **Fulltime**: Chỉ conflict nếu có `HOLIDAY`
- **Parttime**: 
  - Phải có `AVAILABLE` (đã chọn ca này)
  - Conflict nếu có `HOLIDAY` hoặc `CLOSE`
  - Conflict nếu không có trong `instructortimeslot`

**Query**:
```sql
SELECT * FROM instructortimeslot 
WHERE InstructorID = ? 
  AND TimeslotID = ? 
  AND Date = ?
```

**Return**:
```javascript
{
  hasConflict: boolean,
  conflictType: "instructor_leave",
  conflictInfo: {
    instructorId,
    timeslotId,
    date,
    status,
    note,
    message
  }
}
```

#### `validateDateDayConsistency(sessionData)`
**Chức năng**: Kiểm tra mâu thuẫn Date vs. Day (đã bỏ qua trong code hiện tại)

**Logic**: 
- Lấy `Day` từ timeslot
- Lấy `dayOfWeek` từ Date
- So sánh (hiện tại đã comment out vì một timeslot có thể dùng cho nhiều ngày)

**Return**:
```javascript
{
  isValid: boolean,
  error: string
}
```

#### `checkSessionConflictInfo(sessionData, excludeSessionId, excludeClassId)`
**Chức năng**: Kiểm tra conflict với session đã tồn tại

**Query**:
```sql
SELECT DISTINCT
  s.SessionID,
  s.Title as sessionTitle,
  c.Name as ClassName,
  c.ClassID,
  s.Date,
  t.StartTime,
  t.EndTime
FROM session s
INNER JOIN timeslot t ON s.TimeslotID = t.TimeslotID
INNER JOIN `class` c ON s.ClassID = c.ClassID
WHERE s.InstructorID = ?
  AND s.Date = ?
  AND s.TimeslotID = ?
  AND s.ClassID != ?  -- excludeClassId
```

**Return**:
```javascript
{
  hasConflict: boolean,
  conflictType: "session_conflict",
  conflictInfo: {
    sessionId,
    sessionTitle,
    className,
    classId,
    date,
    startTime,
    endTime,
    message
  }
}
```

### Error Handling

**Controller Level**:
```javascript
try {
  const result = await service.method(params);
  res.status(200).json({ success: true, data: result });
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Lỗi máy chủ",
    error: error.stack
  });
}
```

**Service Level**:
```javascript
try {
  // Business logic
  return result;
} catch (error) {
  console.error("Service error:", error);
  throw new Error(`Lỗi xử lý: ${error.message}`);
}
```

**Repository Level**:
```javascript
try {
  const [rows] = await db.execute(query, params);
  return rows;
} catch (error) {
  console.error("Database error:", error);
  throw error;
}
```

---

## 🔄 FLOW XỬ LÝ CHI TIẾT

### Flow 1: Tạo lớp mới (CREATE MODE)

```
POST /api/classes
  ↓
classController.createClass()
  ↓
1. Validate required fields
2. classService.createClass(classData)
   ↓
   classRepository.create(classData)
   ↓
   INSERT INTO `class` (...)
   ↓
   Return ClassID
  ↓
3. Nếu có sessions trong body:
   sessionRepository.createBulk(sessionsData)
   ↓
   INSERT INTO session (...) VALUES (...), (...), ...
  ↓
4. Return { success: true, data: classData, ClassID }
```

### Flow 2: Cập nhật schedule (EDIT MODE)

```
POST /api/classes/:classId/schedule/update
  ↓
classScheduleController.updateClassSchedule()
  ↓
1. Validate ClassID, sessions array
2. Validate single timeslot pattern (nếu DRAFT)
3. classCreationWizardService.updateClassSchedule(params)
   ↓
   a. Lấy existingSessions
   b. Xác định vùng thời gian cần cập nhật
   c. Xóa sessions cũ:
      sessionService.deleteSession(sessionId)
      ↓
      DELETE FROM attendance WHERE SessionID = ?
      DELETE FROM session WHERE SessionID = ?
   d. Preserve ZoomUUID từ sessions cũ
   e. sessionService.createBulkSessions(preparedSessions)
      ↓
      Với mỗi session:
        - checkSessionConflictInfo()
        - validateInstructorLeave()
      ↓
      INSERT INTO session (...) VALUES (...), (...), ...
   ↓
4. Return { success, conflicts, summary }
```

### Flow 3: Phân tích lịch bận

```
POST /api/classes/instructor/analyze-blocked-days
  ↓
classScheduleController.analyzeBlockedDays()
  ↓
1. Validate params
2. classCreationWizardService.analyzeBlockedDays(params)
   ↓
   a. Tính số tuần dự kiến
   b. Lấy blockedSchedules:
      instructorTimeslotRepository.findByDateRange(...)
      ↓
      SELECT it.*, t.StartTime, t.EndTime, t.Day
      FROM instructortimeslot it
      LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
      WHERE it.Date >= ? AND it.Date <= ?
        AND it.InstructorID = ?
        AND it.Status = 'OTHER'
   c. Lấy teachingSchedules:
      sessionRepository.findByDateRange(...)
      ↓
      SELECT s.*, t.StartTime, t.EndTime
      FROM session s
      LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
      WHERE s.Date >= ? AND s.Date <= ?
        AND s.InstructorID = ?
   d. Phân tích từng ngày trong tuần và timeslot
   ↓
3. Return { blockedDays, analysis, summary }
```

### Flow 4: Tìm ca rảnh

```
GET /api/classes/instructor/available-slots?InstructorID=1&TimeslotID=1&Day=T2&startDate=2024-01-15&numSuggestions=5
  ↓
classScheduleController.findAvailableInstructorSlots()
  ↓
1. Validate params
2. classCreationWizardService.findAvailableInstructorSlots(params)
   ↓
   a. Lấy thông tin timeslot và instructor
   b. Vòng lặp tìm trong 50 ngày:
      for (let i = 0; i < 50; i++) {
        const candidateDate = addDays(startDate, i);
        const dayOfWeek = getDayOfWeek(candidateDate);
        
        if (dayOfWeek !== Day) continue;
        
        // Kiểm tra lịch nghỉ
        validateInstructorLeave({
          InstructorID,
          TimeslotID,
          Date: candidateDate
        })
        ↓
        instructorTimeslotRepository.checkConflict(...)
        ↓
        SELECT * FROM instructortimeslot
        WHERE InstructorID = ? AND TimeslotID = ? AND Date = ?
        
        // Kiểm tra lịch dạy
        checkSessionConflictInfo({
          InstructorID,
          TimeslotID,
          Date: candidateDate
        }, null, excludeClassId)
        ↓
        SELECT DISTINCT s.SessionID, ...
        FROM session s
        WHERE s.InstructorID = ? AND s.Date = ? AND s.TimeslotID = ?
          AND s.ClassID != ?
        
        if (!leaveCheck.hasConflict && !sessionCheck.hasConflict) {
          availableSlots.push({ date: candidateDate, available: true });
        }
      }
   ↓
3. Return availableSlots
```

---

## 📊 TỔNG KẾT

### Các bảng database chính:
1. **`class`**: Lưu thông tin lớp học
2. **`session`**: Lưu thông tin buổi học
3. **`timeslot`**: Lưu thông tin ca học
4. **`instructortimeslot`**: Lưu lịch nghỉ/bận của giảng viên
5. **`enrollment`**: Lưu thông tin đăng ký học

### Các validation chính:
1. **Date-Day Consistency**: Kiểm tra mâu thuẫn ngày/thứ (đã bỏ qua)
2. **Instructor Leave**: Kiểm tra lịch nghỉ/bận của giảng viên
3. **Session Conflict**: Kiểm tra trùng lịch dạy
4. **Single Timeslot Pattern**: Với DRAFT class, chỉ cho phép một timeslot duy nhất

### Các conflict types:
1. **`instructor_leave`**: Giảng viên nghỉ/bận
2. **`session_conflict`**: Trùng lịch dạy
3. **`date_day_mismatch`**: Mâu thuẫn ngày/thứ (đã bỏ qua)

---

## 🔗 CÁC FILE LIÊN QUAN

### Routes
- `ATPS_BE/routes/classRouter.js`
- `ATPS_BE/routes/sessionRouter.js`

### Controllers
- `ATPS_BE/controllers/classController.js`
- `ATPS_BE/controllers/classScheduleController.js`
- `ATPS_BE/controllers/sessionController.js`

### Services
- `ATPS_BE/services/ClassService.js`
- `ATPS_BE/services/classCreationWizardService.js`
- `ATPS_BE/services/sessionService.js`
- `ATPS_BE/services/instructorAvailabilityService.js`

### Repositories
- `ATPS_BE/repositories/classRepository.js`
- `ATPS_BE/repositories/sessionRepository.js`
- `ATPS_BE/repositories/timeslotRepository.js`
- `ATPS_BE/repositories/InstructorTimeslotRepository.js`
- `ATPS_BE/repositories/instructorRepository.js`

### Utils
- `ATPS_BE/utils/sessionValidation.js`
- `ATPS_BE/utils/validators.js`

### Middlewares
- `ATPS_BE/middlewares/auth.js` (verifyToken, authorizeFeature)

