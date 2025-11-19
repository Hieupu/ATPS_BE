const {
  createAssignmentService,
  getAssignmentsService,
  getAssignmentDetailService,
  updateAssignmentService,
  deleteAssignmentService,
  getUnitsService,
  getUnitsByCourseService,
  getCoursesService,
  getAssignmentStatsService,
  getAllAssignmentsStatsService,
  getAssignmentQuestionsService,
  createAndAddQuestionService,
  removeQuestionService,
} = require("../services/assignmentService");
const cloudinary = require("../config/cloudinary");
const XLSX = require("xlsx");

// Tạo assignment
const createAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = await createAssignmentService(instructorAccId, req.body);
    res.status(201).json({ message: "Tạo bài tập thành công", assignmentId });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

// Danh sách assignment của instructor
const getAssignments = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignments = await getAssignmentsService(instructorAccId);
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài tập" });
  }
};

// Chi tiết assignment
const getAssignmentDetail = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const detail = await getAssignmentDetailService(instructorAccId, assignmentId);
    res.json(detail);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

// Cập nhật assignment
const updateAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    await updateAssignmentService(instructorAccId, assignmentId, req.body);
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

// Xóa mềm
const deleteAssignment = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const result = await deleteAssignmentService(instructorAccId, assignmentId);
    res.json({ message: "Đã xóa bài tập (soft delete)", assignment: result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

// Lấy units
const getUnits = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const { courseId } = req.query;
    const units = courseId
      ? await getUnitsByCourseService(instructorAccId, Number(courseId))
      : await getUnitsService(instructorAccId);
    res.status(200).json({ units });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách Unit", error: err.message });
  }
};

// Lấy courses
const getCourses = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const courses = await getCoursesService(instructorAccId);
    res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ message: "Không thể lấy danh sách Course", error: err.message });
  }
};

// Upload file (Cloudinary)
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file nào được tải lên" });
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "assignments", resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ message: "Upload thất bại", error: error.message });
        }
        return res.status(200).json({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          size: result.bytes,
        });
      }
    );
    const { Readable } = require("stream");
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Upload thất bại", error: err.message });
  }
};

// Stats
const getAllAssignmentsStats = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const stats = await getAllAssignmentsStatsService(instructorAccId);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy stats" });
  }
};

const getAssignmentStats = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const stats = await getAssignmentStatsService(instructorAccId, assignmentId);
    res.json(stats);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

// Questions
const getAssignmentQuestions = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const questions = await getAssignmentQuestionsService(instructorAccId, assignmentId);
    res.json({ questions });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

const createAndAddQuestion = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const questions = Array.isArray(req.body.questions)
      ? req.body.questions
      : [req.body];

    if (!questions.length) {
      return res.status(400).json({ message: "Danh sách câu hỏi trống" });
    }

    const createdQuestions = [];

    for (const q of questions) {
      if (!q.content || !q.content.trim()) {
        return res
          .status(400)
          .json({ message: "Nội dung câu hỏi là bắt buộc" });
      }

      const questionId = await createAndAddQuestionService(
        instructorAccId,
        assignmentId,
        q
      );
      createdQuestions.push(questionId);
    }

    res
      .status(201)
      .json({
        message: "Thêm câu hỏi thành công",
        questionIds: createdQuestions,
      });
  } catch (err) {
    console.error("Lỗi khi thêm câu hỏi:", err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Lỗi hệ thống" });
  }
};


const removeQuestion = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);
    const questionId = Number(req.params.questionId);
    await removeQuestionService(instructorAccId, assignmentId, questionId);
    res.json({ message: "Xóa câu hỏi thành công" });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

