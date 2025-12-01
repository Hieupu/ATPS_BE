// services/learnerassignmentService.js
const learnerassignmentRepository = require('../repositories/learnerassignmentRepository');
const courseRepository = require('../repositories/courseRepository');
const  uploadToCloudinary  = require('../utils/uploadCloudinary');

class LearnerAssignmentService {
  async getAssignmentDetails(assignmentId, accountId) {
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      throw new Error("Learner profile not found");
    }

    const assignment = await learnerassignmentRepository.getAssignmentById(assignmentId, learner.LearnerID);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if learner is enrolled in the course
    const isEnrolled = await courseRepository.checkEnrollment(assignment.CourseID, learner.LearnerID);
    if (!isEnrolled) {
      throw new Error("You are not enrolled in this course");
    }

    return assignment;
  }

async getAssignmentQuestions(assignmentId, accountId) {
  try {
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      throw new Error("Learner profile not found");
    }

    const assignment = await learnerassignmentRepository.getAssignmentById(assignmentId, learner.LearnerID);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const isEnrolled = await courseRepository.checkEnrollment(assignment.CourseID, learner.LearnerID);
    if (!isEnrolled) {
      throw new Error("You are not enrolled in this course");
    }

    if (assignment.Status !== 'active') {
      throw new Error("Assignment is not available");
    }

    if (new Date(assignment.Deadline) < new Date()) {
      throw new Error("Assignment deadline has passed");
    }

    // ✅ Giờ getAssignmentQuestions đã bao gồm Options rồi
    const questions = await learnerassignmentRepository.getAssignmentQuestions(assignmentId);

    return {
      assignment,
      questions
    };
  } catch (error) {
    console.error("Get assignment questions error:", error);
    throw error;
  }
}

async submitAssignment(assignmentId, accountId, submissionData) {
  try {
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      throw new Error("Learner profile not found");
    }

    const assignment = await learnerassignmentRepository.getAssignmentById(assignmentId, learner.LearnerID);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const isEnrolled = await courseRepository.checkEnrollment(assignment.CourseID, learner.LearnerID);
    if (!isEnrolled) {
      throw new Error("You are not enrolled in this course");
    }

    if (assignment.Status !== 'active') {
      throw new Error("Assignment is not available");
    }

    const now = new Date();
    const deadline = new Date(assignment.Deadline);
    const isLate = now > deadline;

    const existingSubmission = await learnerassignmentRepository.getSubmissionByAssignmentAndLearner(
      assignmentId, 
      learner.LearnerID
    );

    if (existingSubmission) {
      throw new Error("Assignment already submitted");
    }

    let submissionScore = 0;
    let answers = [];
    let audioURL = null;
    let durationSec = null;

    console.log("Submission data received:", submissionData); // DEBUG

    // Xử lý upload file audio cho audio assignment
    if (assignment.Type === 'audio' && submissionData.audioFile) {
      try {
        // Upload audio file lên Cloudinary
        audioURL = await uploadToCloudinary(submissionData.audioFile, 'audio');
        durationSec = submissionData.durationSec || null;
        
        console.log("Audio uploaded to Cloudinary:", audioURL);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        throw new Error("Failed to upload audio file");
      }
    }

    // Xử lý answers cho TẤT CẢ assignment types có questions
    if (submissionData.answers && Object.keys(submissionData.answers).length > 0) {
      console.log("Processing answers:", submissionData.answers); // DEBUG
      
      // Chuyển đổi answers từ object sang array
      answers = Object.entries(submissionData.answers).map(([assignmentQuestionId, answer]) => ({
        assignmentQuestionId: parseInt(assignmentQuestionId),
        answer: answer.toString() // Đảm bảo answer là string
      }));
      
      console.log("Converted answers:", answers); // DEBUG
      
      // Tính điểm cho quiz questions
      submissionScore = await this.handleQuizSubmission(assignmentId, answers, learner.LearnerID);
      console.log("Calculated score:", submissionScore); // DEBUG
    }

    // Create submission
    const submission = await learnerassignmentRepository.createSubmission({
      assignmentId,
      learnerId: learner.LearnerID,
      submissionDate: now,
      content: submissionData.content,
      audioURL: audioURL,
      durationSec: durationSec,
      score: submissionScore,
      status: isLate ? 'late' : 'submitted',
      fileURL: null
    });

    console.log("Submission created:", submission); // DEBUG

    // Save answers cho TẤT CẢ assignment types có answers
    if (answers.length > 0) {
      console.log("Saving answers to database..."); // DEBUG
      for (const answer of answers) {
        console.log("Saving answer:", answer); // DEBUG
        await learnerassignmentRepository.saveAssignmentAnswer({
          learnerId: learner.LearnerID,
          assignmentQuestionId: answer.assignmentQuestionId,
          answer: answer.answer
        });
      }
      console.log("All answers saved"); // DEBUG
    }

    return {
      ...submission,
      message: "Assignment submitted successfully"
    };
  } catch (error) {
    console.error("Submit assignment error:", error);
    throw error;
  }
}

