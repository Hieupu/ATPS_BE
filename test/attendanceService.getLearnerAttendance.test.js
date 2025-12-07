jest.mock("../repositories/attendanceRepository", () => ({
  getLearnerAttendance: jest.fn(),
}));

const attendanceRepository = require("../repositories/attendanceRepository");
const attendanceService = require("../services/attendanceService");

describe("attendanceService - getLearnerAttendance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 - learnerId hợp lệ, có bản ghi -> trả về danh sách đã format với AttendancePercentage > 0", async () => {
    attendanceRepository.getLearnerAttendance.mockResolvedValue([
      {
        AttendanceID: 1,
        Status: "Present",
        Date: "2024-01-01",
        SessionDate: "2024-01-01",
        SessionID: 10,
        SessionTitle: "Session 1",
        SessionDescription: "Desc",
        StartTime: "09:00:00",
        EndTime: "10:00:00",
        DayOfWeek: "Mon",
        InstructorID: 3,
        InstructorName: "Teacher A",
        InstructorAvatar: "avatar.png",
        CourseID: 5,
        CourseTitle: "Course A",
        CourseImage: "img.png",
        ClassID: 7,
        ClassName: "Class 1",
        ZoomID: "zoom1",
        Zoompass: "123",
        TotalPresent: 3,
        TotalLearners: 5,
      },
    ]);

    const result = await attendanceService.getLearnerAttendance(3);

    expect(attendanceRepository.getLearnerAttendance).toHaveBeenCalledWith(3);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      AttendanceID: 1,
      Status: "Present",
      StatusText: "Có mặt",
      Time: "09:00 - 10:00",
      AttendancePercentage: 60,
    });
  });

  test("UTCID02 - learnerId hợp lệ nhưng không có bản ghi -> trả về mảng rỗng", async () => {
    attendanceRepository.getLearnerAttendance.mockResolvedValue([]);

    const result = await attendanceService.getLearnerAttendance(5);

    expect(attendanceRepository.getLearnerAttendance).toHaveBeenCalledWith(5);
    expect(result).toEqual([]);
  });

  test("UTCID03 - TotalLearners = 0 -> AttendancePercentage = 0", async () => {
    attendanceRepository.getLearnerAttendance.mockResolvedValue([
      {
        AttendanceID: 2,
        Status: "Absent",
        Date: "2024-01-02",
        SessionDate: "2024-01-02",
        SessionID: 11,
        SessionTitle: "Session 2",
        SessionDescription: "Desc",
        StartTime: "10:00:00",
        EndTime: "11:00:00",
        DayOfWeek: "Tue",
        InstructorID: 4,
        InstructorName: "Teacher B",
        InstructorAvatar: "avatar2.png",
        CourseID: 6,
        CourseTitle: "Course B",
        CourseImage: "img2.png",
        ClassID: 8,
        ClassName: "Class 2",
        ZoomID: "zoom2",
        Zoompass: "456",
        TotalPresent: 0,
        TotalLearners: 0,
      },
    ]);

    const result = await attendanceService.getLearnerAttendance(4);

    expect(result[0].AttendancePercentage).toBe(0);
  });

  test("UTCID04 - TotalLearners > 0 nhưng TotalPresent = 0 -> AttendancePercentage = 0", async () => {
    attendanceRepository.getLearnerAttendance.mockResolvedValue([
      {
        AttendanceID: 3,
        Status: "Absent",
        Date: "2024-01-03",
        SessionDate: "2024-01-03",
        SessionID: 12,
        SessionTitle: "Session 3",
        SessionDescription: "Desc",
        StartTime: "13:00:00",
        EndTime: "14:00:00",
        DayOfWeek: "Wed",
        InstructorID: 5,
        InstructorName: "Teacher C",
        InstructorAvatar: "avatar3.png",
        CourseID: 7,
        CourseTitle: "Course C",
        CourseImage: "img3.png",
        ClassID: 9,
        ClassName: "Class 3",
        ZoomID: "zoom3",
        Zoompass: "789",
        TotalPresent: 0,
        TotalLearners: 10,
      },
    ]);

    const result = await attendanceService.getLearnerAttendance(6);

    expect(result[0].AttendancePercentage).toBe(0);
  });

  test("UTCID05 - nhiều bản ghi với các class khác nhau -> trả về đầy đủ, không lỗi", async () => {
    attendanceRepository.getLearnerAttendance.mockResolvedValue([
      {
        AttendanceID: 4,
        Status: "Present",
        Date: "2024-01-04",
        SessionDate: "2024-01-04",
        SessionID: 13,
        SessionTitle: "Session 4",
        SessionDescription: "Desc",
        StartTime: "15:00:00",
        EndTime: "16:00:00",
        DayOfWeek: "Thu",
        InstructorID: 6,
        InstructorName: "Teacher D",
        InstructorAvatar: "avatar4.png",
        CourseID: 8,
        CourseTitle: "Course D",
        CourseImage: "img4.png",
        ClassID: 10,
        ClassName: "Class 4",
        ZoomID: "zoom4",
        Zoompass: "000",
        TotalPresent: 5,
        TotalLearners: 5,
      },
      {
        AttendanceID: 5,
        Status: "Late",
        Date: "2024-01-05",
        SessionDate: "2024-01-05",
        SessionID: 14,
        SessionTitle: "Session 5",
        SessionDescription: "Desc",
        StartTime: "17:00:00",
        EndTime: "18:00:00",
        DayOfWeek: "Fri",
        InstructorID: 7,
        InstructorName: "Teacher E",
        InstructorAvatar: "avatar5.png",
        CourseID: 9,
        CourseTitle: "Course E",
        CourseImage: "img5.png",
        ClassID: 11,
        ClassName: "Class 5",
        ZoomID: "zoom5",
        Zoompass: "111",
        TotalPresent: 3,
        TotalLearners: 5,
      },
    ]);

    const result = await attendanceService.getLearnerAttendance(7);

    expect(result).toHaveLength(2);
    expect(result[0].ClassName).toBe("Class 4");
    expect(result[1].ClassName).toBe("Class 5");
  });

  test("UTCID06 - repository ném lỗi -> service log và propagate lỗi", async () => {
    attendanceRepository.getLearnerAttendance.mockRejectedValue(
      new Error("DB error")
    );

    await expect(
      attendanceService.getLearnerAttendance(8)
    ).rejects.toThrow("DB error");
  });
});


