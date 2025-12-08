# PHÂN TÍCH HỆ THỐNG TẠO LỚP HỌC

## 📋 MỤC LỤC
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc Frontend](#kiến-trúc-frontend)
3. [Kiến trúc Backend](#kiến-trúc-backend)
4. [Flow xử lý từng bước](#flow-xử-lý-từng-bước)
5. [Các API Endpoints](#các-api-endpoints)
6. [Database Queries](#database-queries)
7. [Các file liên quan](#các-file-liên-quan)

---

## 📌 TỔNG QUAN

Hệ thống tạo lớp học sử dụng **Wizard 4 bước** để admin tạo lớp học mới:

1. **Bước 1**: Thông tin cơ bản (Tên lớp, Giảng viên, Khóa học, Học phí, Sĩ số)
2. **Bước 2**: Lịch học (Ngày bắt đầu, Số buổi dự kiến)
3. **Bước 3**: Chi tiết buổi học (Chọn thứ trong tuần, Chọn ca học, Xem preview)
4. **Bước 4**: Review và xác nhận

---

## 🎨 KIẾN TRÚC FRONTEND

### Entry Point
**File**: `ATPS_FE/fe/src/pages/admin/pages/CreateClassPage.js`

**Chức năng chính**:
- Load dữ liệu ban đầu (instructors, courses, timeslots)
- Quản lý state cho wizard
- Xử lý submit form
- Xử lý conflicts và suggestions

**Các hàm chính**:
```javascript
// Load dữ liệu ban đầu
useEffect(() => {
  loadData() // Load instructors, courses, timeslots
  if (classId) loadClassData() // Nếu đang edit
}, [classId])

// Xử lý submit
handleSubmit(submitData) {
  1. Tạo/Cập nhật class (POST /classes hoặc PUT /classes/:id)
  2. Tạo sessions (POST /sessions/bulk hoặc POST /classes/:id/schedule/update)
  3. Xử lý conflicts nếu có
  4. Navigate về danh sách lớp
}
```

### Wizard Component
**File**: `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizard.js`

**Cấu trúc**:
- **State Management**: Quản lý formData, currentStep, errors
- **Step Components**:
  - `ClassWizardStep1.js` - Thông tin cơ bản
  - `ClassWizardStep2.js` - Lịch học
  - `ClassWizardStep3.js` - Chi tiết buổi học
  - `ClassWizardStep4.js` - Review

**Flow trong ClassWizard**:
```javascript
// Bước 1: Nhập thông tin cơ bản
validateStep1() → setFormData() → nextStep()

// Bước 2: Chọn ngày bắt đầu và số buổi
validateStep2() → analyzeBlockedDays() → setFormData() → nextStep()

// Bước 3: Chọn thứ và ca học
handleTimeslotSelection() → 
  analyzeBlockedDays() → 
  findAvailableInstructorSlots() → 
  generatePreviewSessions() → 
  setFormData() → nextStep()

// Bước 4: Review
handleSubmit() → onSubmit(formData) → CreateClassPage.handleSubmit()
```

### Step Components

#### Step 1: Thông tin cơ bản
**File**: `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep1.js`

**Inputs**:
- Name (Tên lớp)
- InstructorID (Giảng viên)
- CourseID (Khóa học) - Optional
- Fee (Học phí)
- Maxstudent (Sĩ số tối đa)
- ZoomID, Zoompass

**Validation**:
```javascript
validateStep1(formData) {
  - Name: required
  - InstructorID: required
  - Fee: number >= 0
  - Maxstudent: number > 0
}
```

#### Step 2: Lịch học
**File**: `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep2.js`

**Inputs**:
- OpendatePlan (Ngày bắt đầu dự kiến)
- Numofsession (Số buổi dự kiến)

**API Calls**:
```javascript
// Phân tích lịch bận của instructor
POST /classes/instructor/analyze-blocked-days
Body: {
  InstructorID,
  OpendatePlan,
  Numofsession,
  DaysOfWeek,
  TimeslotsByDay
}

// Tìm ngày bắt đầu phù hợp
POST /classes/search-timeslots
Body: {
  InstructorID,
  DaysOfWeek,
  TimeslotsByDay,
  Numofsession,
  sessionsPerWeek,
  currentStartDate
}
```

#### Step 3: Chi tiết buổi học
**File**: `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep3.js`

**Logic**:
1. Chọn thứ trong tuần (DaysOfWeek)
2. Chọn ca học cho mỗi thứ (TimeslotsByDay)
3. Phân tích lịch bận (analyzeBlockedDays)
4. Tìm ca rảnh (findAvailableInstructorSlots)
5. Generate preview sessions

**API Calls**:
```javascript
// Tìm ca rảnh của instructor
GET /classes/instructor/available-slots?InstructorID=...&TimeslotID=...&Day=...&startDate=...&numSuggestions=5

// Phân tích độ bận định kỳ
POST /classes/instructor/analyze-blocked-days
```

**Preview Sessions Generation**:
```javascript
generatePreviewSessions() {
  // Dựa trên:
  // - OpendatePlan
  // - Numofsession
  // - DaysOfWeek
  // - TimeslotsByDay
  // Tạo danh sách sessions preview
}
```

#### Step 4: Review
**File**: `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep4.js`

**Hiển thị**:
- Tổng hợp thông tin từ 3 bước trước
- Danh sách sessions đã tạo
- Nút "Lưu bản nháp" hoặc "Hoàn thành"

---

## ⚙️ KIẾN TRÚC BACKEND

### Route Handler
**File**: `ATPS_BE/routes/classRouter.js`

**Các routes chính**:
```javascript
// Tạo lớp mới
POST /classes
  → verifyToken
  → authorizeFeature("admin")
  → classController.createClass

// Cập nhật lớp
PUT /classes/:classId
  → verifyToken
  → authorizeFeature("admin")
  → classController.updateClass

// Tạo sessions hàng loạt
POST /sessions/bulk
  → verifyToken
  → authorizeFeature("admin")
  → sessionController.createBulkSessions

// Cập nhật schedule (Edit mode)
POST /classes/:classId/schedule/update
  → verifyToken
  → authorizeFeature("admin")
  → classScheduleController.updateClassSchedule

// Phân tích lịch bận
POST /classes/instructor/analyze-blocked-days
  → verifyToken
  → authorizeFeature("admin")
  → classScheduleController.analyzeBlockedDays

// Tìm ca rảnh
GET /classes/instructor/available-slots
  → verifyToken
  → classScheduleController.findAvailableInstructorSlots

// Tìm ngày bắt đầu phù hợp
POST /classes/search-timeslots
  → verifyToken
  → authorizeFeature("admin")
  → classScheduleController.searchTimeslots
```

### Controller Layer

#### Class Controller
**File**: `ATPS_BE/controllers/classController.js`

**Hàm chính**:
```javascript
// Tạo lớp mới
createClass(req, res) {
  1. Validate required fields (Name, InstructorID, OpendatePlan, Numofsession, Maxstudent)
  2. Validate date format (YYYY-MM-DD)
  3. Validate số buổi > 0, sĩ số > 0
  4. classService.createClass(classData)
  5. Nếu có sessions trong body → tạo sessions
  6. Return classData với ClassID
}

// Cập nhật lớp
updateClass(req, res) {
  1. Validate classId
  2. classService.updateClass(classId, updateData)
  3. Return updatedClass
}
```

#### Class Schedule Controller
**File**: `ATPS_BE/controllers/classScheduleController.js`

**Hàm chính**:
```javascript
// Cập nhật schedule
updateClassSchedule(req, res) {
  1. Validate ClassID, sessions array
  2. Validate single timeslot pattern (nếu là DRAFT)
  3. classCreationWizardService.updateClassSchedule(params)
  4. Return { success, conflicts, summary }
}

// Phân tích lịch bận
analyzeBlockedDays(req, res) {
  1. Validate params
  2. classCreationWizardService.analyzeBlockedDays(params)
  3. Return { blockedDays, analysis, summary }
}

// Tìm ca rảnh
findAvailableInstructorSlots(req, res) {
  1. Validate params
  2. classCreationWizardService.findAvailableInstructorSlots(params)
  3. Return [{ date, available, reason }, ...]
}

// Tìm ngày bắt đầu phù hợp
searchTimeslots(req, res) {
  1. Validate params
  2. classCreationWizardService.searchTimeslots(params)
  3. Return [{ date, availableSlots, reason }, ...]
}
```

### Service Layer

#### Class Service
**File**: `ATPS_BE/services/ClassService.js`

**Hàm chính**:
```javascript
// Tạo lớp
async createClass(data) {
  1. Validate Name, InstructorID
  2. Check course exists (nếu có CourseID)
  3. Check instructor exists
  4. classRepository.create(classData)
  5. Return classData với ClassID
}

// Cập nhật lớp
async updateClass(id, data) {
  1. Check class exists
  2. Filter allowed fields
  3. classRepository.update(id, filteredData)
  4. Return updatedClass
}
```

#### Class Creation Wizard Service
**File**: `ATPS_BE/services/classCreationWizardService.js`

**Hàm chính**:
```javascript
// Cập nhật schedule
async updateClassSchedule(params) {
  1. Validate ClassID, sessions array
  2. Validate single timeslot pattern (nếu DRAFT)
  3. Lấy existingSessions
  4. Xác định vùng thời gian cần cập nhật
  5. Xóa sessions cũ trong vùng (deleteSession)
  6. Preserve ZoomUUID từ sessions cũ
  7. sessionService.createBulkSessions(preparedSessions)
  8. Return { success, conflicts, summary }
}

// Phân tích lịch bận
async analyzeBlockedDays(params) {
  1. Validate params
  2. Tính số tuần dự kiến
  3. Lấy blockedSchedules (instructorTimeslot với Status = OTHER)
  4. Lấy teachingSchedules (sessions)
  5. Phân tích từng ngày trong tuần và timeslot
  6. Return { blockedDays, analysis, summary }
}

// Tìm ca rảnh
async findAvailableInstructorSlots(params) {
  1. Validate params
  2. Vòng lặp tìm trong 50 ngày
  3. Với mỗi ngày cùng thứ:
     - Kiểm tra lịch nghỉ (validateInstructorLeave)
     - Kiểm tra lịch dạy (checkSessionConflictInfo)
  4. Return [{ date, available, reason }, ...]
}

// Tìm ngày bắt đầu phù hợp
async searchTimeslots(params) {
  1. Validate params
  2. Tính weeksNeeded, maxWeeksToCheck
  3. Vòng lặp tìm trong maxWeeksToCheck tuần
  4. Với mỗi ngày candidate:
     - Gọi analyzeBlockedDays
     - Tính availableSlots
     - Suggest nếu tất cả ca đều AVAILABLE
  5. Return [{ date, availableSlots, reason }, ...]
}
```

#### Session Service
**File**: `ATPS_BE/services/sessionService.js`

**Hàm chính**:
```javascript
// Tạo sessions hàng loạt
async createBulkSessions(sessionsData) {
  1. Validate sessionsData array
  2. Với mỗi session:
     - checkSessionConflictInfo(sessionData)
     - Nếu có conflict → thêm vào conflicts
     - Nếu không → thêm vào success
  3. Tạo sessions thành công (sessionRepository.createBulk)
  4. Return { success, conflicts, summary }
}

// Kiểm tra conflict
async checkSessionConflictInfo(sessionData, excludeSessionId, excludeClassId) {
  1. Kiểm tra lịch nghỉ (validateInstructorLeave)
  2. Kiểm tra lịch dạy (query sessions trùng)
  3. Return { hasConflict, conflictType, conflictInfo }
}
```

### Repository Layer

#### Class Repository
**File**: `ATPS_BE/repositories/classRepository.js`

**Queries chính**:
```sql
-- Tạo lớp mới
INSERT INTO `class` (
  Name, CourseID, InstructorID, Status, ZoomID, Zoompass, Fee,
  OpendatePlan, Opendate, EnddatePlan, Enddate,
  Numofsession, Maxstudent
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

-- Lấy lớp theo ID
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

-- Cập nhật lớp
UPDATE `class` SET Name = ?, CourseID = ?, ... WHERE ClassID = ?
```

#### Session Repository
**File**: `ATPS_BE/repositories/sessionRepository.js`

**Queries chính**:
```sql
-- Tạo session
INSERT INTO session (
  Title, Description, ClassID, InstructorID, TimeslotID, Date, ZoomUUID
) VALUES (?, ?, ?, ?, ?, ?, ?)

-- Tạo sessions hàng loạt
INSERT INTO session (
  Title, Description, ClassID, InstructorID, TimeslotID, Date, ZoomUUID
) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?), ...

-- Lấy sessions theo ClassID
SELECT 
  s.*,
  t.StartTime, t.EndTime, t.Day,
  c.Name as className
FROM session s
LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
LEFT JOIN `class` c ON s.ClassID = c.ClassID
WHERE s.ClassID = ?
ORDER BY s.Date ASC, t.StartTime ASC

-- Kiểm tra conflict (trùng lịch dạy)
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
  AND s.ClassID != ? -- excludeClassId
```

---

## 🔄 FLOW XỬ LÝ TỪNG BƯỚC

### BƯỚC 1: Thông tin cơ bản

**Frontend Flow**:
```
ClassWizardStep1
  ↓
User nhập: Name, InstructorID, CourseID, Fee, Maxstudent, ZoomID, Zoompass
  ↓
validateStep1(formData)
  ↓
setFormData() → nextStep()
```

**Backend**: Không có API call ở bước này

---

### BƯỚC 2: Lịch học

**Frontend Flow**:
```
ClassWizardStep2
  ↓
User nhập: OpendatePlan, Numofsession
  ↓
validateStep2(formData)
  ↓
analyzeBlockedDays() [Optional - nếu đã chọn DaysOfWeek]
  ↓
searchTimeslots() [Optional - tìm ngày bắt đầu phù hợp]
  ↓
setFormData() → nextStep()
```

**Backend API Calls**:
```javascript
// 1. Phân tích lịch bận (nếu đã chọn DaysOfWeek)
POST /classes/instructor/analyze-blocked-days
Request: {
  InstructorID: 1,
  OpendatePlan: "2024-01-15",
  Numofsession: 10,
  DaysOfWeek: [1, 3, 5],
  TimeslotsByDay: { 1: [1], 3: [1], 5: [1] }
}
Response: {
  blockedDays: { 1: [1], 3: [] },
  analysis: { ... },
  summary: { ... }
}

// 2. Tìm ngày bắt đầu phù hợp (nếu cần)
POST /classes/search-timeslots
Request: {
  InstructorID: 1,
  DaysOfWeek: [1, 3, 5],
  TimeslotsByDay: { 1: [1], 3: [1], 5: [1] },
  Numofsession: 10,
  sessionsPerWeek: 3,
  currentStartDate: "2024-01-15"
}
Response: [
  { date: "2024-01-22", availableSlots: 3, reason: "..." },
  { date: "2024-01-29", availableSlots: 3, reason: "..." }
]
```

**Backend Processing**:
```
classScheduleController.analyzeBlockedDays()
  ↓
classCreationWizardService.analyzeBlockedDays()
  ↓
1. Tính số tuần dự kiến
2. Lấy blockedSchedules từ instructortimeslot (Status = OTHER)
3. Lấy teachingSchedules từ session
4. Phân tích từng ngày trong tuần và timeslot
5. Return blockedDays, analysis
```

---

### BƯỚC 3: Chi tiết buổi học

**Frontend Flow**:
```
ClassWizardStep3
  ↓
User chọn: DaysOfWeek, TimeslotsByDay
  ↓
analyzeBlockedDays() [Phân tích lịch bận]
  ↓
findAvailableInstructorSlots() [Tìm ca rảnh cho từng timeslot]
  ↓
generatePreviewSessions() [Tạo preview sessions]
  ↓
setFormData({ sessions: previewSessions }) → nextStep()
```

**Backend API Calls**:
```javascript
// 1. Phân tích lịch bận
POST /classes/instructor/analyze-blocked-days
Request: {
  InstructorID: 1,
  OpendatePlan: "2024-01-15",
  Numofsession: 10,
  DaysOfWeek: [1, 3, 5],
  TimeslotsByDay: { 1: [1], 3: [1], 5: [1] }
}
Response: {
  blockedDays: { 1: [1] }, // T2, ca 1 bị khóa
  analysis: {
    "1-1": {
      manualOccurrences: 2,
      sessionOccurrences: 1,
      totalBusyCount: 3,
      isBlocked: true,
      blockedDates: ["2024-01-15 (OTHER)", "2024-01-22 (SESSION)"]
    }
  }
}

// 2. Tìm ca rảnh (cho từng timeslot)
GET /classes/instructor/available-slots?InstructorID=1&TimeslotID=1&Day=T2&startDate=2024-01-15&numSuggestions=5
Response: [
  { date: "2024-01-22", available: true, reason: null },
  { date: "2024-01-29", available: false, reason: "GV nghỉ: Holiday" },
  { date: "2024-02-05", available: true, reason: null }
]
```

**Backend Processing**:
```
classScheduleController.findAvailableInstructorSlots()
  ↓
classCreationWizardService.findAvailableInstructorSlots()
  ↓
1. Vòng lặp tìm trong 50 ngày
2. Với mỗi ngày cùng thứ (Day):
   a. Kiểm tra lịch nghỉ (validateInstructorLeave)
   b. Kiểm tra lịch dạy (checkSessionConflictInfo)
   c. Nếu rảnh → thêm vào availableSlots
   d. Nếu bận → thêm vào busySlots với reason
3. Return availableSlots + busySlots (nếu cần)
```

**Frontend Preview Generation**:
```javascript
generatePreviewSessions() {
  // Dựa trên:
  // - OpendatePlan: "2024-01-15"
  // - Numofsession: 10
  // - DaysOfWeek: [1, 3, 5] // T2, T4, T6
  // - TimeslotsByDay: { 1: [1], 3: [1], 5: [1] }
  
  // Tạo 10 sessions:
  // Session 1: 2024-01-15 (T2), TimeslotID: 1
  // Session 2: 2024-01-17 (T4), TimeslotID: 1
  // Session 3: 2024-01-19 (T6), TimeslotID: 1
  // Session 4: 2024-01-22 (T2), TimeslotID: 1
  // ...
  // Session 10: 2024-02-09 (T6), TimeslotID: 1
}
```

---

### BƯỚC 4: Review và Submit

**Frontend Flow**:
```
ClassWizardStep4
  ↓
User xem review → Nhấn "Lưu bản nháp" hoặc "Hoàn thành"
  ↓
handleSubmit() → onSubmit(formData)
  ↓
CreateClassPage.handleSubmit(submitData)
```

**Backend Flow (CREATE MODE)**:
```
POST /classes
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
4. Return { ClassID, ... }

POST /sessions/bulk
  ↓
sessionController.createBulkSessions()
  ↓
sessionService.createBulkSessions(sessionsData)
  ↓
Với mỗi session:
  1. checkSessionConflictInfo(sessionData)
     - validateInstructorLeave()
     - Query sessions trùng
  2. Nếu có conflict → thêm vào conflicts
  3. Nếu không → thêm vào success
  ↓
sessionRepository.createBulk(successSessions)
  ↓
INSERT INTO session (...) VALUES (...), (...), ...
  ↓
Return { success, conflicts, summary }
```

**Backend Flow (EDIT MODE)**:
```
PUT /classes/:classId
  ↓
classController.updateClass()
  ↓
classService.updateClass(classId, updateData)
  ↓
classRepository.update(classId, updateData)
  ↓
UPDATE `class` SET ... WHERE ClassID = ?

POST /classes/:classId/schedule/update
  ↓
classScheduleController.updateClassSchedule()
  ↓
classCreationWizardService.updateClassSchedule(params)
  ↓
1. Validate single timeslot pattern (nếu DRAFT)
2. Lấy existingSessions
3. Xác định vùng thời gian cần cập nhật
4. Xóa sessions cũ trong vùng:
   sessionService.deleteSession(sessionId)
   ↓
   DELETE FROM session WHERE SessionID = ?
   ↓
   DELETE FROM attendance WHERE SessionID = ?
5. Preserve ZoomUUID từ sessions cũ
6. sessionService.createBulkSessions(preparedSessions)
   ↓
   INSERT INTO session (...) VALUES (...), (...), ...
  ↓
Return { success, conflicts, summary }
```

---

## 🔌 CÁC API ENDPOINTS

### 1. Tạo lớp mới
```
POST /api/classes
Headers: { Authorization: "Bearer <token>" }
Body: {
  Name: "JavaScript Fundamentals 2024",
  InstructorID: 1,
  CourseID: 1,
  Fee: 2500000,
  OpendatePlan: "2024-01-15",
  EnddatePlan: "2024-04-15",
  Numofsession: 10,
  Maxstudent: 30,
  ZoomID: "123456789",
  Zoompass: "password123",
  Status: "DRAFT"
}
Response: {
  success: true,
  message: "Tạo lớp học thành công",
  data: {
    ClassID: 16,
    Name: "JavaScript Fundamentals 2024",
    ...
  },
  ClassID: 16
}
```

### 2. Cập nhật lớp
```
PUT /api/classes/:classId
Headers: { Authorization: "Bearer <token>" }
Body: {
  Name: "JavaScript Fundamentals 2024 (Updated)",
  Fee: 3000000,
  ...
}
Response: {
  success: true,
  message: "Cập nhật lớp học thành công",
  data: { ... }
}
```

### 3. Tạo sessions hàng loạt
```
POST /api/sessions/bulk
Headers: { Authorization: "Bearer <token>" }
Body: {
  sessions: [
    {
      Title: "Session 1",
      Description: "",
      Date: "2024-01-15",
      TimeslotID: 1,
      InstructorID: 1,
      ClassID: 16
    },
    {
      Title: "Session 2",
      Description: "",
      Date: "2024-01-17",
      TimeslotID: 1,
      InstructorID: 1,
      ClassID: 16
    },
    ...
  ]
}
Response: {
  success: [
    { SessionID: 101, ... },
    { SessionID: 102, ... }
  ],
  conflicts: [
    {
      sessionIndex: 3,
      conflictType: "instructor_leave",
      conflictInfo: {
        message: "Giảng viên nghỉ: Holiday",
        date: "2024-01-22"
      }
    }
  ],
  summary: {
    total: 10,
    success: 9,
    conflicts: 1
  }
}
```

### 4. Cập nhật schedule
```
POST /api/classes/:classId/schedule/update
Headers: { Authorization: "Bearer <token>" }
Body: {
  sessions: [
    { Title: "Session 1", Date: "2024-01-15", TimeslotID: 1, ... },
    ...
  ],
  startDate: "2024-01-15", // Optional
  endDate: "2024-02-15"   // Optional
}
Response: {
  success: [...],
  conflicts: [...],
  summary: { total: 10, created: 9, conflicts: 1 }
}
```

### 5. Phân tích lịch bận
```
POST /api/classes/instructor/analyze-blocked-days
Headers: { Authorization: "Bearer <token>" }
Body: {
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
Response: {
  blockedDays: {
    1: [1]  // T2, ca 1 bị khóa
  },
  analysis: {
    "1-1": {
      manualOccurrences: 2,
      sessionOccurrences: 1,
      totalBusyCount: 3,
      isBlocked: true,
      blockedDates: ["2024-01-15 (OTHER)", "2024-01-22 (SESSION)"]
    },
    "3-1": {
      manualOccurrences: 0,
      sessionOccurrences: 0,
      totalBusyCount: 0,
      isBlocked: false,
      blockedDates: []
    }
  },
  summary: {
    totalWeeks: 4,
    totalManualConflicts: 2,
    totalSessionConflicts: 1
  }
}
```

### 6. Tìm ca rảnh
```
GET /api/classes/instructor/available-slots?InstructorID=1&TimeslotID=1&Day=T2&startDate=2024-01-15&numSuggestions=5&excludeClassId=16
Headers: { Authorization: "Bearer <token>" }
Response: [
  {
    date: "2024-01-22",
    dayOfWeek: "T2",
    timeslotId: 1,
    available: true,
    reason: null
  },
  {
    date: "2024-01-29",
    dayOfWeek: "T2",
    timeslotId: 1,
    available: false,
    reason: "GV nghỉ: Holiday"
  },
  {
    date: "2024-02-05",
    dayOfWeek: "T2",
    timeslotId: 1,
    available: true,
    reason: null
  }
]
```

### 7. Tìm ngày bắt đầu phù hợp
```
POST /api/classes/search-timeslots
Headers: { Authorization: "Bearer <token>" }
Body: {
  InstructorID: 1,
  DaysOfWeek: [1, 3, 5],
  TimeslotsByDay: { 1: [1], 3: [1], 5: [1] },
  Numofsession: 10,
  sessionsPerWeek: 3,
  requiredSlotsPerWeek: 3,
  currentStartDate: "2024-01-15"
}
Response: [
  {
    date: "2024-01-22",
    availableSlots: 3,
    totalSlots: 3,
    reason: "Đủ 3 ca/tuần (tất cả ca đều hợp lệ)"
  },
  {
    date: "2024-01-29",
    availableSlots: 2,
    totalSlots: 3,
    reason: "Thiếu 1 ca (1 ca bị trùng)"
  }
]
```

---

## 💾 DATABASE QUERIES

### Bảng `class`

**Tạo lớp mới**:
```sql
INSERT INTO `class` (
  Name, CourseID, InstructorID, Status, ZoomID, Zoompass, Fee,
  OpendatePlan, Opendate, EnddatePlan, Enddate,
  Numofsession, Maxstudent
) VALUES (
  'JavaScript Fundamentals 2024',
  1,
  1,
  'DRAFT',
  '123456789',
  'password123',
  2500000,
  '2024-01-15',
  NULL,  -- Sẽ được sync từ session
  '2024-04-15',
  NULL,  -- Sẽ được sync từ session
  10,
  30
);
```

**Lấy lớp theo ID**:
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
WHERE c.ClassID = 16
GROUP BY c.ClassID;
```

**Cập nhật lớp**:
```sql
UPDATE `class` 
SET 
  Name = 'JavaScript Fundamentals 2024 (Updated)',
  Fee = 3000000,
  Maxstudent = 35
WHERE ClassID = 16;
```

### Bảng `session`

**Tạo session**:
```sql
INSERT INTO session (
  Title, Description, ClassID, InstructorID, TimeslotID, Date, ZoomUUID
) VALUES (
  'Session 1',
  'Buổi học thứ 1',
  16,
  1,
  1,
  '2024-01-15',
  NULL
);
```

**Tạo sessions hàng loạt**:
```sql
INSERT INTO session (
  Title, Description, ClassID, InstructorID, TimeslotID, Date, ZoomUUID
) VALUES
  ('Session 1', '', 16, 1, 1, '2024-01-15', NULL),
  ('Session 2', '', 16, 1, 1, '2024-01-17', NULL),
  ('Session 3', '', 16, 1, 1, '2024-01-19', NULL),
  ...
  ('Session 10', '', 16, 1, 1, '2024-02-09', NULL);
```

**Lấy sessions theo ClassID**:
```sql
SELECT 
  s.*,
  t.StartTime, t.EndTime, t.Day,
  c.Name as className
FROM session s
LEFT JOIN timeslot t ON s.TimeslotID = t.TimeslotID
LEFT JOIN `class` c ON s.ClassID = c.ClassID
WHERE s.ClassID = 16
ORDER BY s.Date ASC, t.StartTime ASC;
```

**Kiểm tra conflict (trùng lịch dạy)**:
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
WHERE s.InstructorID = 1
  AND s.Date = '2024-01-15'
  AND s.TimeslotID = 1
  AND s.ClassID != 16;  -- excludeClassId
```

**Xóa session**:
```sql
-- Xóa attendance trước (cascade)
DELETE FROM attendance WHERE SessionID = 101;

-- Xóa session
DELETE FROM session WHERE SessionID = 101;
```

### Bảng `instructortimeslot`

**Lấy lịch bận (Status = OTHER)**:
```sql
SELECT 
  it.*,
  t.StartTime, t.EndTime, t.Day
FROM instructortimeslot it
LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
WHERE it.InstructorID = 1
  AND it.Status = 'OTHER'
  AND it.Date >= '2024-01-15'
  AND it.Date <= '2024-02-15';
```

**Lấy lịch nghỉ (Status = HOLIDAY)**:
```sql
SELECT 
  it.*,
  t.StartTime, t.EndTime, t.Day
FROM instructortimeslot it
LEFT JOIN timeslot t ON it.TimeslotID = t.TimeslotID
WHERE it.InstructorID = 1
  AND it.Status = 'HOLIDAY'
  AND it.Date = '2024-01-22';
```

---

## 📁 CÁC FILE LIÊN QUAN

### Frontend

#### Pages
- `ATPS_FE/fe/src/pages/admin/pages/CreateClassPage.js` - Entry point, xử lý submit

#### Components
- `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizard.js` - Wizard chính
- `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep1.js` - Bước 1
- `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep2.js` - Bước 2
- `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep3.js` - Bước 3
- `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizardStep4.js` - Bước 4

#### Utils
- `ATPS_FE/fe/src/utils/classWizardValidation.js` - Validation functions
- `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizard.utils.js` - Utility functions
- `ATPS_FE/fe/src/pages/admin/components/class-management/ClassWizard.constants.js` - Constants

#### Services
- `ATPS_FE/fe/src/apiServices/classService.js` - API service cho class
- `ATPS_FE/fe/src/apiServices/instructorService.js` - API service cho instructor

### Backend

#### Routes
- `ATPS_BE/routes/classRouter.js` - Routes cho class APIs
- `ATPS_BE/routes/sessionRouter.js` - Routes cho session APIs

#### Controllers
- `ATPS_BE/controllers/classController.js` - Controller cho class
- `ATPS_BE/controllers/classScheduleController.js` - Controller cho schedule
- `ATPS_BE/controllers/sessionController.js` - Controller cho session

#### Services
- `ATPS_BE/services/ClassService.js` - Service cho class
- `ATPS_BE/services/classCreationWizardService.js` - Service cho wizard
- `ATPS_BE/services/classScheduleService.js` - Service cho schedule
- `ATPS_BE/services/sessionService.js` - Service cho session

#### Repositories
- `ATPS_BE/repositories/classRepository.js` - Repository cho class
- `ATPS_BE/repositories/sessionRepository.js` - Repository cho session
- `ATPS_BE/repositories/timeslotRepository.js` - Repository cho timeslot
- `ATPS_BE/repositories/instructorTimeslotRepository.js` - Repository cho instructor timeslot

#### Utils
- `ATPS_BE/utils/sessionValidation.js` - Validation functions cho session
- `ATPS_BE/utils/validators.js` - Validators

#### Middlewares
- `ATPS_BE/middlewares/auth.js` - Authentication & Authorization

---

## 🔍 CHI TIẾT XỬ LÝ

### Validation Flow

**Frontend Validation**:
```javascript
// Step 1
validateStep1(formData) {
  - Name: required, non-empty
  - InstructorID: required, number > 0
  - Fee: number >= 0
  - Maxstudent: number > 0
}

// Step 2
validateStep2(formData) {
  - OpendatePlan: required, valid date (YYYY-MM-DD)
  - Numofsession: required, number > 0
}

// Step 3
validateStep3(formData) {
  - DaysOfWeek: array.length > 0
  - TimeslotsByDay: object với ít nhất 1 ngày có timeslots
  - sessions: array.length === Numofsession
}
```

**Backend Validation**:
```javascript
// createClass
- Name: required, non-empty
- InstructorID: required, number > 0
- OpendatePlan: required, format YYYY-MM-DD
- Numofsession: required, number > 0
- Maxstudent: required, number > 0

// createBulkSessions
- sessions: array, length > 0
- Mỗi session:
  - Date: required, format YYYY-MM-DD
  - TimeslotID: required, number > 0
  - ClassID: required, number > 0
  - InstructorID: required, number > 0
```

### Conflict Detection

**3 lần kiểm tra conflict**:

1. **Kiểm tra Mâu thuẫn (Ngày vs. Thứ)**:
   ```javascript
   validateDateDayConsistency(sessionData) {
     - Lấy Day từ timeslot
     - Lấy dayOfWeek từ Date
     - So sánh Day với dayOfWeek
     - Return { isValid, error }
   }
   ```

2. **Kiểm tra TRÙNG BUỔI**:
   ```javascript
   // Logic mới: Không cho trùng
   const slotKey = `${dateString}-${timeslotID}`;
   if (usedSlots.has(slotKey)) {
     // Conflict: Trùng buổi
   }
   ```

3. **Kiểm tra Lịch bận để dạy**:
   ```javascript
   validateInstructorLeave(sessionData, instructorType) {
     - Query instructortimeslot với Status = OTHER/HOLIDAY
     - Kiểm tra trùng Date, TimeslotID
     - Return { hasConflict, conflictInfo }
   }
   ```

4. **Kiểm tra Lịch DẠY (Session đã tồn tại)**:
   ```javascript
   checkSessionConflictInfo(sessionData, excludeSessionId, excludeClassId) {
     - Query session với cùng InstructorID, Date, TimeslotID
     - Loại trừ excludeClassId
     - Return { hasConflict, conflictType, conflictInfo }
   }
   ```

### Error Handling

**Frontend**:
```javascript
try {
  const result = await classService.createClass(classPayload);
  // Success
} catch (error) {
  // Parse error
  const errorMessage = error.response?.data?.message || error.message;
  
  // Hiển thị ErrorModal
  setErrorModal({
    open: true,
    title: "Lỗi Tạo Lớp Học",
    message: errorMessage,
    errors: { ... }
  });
}
```

**Backend**:
```javascript
try {
  const classData = await classService.createClass(data);
  res.status(201).json({ success: true, data: classData });
} catch (error) {
  console.error("Error creating class:", error);
  res.status(500).json({
    success: false,
    message: "Lỗi khi tạo lớp học",
    error: error.message
  });
}
```

---

## 📊 SƠ ĐỒ FLOW TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CreateClassPage                                            │
│    ├─ Load Data (instructors, courses, timeslots)          │
│    └─ handleSubmit()                                       │
│         ├─ Create/Update Class (POST/PUT /classes)          │
│         └─ Create Sessions (POST /sessions/bulk)            │
│                                                             │
│  ClassWizard                                                │
│    ├─ Step 1: Basic Info                                   │
│    ├─ Step 2: Schedule                                     │
│    │    └─ analyzeBlockedDays()                            │
│    ├─ Step 3: Sessions Detail                              │
│    │    ├─ analyzeBlockedDays()                            │
│    │    ├─ findAvailableInstructorSlots()                  │
│    │    └─ generatePreviewSessions()                       │
│    └─ Step 4: Review                                        │
│         └─ onSubmit() → CreateClassPage.handleSubmit()      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Routes (classRouter.js)                                    │
│    ├─ POST /classes → classController.createClass           │
│    ├─ PUT /classes/:id → classController.updateClass        │
│    ├─ POST /sessions/bulk → sessionController.createBulk   │
│    ├─ POST /classes/:id/schedule/update                     │
│    ├─ POST /classes/instructor/analyze-blocked-days         │
│    └─ GET /classes/instructor/available-slots               │
│                                                             │
│  Controllers                                                │
│    ├─ classController                                       │
│    │    ├─ createClass() → classService.createClass()      │
│    │    └─ updateClass() → classService.updateClass()      │
│    ├─ classScheduleController                               │
│    │    ├─ updateClassSchedule()                            │
│    │    ├─ analyzeBlockedDays()                             │
│    │    └─ findAvailableInstructorSlots()                   │
│    └─ sessionController                                     │
│         └─ createBulkSessions() → sessionService.createBulk │
│                                                             │
│  Services                                                   │
│    ├─ ClassService                                          │
│    │    └─ createClass() → classRepository.create()         │
│    ├─ classCreationWizardService                           │
│    │    ├─ updateClassSchedule()                            │
│    │    ├─ analyzeBlockedDays()                             │
│    │    └─ findAvailableInstructorSlots()                  │
│    └─ sessionService                                        │
│         ├─ createBulkSessions()                             │
│         └─ checkSessionConflictInfo()                       │
│                                                             │
│  Repositories                                               │
│    ├─ classRepository                                       │
│    │    └─ create() → INSERT INTO `class`                   │
│    └─ sessionRepository                                     │
│         └─ createBulk() → INSERT INTO session                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tables:                                                    │
│    ├─ class                                                 │
│    ├─ session                                               │
│    ├─ timeslot                                              │
│    ├─ instructortimeslot                                    │
│    └─ enrollment                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 KẾT LUẬN

Hệ thống tạo lớp học được thiết kế theo kiến trúc **3-layer** (Controller → Service → Repository) với các đặc điểm:

1. **Frontend**: Sử dụng Wizard 4 bước với validation từng bước
2. **Backend**: Xử lý validation, conflict detection, và database operations
3. **Database**: Lưu trữ class, session, timeslot, và instructor schedule

**Flow chính**:
1. User nhập thông tin → Frontend validate
2. Frontend gọi API → Backend validate và xử lý
3. Backend query database → Trả về kết quả
4. Frontend hiển thị kết quả hoặc lỗi

**Conflict Detection**: Hệ thống kiểm tra 4 loại conflict:
- Mâu thuẫn ngày/thứ
- Trùng buổi
- Lịch nghỉ của instructor
- Lịch dạy đã tồn tại

**Error Handling**: Có xử lý lỗi ở cả Frontend và Backend với thông báo rõ ràng cho user.