async handleQuizSubmission(assignmentId, answers, learnerId) {
  let totalScore = 0;
  let totalPoints = 0;

  console.log("Starting quiz submission for assignment:", assignmentId); // DEBUG
  console.log("Answers to check:", answers); // DEBUG

  // Lấy tất cả questions của assignment
  const allQuestions = await learnerassignmentRepository.getAssignmentQuestions(assignmentId);
  console.log("All questions retrieved:", allQuestions.length); // DEBUG
  
  // Tạo map để lookup nhanh
  const questionsMap = new Map();
  allQuestions.forEach(q => {
    questionsMap.set(q.AssignmentQuestionId, q);
  });

  console.log("Questions map size:", questionsMap.size); // DEBUG

  for (const answer of answers) {
    const question = questionsMap.get(answer.assignmentQuestionId);
    
    if (!question) {
      console.log("Question not found for AssignmentQuestionId:", answer.assignmentQuestionId);
      continue;
    }

    console.log("Checking question:", question.QuestionID, "Type:", question.Type); // DEBUG
    console.log("User answer:", answer.answer, "Correct answer:", question.CorrectAnswer); // DEBUG

    totalPoints += question.Point || 1;

    const isCorrect = await this.checkAnswerCorrectness(question, answer.answer);
    console.log("Is correct:", isCorrect); // DEBUG
    
    if (isCorrect) {
      totalScore += question.Point || 1;
    }
  }

  console.log("Total score:", totalScore, "Total points:", totalPoints); // DEBUG

  return totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
}

async checkAnswerCorrectness(question, userAnswer) {
  console.log("Checking correctness - Question:", question.QuestionID, "User answer:", userAnswer); // DEBUG
  
  if (!userAnswer || userAnswer === '') {
    console.log("User answer is empty");
    return false;
  }

  switch (question.Type) {
    case 'multiple_choice':
      const correctOption = question.Options?.find(opt => opt.IsCorrect === 1);
      console.log("Multiple choice - Correct option:", correctOption?.OptionID); // DEBUG
      return correctOption && userAnswer === correctOption.OptionID.toString();

    case 'true_false':
      console.log("True/False - User:", userAnswer, "Correct:", question.CorrectAnswer); // DEBUG
      return userAnswer.toLowerCase() === question.CorrectAnswer.toLowerCase();

    case 'fill_in_blank':
      console.log("Fill in blank - User:", userAnswer, "Correct:", question.CorrectAnswer); // DEBUG
      return userAnswer.toLowerCase().trim() === question.CorrectAnswer.toLowerCase().trim();

    case 'matching':
      console.log("Matching - User:", userAnswer, "Correct:", question.CorrectAnswer); // DEBUG
      return this.checkMatchingAnswer(question, userAnswer);

    case 'essay':
    case 'speaking':
      console.log("Essay/Speaking - Manual grading required"); // DEBUG
      return null; // Manual grading

    default:
      console.log("Unknown question type:", question.Type); // DEBUG
      return false;
  }
}