// Import câu hỏi từ Excel 
const importQuestionsFromExcel = async (req, res) => {
  try {
    const instructorAccId = req.user.id;
    const assignmentId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }

    // Đọc file Excel từ buffer
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // defval: "" để ô trống không bị undefined
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ message: "File Excel không có dữ liệu" });
    }

    const questionIds = [];
    const errors = [];

    // Hàm tách danh sách trong 1 ô (nhiều dòng hoặc dùng ;)
    const splitCell = (val) =>
      val
        .toString()
        .split(/\r?\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);
    const skipRowIndexes = new Set();
    for (let index = 0; index < rows.length; index++) {
      if (skipRowIndexes.has(index)) continue;
      const row = rows[index];

      const rawType =
        row["Loại"] || row["Loai"] || row["Type"] || row["type"] || "";
      const type = rawType.toString().trim().toLowerCase();

      // Bỏ qua dòng hoàn toàn trống
      const hasAnyData = Object.values(row).some(
        (v) => v !== null && v !== undefined && v.toString().trim() !== ""
      );
      if (!hasAnyData) continue;

      if (!type) {
        errors.push({ row: index + 2, reason: "Thiếu cột Loại" });
        continue;
      }

      // Các cột chung
      const topic =
        (row["Chủ đề"] || row["Chu de"] || row["Topic"] || "").toString();
      const content =
        (row["Nội dung"] || row["Noi dung"] || row["Content"] || "").toString();
      const level =
        (row["Mức độ"] || row["Muc do"] || row["Level"] || "").toString();
      const pointRaw = row["Điểm"] || row["Diem"] || row["Point"] || 1;
      const point = Number(pointRaw) || 1;

      if (!content.trim()) {
        errors.push({ row: index + 2, reason: "Nội dung câu hỏi trống" });
        continue;
      }

      const baseQuestion = {
        content: content.trim(),
        type,
        point,
        topic: topic.trim() || null,
        level: level.trim() || null,
      };

      let questionPayload = null;

      // ====== XỬ LÝ THEO LOẠI ======
      switch (type) {
        case "multiple_choice": {
          const options = [];

          for (let i = 1; i <= 4; i++) {
            const optContent =
              row[`Tùy chọn ${i}`] ||
              row[`Tuy chon ${i}`] ||
              row[`Option ${i}`] ||
              "";
            if (optContent && optContent.toString().trim()) {
              options.push({
                content: optContent.toString().trim(),
                isCorrect: false,
              });
            }
          }

          const answerRaw =
            row["Đáp án"] || row["Dap an"] || row["Answer"] || "";
          const answer = answerRaw.toString().trim();

          if (!options.length) {
            errors.push({
              row: index + 2,
              reason: "multiple_choice cần ít nhất 1 lựa chọn",
            });
            continue;
          }

          if (answer) {
            // Đáp án: 1,2 hoặc A,B,...
            const answerIndex =
              /^[1-4]$/.test(answer)
                ? Number(answer) - 1
                : "ABCD".indexOf(answer.toUpperCase());

            if (answerIndex >= 0 && answerIndex < options.length) {
              options[answerIndex].isCorrect = true;
            } else {
              errors.push({
                row: index + 2,
                reason: "Đáp án không hợp lệ cho multiple_choice",
              });
              continue;
            }
          } else {
            errors.push({
              row: index + 2,
              reason: "Thiếu cột Đáp án cho multiple_choice",
            });
            continue;
          }

          questionPayload = { ...baseQuestion, options, correctAnswer: null };
          break;
        }

        case "true_false": {
          const answerRaw =
            row["Đáp án"] || row["Dap an"] || row["Answer"] || "";
          const answer = answerRaw.toString().trim().toLowerCase();

          if (!["true", "false"].includes(answer)) {
            errors.push({
              row: index + 2,
              reason: "Đáp án true_false phải là 'true' hoặc 'false'",
            });
            continue;
          }

          questionPayload = {
            ...baseQuestion,
            correctAnswer: answer, // service sẽ kiểm tra
            options: [],
          };
          break;
        }

        case "fill_in_blank": {
          const answerRaw =
            row["Đáp án"] || row["Dap an"] || row["Answer"] || "";
          const answer = answerRaw.toString().trim();

          if (!answer) {
            errors.push({
              row: index + 2,
              reason: "Đáp án cho fill_in_blank đang trống",
            });
            continue;
          }

          questionPayload = {
            ...baseQuestion,
            correctAnswer: answer,
            options: [],
          };
          break;
        }

        case "matching": {
          // Dòng hiện tại là dòng "chính" của câu hỏi matching
          const leftRaw =
            row["Cặp A (Trái)"] ||
            row["Cap A (Trai)"] ||
            row["Cap A"] ||
            "";
          const rightRaw =
            row["Cặp B (Phải)"] ||
            row["Cap B (Phai)"] ||
            row["Cap B"] ||
            "";

          let leftList = splitCell(leftRaw);
          let rightList = splitCell(rightRaw);

          // 👉 Nhìn xuống các dòng tiếp theo: nếu Loại rỗng và chỉ có Cặp A/B
          //    thì coi là cặp nối tiếp của cùng câu hỏi
          for (let j = index + 1; j < rows.length; j++) {
            const next = rows[j];

            const nextRawType =
              next["Loại"] || next["Loai"] || next["Type"] || next["type"] || "";
            const nextType = nextRawType.toString().trim().toLowerCase();

            const nextContent =
              (next["Nội dung"] || next["Noi dung"] || next["Content"] || "")
                .toString()
                .trim();

            const nextLeftRaw =
              next["Cặp A (Trái)"] ||
              next["Cap A (Trai)"] ||
              next["Cap A"] ||
              "";
            const nextRightRaw =
              next["Cặp B (Phải)"] ||
              next["Cap B (Phai)"] ||
              next["Cap B"] ||
              "";

            const nextHasPair =
              nextLeftRaw.toString().trim() || nextRightRaw.toString().trim();

            // Dòng trống hoàn toàn -> kết thúc nhóm
            const nextHasAnyData = Object.values(next).some(
              (v) => v !== null && v !== undefined && v.toString().trim() !== ""
            );
            if (!nextHasAnyData) break;

            // Nếu thấy dòng bắt đầu câu hỏi mới (có type hoặc có nội dung) -> dừng
            if (nextType || nextContent) break;

            // Nếu là dòng chỉ chứa thêm cặp A/B -> gộp vào, đánh dấu skip
            if (nextHasPair) {
              const moreLeft = splitCell(nextLeftRaw);
              const moreRight = splitCell(nextRightRaw);
              // nối thêm
              leftList = leftList.concat(moreLeft);
              rightList = rightList.concat(moreRight);

              skipRowIndexes.add(j); // dòng này không xử lý riêng nữa
            } else {
              // Dòng có gì lạ lạ -> dừng
              break;
            }
          }

          if (!leftList.length && !rightList.length) {
            errors.push({
              row: index + 2,
              reason: "matching phải có ít nhất 1 cặp A/B",
            });
            continue;
          }

          if (leftList.length !== rightList.length) {
            errors.push({
              row: index + 2,
              reason: `Số lượng cặp A (${leftList.length}) và B (${rightList.length}) không khớp`,
            });
            continue;
          }

          const pairs = {};
          for (let i = 0; i < leftList.length; i++) {
            pairs[leftList[i]] = rightList[i];
          }

          questionPayload = {
            ...baseQuestion,
            correctAnswer: pairs, // object, service sẽ JSON.stringify
            options: [],
          };
          break;
        }

        default: {
          errors.push({
            row: index + 2,
            reason: `Loại câu hỏi không hỗ trợ: ${type}`,
          });
          continue;
        }
      }

      try {
        const qId = await createAndAddQuestionService(
          instructorAccId,
          assignmentId,
          questionPayload
        );
        questionIds.push(qId);
      } catch (e) {
        console.error("Lỗi tạo câu hỏi từ Excel ở dòng", index + 2, e);
        errors.push({
          row: index + 2,
          reason: e.message || "Lỗi service khi tạo câu hỏi",
        });
      }
    }

    if (!questionIds.length) {
      return res.status(400).json({
        message: "Không import được câu hỏi nào",
        errors,
      });
    }

    return res.status(201).json({
      message: `Import thành công ${questionIds.length} câu hỏi`,
      questionIds,
      errors, // nếu muốn xem các dòng bị bỏ qua
    });
  } catch (err) {
    console.error("Lỗi import Excel:", err);
    res
      .status(500)
      .json({ message: "Lỗi khi import từ Excel", error: err.message });
  }
};


module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentDetail,
  updateAssignment,
  deleteAssignment,
  getUnits,
  getCourses,
  uploadFile,
  getAllAssignmentsStats,
  getAssignmentStats,
  getAssignmentQuestions,
  createAndAddQuestion,
  removeQuestion,
  importQuestionsFromExcel,
};