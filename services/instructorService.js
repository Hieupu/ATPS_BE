const instructorRepository = require("../repositories/instructorRepository");
const courseRepository = require("../repositories/courseRepository");

class InstructorService {
  async listInstructors() {
    const instructors = await instructorRepository.getAllInstructors();
    // enrich with stats
    const enriched = await Promise.all(
      instructors.map(async (i) => ({
        ...i,
        ...(await courseRepository
          .getInstructorStats(i.InstructorID)
          .catch(() => ({
            TotalCourses: 0,
            TotalStudents: 0,
          }))),
      }))
    );
    return enriched;
  }

  async getInstructor(instructorId) {
    const instructor = await instructorRepository.getInstructorById(
      instructorId
    );
    if (!instructor) return null;

    const stats = await courseRepository
      .getInstructorStats(instructor.InstructorID)
      .catch(() => ({ TotalCourses: 0, TotalStudents: 0 }));

    const reviews = await instructorRepository.getInstructorReviews(
      instructor.InstructorID,
      20
    );

    return { ...instructor, ...stats, Reviews: reviews };
  }

  async searchInstructors(params) {
    return await instructorRepository.searchInstructors(params);
  }
}

module.exports = new InstructorService();
