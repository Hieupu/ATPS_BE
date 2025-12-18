const cron = require("node-cron");
const instructorExamRepository = require("../repositories/instructorExamRepository");

const startExamInstanceAutoUpdate = () => {
  cron.schedule("*/5 * * * *", async () => { 
    try {
      console.log("[Cron Job - Exam Instances] Đang kiểm tra và cập nhật trạng thái bài thi...");

      const result = await instructorExamRepository.autoUpdateInstanceStatus();

      if (result.openedCount > 0 || result.closedCount > 0 || result.publishedCount > 0) {
        console.log(
          `[Cron Job] Đã cập nhật: ${result.openedCount} instance mở, ` +
          `${result.closedCount} instance đóng, ${result.publishedCount} exam published`
        );
      }
    } catch (error) {
      console.error("[Cron Job - Exam Instances] Lỗi:", error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });

  console.log("[Cron] Đã khởi động tự động cập nhật trạng thái exam instances (mỗi 5 phút)");
};

module.exports = { startExamInstanceAutoUpdate };