checkMatchingAnswer(question, userAnswer) {
  try {
    console.log("Matching - Raw user answer:", userAnswer); // DEBUG
    console.log("Matching - Raw correct answer:", question.CorrectAnswer); // DEBUG
    
    const userPairs = typeof userAnswer === 'string' ? JSON.parse(userAnswer) : userAnswer;
    const correctPairs = typeof question.CorrectAnswer === 'string' ? JSON.parse(question.CorrectAnswer) : question.CorrectAnswer;
    
    console.log("Matching - Parsed user pairs:", userPairs); // DEBUG
    console.log("Matching - Parsed correct pairs:", correctPairs); // DEBUG
    
    // So sánh các cặp
    const userSorted = JSON.stringify(userPairs.sort((a, b) => a.left.localeCompare(b.left)));
    const correctSorted = JSON.stringify(correctPairs.sort((a, b) => a.left.localeCompare(b.left)));
    
    console.log("Matching - Sorted user:", userSorted); // DEBUG
    console.log("Matching - Sorted correct:", correctSorted); // DEBUG
    
    return userSorted === correctSorted;
  } catch (error) {
    console.error("Matching answer error:", error);
    return false;
  }
}

  checkMatchingAnswer(question, userAnswer) {
    // Implement matching answer validation
    // This depends on how you store matching pairs
    try {
      const userPairs = JSON.parse(userAnswer);
      const correctPairs = JSON.parse(question.CorrectAnswer);
      
      // Compare pairs logic
      return JSON.stringify(userPairs.sort()) === JSON.stringify(correctPairs.sort());
    } catch (error) {
      return false;
    }
  }

  async getSubmissionDetails(submissionId, accountId) {
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      throw new Error("Learner profile not found");
    }

    const submission = await learnerassignmentRepository.getSubmissionById(submissionId, learner.LearnerID);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Get submission assets
    submission.assets = await learnerassignmentRepository.getSubmissionAssets(submissionId);

    // For quiz submissions, get answers and questions
    if (submission.Assignment.Type === 'quiz') {
      submission.answers = await learnerassignmentRepository.getSubmissionAnswers(submissionId, learner.LearnerID);
    }

    return submission;
  }

  async getAssignmentResults(assignmentId, accountId) {
    const learner = await courseRepository.getLearnerByAccountId(accountId);
    if (!learner) {
      throw new Error("Learner profile not found");
    }

    const assignment = await learnerassignmentRepository.getAssignmentById(assignmentId, learner.LearnerID);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const submission = await learnerassignmentRepository.getSubmissionByAssignmentAndLearner(
      assignmentId, 
      learner.LearnerID
    );

    if (!submission) {
      throw new Error("No submission found for this assignment");
    }

    const results = {
      assignment,
      submission,
      canShowAnswers: this.canShowAnswers(assignment, submission)
    };

    if (results.canShowAnswers && assignment.Type === 'quiz') {
      results.questions = await learnerassignmentRepository.getAssignmentQuestionsWithCorrectAnswers(assignmentId);
      results.userAnswers = await learnerassignmentRepository.getSubmissionAnswers(submission.SubmissionID, learner.LearnerID);
    }

    return results;
  }

  canShowAnswers(assignment, submission) {
    if (!assignment.ShowAnswersAfter) return false;

    switch (assignment.ShowAnswersAfter) {
      case 'after_submission':
        return true;
      
      case 'after_deadline':
        return new Date() > new Date(assignment.Deadline);
      
      case 'never':
        return false;
      
      default:
        return false;
    }
  }
}

module.exports = new LearnerAssignmentService();