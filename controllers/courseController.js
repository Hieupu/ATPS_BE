const Course = require("../models/course");
const Instructor = require("../models/instructor");
const Learner = require("../models/learner");

const courseController = {
  // Tạo khóa học mới
  createCourse: async (req, res) => {
    try {
      const courseData = {
        Title: req.body.Title,
        Description: req.body.Description,
        Duration: req.body.Duration,
        TuitionFee: req.body.TuitionFee,
        Status: req.body.Status || "Active",
        InstructorID: req.body.InstructorID,
      };

      // Validation
      if (
        !courseData.Title ||
        !courseData.Description ||
        !courseData.InstructorID
      ) {
        return res.status(400).json({
          success: false,
          message: "Title, Description và InstructorID là bắt buộc",
        });
      }

      // Kiểm tra instructor nếu có
      if (courseData.InstructorID) {
        const instructorExists = await Instructor.exists(
          courseData.InstructorID
        );
        if (!instructorExists) {
          return res.status(400).json({
            success: false,
            message: "Không tìm thấy giảng viên",
          });
        }
      }

      const newCourse = await Course.create(courseData);

      res.status(201).json({
        success: true,
        message: "Khóa học đã được tạo thành công",
        data: newCourse,
      });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo khóa học",
        error: error.message,
      });
    }
  },

  // Lấy khóa học của instructor (Instructor API)
  getInstructorCourses: async (req, res) => {
    try {
      const { instructorId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search || "",
        status: req.query.status || "",
        instructorId: instructorId,
      };

      const result = await Course.findAll(options);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách khóa học của instructor thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error getting instructor courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học của instructor",
        error: error.message,
      });
    }
  },

  // Lấy tất cả khóa học
  getAllCourses: async (req, res) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search || "",
        status: req.query.status || "",
        instructorId: req.query.instructorId || "",
      };

      const result = await Course.findAll(options);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách khóa học thành công",
        ...result,
      });
    } catch (error) {
      console.error("Error getting courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học",
        error: error.message,
      });
    }
  },

  // Lấy danh sách khóa học có thể enroll
  getAvailableCourses: async (req, res) => {
    try {
      const courses = await Course.getAvailableCourses();

      res.status(200).json({
        success: true,
        message: "Lấy danh sách khóa học có thể đăng ký thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting available courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học có thể đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy khóa học của instructor
  getInstructorCourses: async (req, res) => {
    try {
      const { instructorId } = req.query;

      if (!instructorId) {
        return res.status(400).json({
          success: false,
          message: "InstructorID là bắt buộc",
        });
      }

      const result = await Course.findAll({
        instructorId,
        page: 1,
        limit: 100, // Lấy tất cả
      });

      res.status(200).json({
        success: true,
        message: "Lấy danh sách khóa học giảng viên thành công",
        data: result.data,
      });
    } catch (error) {
      console.error("Error getting instructor courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học giảng viên",
        error: error.message,
      });
    }
  },

  // Lấy khóa học đã enroll của học viên
  getLearnerEnrolledCourses: async (req, res) => {
    try {
      const { learnerId } = req.query;

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          message: "LearnerID là bắt buộc",
        });
      }

      const courses = await Course.getEnrolledCourses(learnerId);

      res.status(200).json({
        success: true,
        message: "Lấy danh sách khóa học đã đăng ký thành công",
        data: courses,
      });
    } catch (error) {
      console.error("Error getting learner enrolled courses:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khóa học đã đăng ký",
        error: error.message,
      });
    }
  },

  // Lấy một khóa học theo ID
  getCourseById: async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin khóa học thành công",
        data: course,
      });
    } catch (error) {
      console.error("Error getting course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin khóa học",
        error: error.message,
      });
    }
  },

  // Cập nhật khóa học
  updateCourse: async (req, res) => {
    try {
      const courseId = req.params.id;

      // Kiểm tra khóa học có tồn tại không
      const exists = await Course.exists(courseId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      const courseData = {
        Title: req.body.Title,
        Description: req.body.Description,
        Duration: req.body.Duration,
        TuitionFee: req.body.TuitionFee,
        Status: req.body.Status,
        InstructorID: req.body.InstructorID,
      };

      const updatedCourse = await Course.update(courseId, courseData);

      res.status(200).json({
        success: true,
        message: "Cập nhật khóa học thành công",
        data: updatedCourse,
      });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật khóa học",
        error: error.message,
      });
    }
  },

  // Xóa khóa học
  deleteCourse: async (req, res) => {
    try {
      const courseId = req.params.id;

      // Kiểm tra khóa học có tồn tại không
      const exists = await Course.exists(courseId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      const deleted = await Course.delete(courseId);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: "Xóa khóa học thành công",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Không thể xóa khóa học",
        });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa khóa học",
        error: error.message,
      });
    }
  },

  // Thêm học viên vào khóa học
  addStudentToCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const { studentId, learnerId } = req.body;
      const learnerIdToAdd = studentId || learnerId;

      // Kiểm tra course và learner có tồn tại không
      const courseExists = await Course.exists(courseId);
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      const learnerExists = await Learner.exists(learnerIdToAdd);
      if (!learnerExists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên",
        });
      }

      const result = await Course.addStudent(courseId, learnerIdToAdd);

      res.status(201).json({
        success: true,
        message: "Thêm học viên vào khóa học thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error adding student:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi thêm học viên vào khóa học",
        error: error.message,
      });
    }
  },

  // Xóa học viên khỏi khóa học
  removeStudentFromCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const studentId = req.params.studentId;

      const removed = await Course.removeStudent(courseId, studentId);

      if (removed) {
        res.status(200).json({
          success: true,
          message: "Xóa học viên khỏi khóa học thành công",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên trong khóa học này",
        });
      }
    } catch (error) {
      console.error("Error removing student:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa học viên khỏi khóa học",
        error: error.message,
      });
    }
  },

  // Thêm timeslot (lịch học) cho khóa học
  addTimeslotToCourse: async (req, res) => {
    try {
      const courseId = req.params.id;
      const timeslotData = {
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        date: req.body.date,
        lessonId: req.body.lessonId,
      };

      // Kiểm tra course có tồn tại không
      const courseExists = await Course.exists(courseId);
      if (!courseExists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      const result = await Course.addTimeslot(courseId, timeslotData);

      res.status(201).json({
        success: true,
        message: "Thêm lịch học thành công",
        data: result,
      });
    } catch (error) {
      console.error("Error adding timeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm lịch học",
        error: error.message,
      });
    }
  },

  // Xóa timeslot
  deleteTimeslot: async (req, res) => {
    try {
      const timeslotId = req.params.timeslotId;

      const deleted = await Course.deleteTimeslot(timeslotId);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: "Xóa lịch học thành công",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Không tìm thấy lịch học",
        });
      }
    } catch (error) {
      console.error("Error deleting timeslot:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa lịch học",
        error: error.message,
      });
    }
  },

  // Common APIs - Lấy danh sách giảng viên
  getInstructors: async (req, res) => {
    try {
      const instructors = await Instructor.findAll();
      res.json({
        success: true,
        message: "Lấy danh sách giảng viên thành công",
        data: instructors,
      });
    } catch (error) {
      console.error("Error getting instructors:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách giảng viên",
        error: error.message,
      });
    }
  },

  // Common APIs - Lấy thông tin giảng viên theo ID
  getInstructorById: async (req, res) => {
    try {
      const { instructorId } = req.params;
      const instructor = await Instructor.findById(instructorId);

      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin giảng viên thành công",
        data: instructor,
      });
    } catch (error) {
      console.error("Error getting instructor:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin giảng viên",
        error: error.message,
      });
    }
  },

  // Common APIs - Lấy danh sách học viên
  getLearners: async (req, res) => {
    try {
      const learners = await Learner.findAll();
      res.json({
        success: true,
        message: "Lấy danh sách học viên thành công",
        data: learners,
      });
    } catch (error) {
      console.error("Error getting learners:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách học viên",
        error: error.message,
      });
    }
  },

  // Common APIs - Lấy thông tin học viên theo ID
  getLearnerById: async (req, res) => {
    try {
      const { learnerId } = req.params;
      const learner = await Learner.findById(learnerId);

      if (!learner) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học viên",
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin học viên thành công",
        data: learner,
      });
    } catch (error) {
      console.error("Error getting learner:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin học viên",
        error: error.message,
      });
    }
  },

  // Gán khóa học cho lớp (Instructor API)
  assignCourseToClass: async (req, res) => {
    try {
     
      const { classId } = req.params;
      const { CourseID } = req.body;

      // Validation
      if (!CourseID) {
        return res.status(400).json({
          success: false,
          message: "CourseID là bắt buộc",
        });
      }

      // Kiểm tra course có tồn tại không
      const course = await Course.findById(CourseID);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khóa học",
        });
      }

      // Cập nhật class với CourseID
      const Class = require("../models/class");
      const updatedClass = await Class.update(classId, { CourseID });

      if (!updatedClass) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy lớp học",
        });
      }

      res.json({
        success: true,
        message: "Gán khóa học cho lớp thành công",
        data: {
          ClassID: classId,
          ClassName: updatedClass.ClassName,
          CourseID: CourseID,
          CourseTitle: course.Title,
        },
      });
    } catch (error) {
      console.error("Error assigning course to class:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi gán khóa học cho lớp",
        error: error.message,
      });
    }
  },
};

module.exports = courseController;
