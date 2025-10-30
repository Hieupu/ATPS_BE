const { PayOS } = require("@payos/node");
const connectDB = require("../config/db");
const { sendEmail } = require("../utils/nodemailer");

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

async function createPaymentWithBody(body) {
  if (typeof payos.paymentRequests?.createPaymentLink === "function") {
    return await payos.paymentRequests.createPaymentLink(body);
  }
  if (typeof payos.paymentRequests?.create === "function") {
    return await payos.paymentRequests.create(body);
  }
  if (typeof payos.paymentRequests?.init === "function") {
    return await payos.paymentRequests.init(body);
  }
  throw new Error("No valid payment creation method found in paymentRequests");
}

async function getExistingPaymentLink(orderCode) {
  try {
    console.log(
      "Trying to get existing payment link for orderCode:",
      orderCode
    );

    let info = null;

    if (payos?.paymentRequests?.getPaymentLinkInformation) {
      console.log("Using paymentRequests.getPaymentLinkInformation");
      info = await payos.paymentRequests.getPaymentLinkInformation(orderCode);
    } else if (payos?.paymentLinks?.getPaymentLinkInformation) {
      console.log("Using paymentLinks.getPaymentLinkInformation");
      info = await payos.paymentLinks.getPaymentLinkInformation(orderCode);
    } else if (payos?.paymentRequests?.get) {
      console.log("Using paymentRequests.get");
      info = await payos.paymentRequests.get(orderCode);
    } else {
      console.log("No valid method found to get existing payment link");
      return null;
    }

    console.log("Payment link info:", info);

    // ✅ Nếu đơn đã thanh toán, không có link checkout
    if (info?.status === "PAID") {
      console.log(`Order ${orderCode} has already been paid.`);
      return { status: "PAID", url: null };
    }

    const link = info?.checkoutUrl || info?.url || null;
    if (!link) {
      console.warn(`Order ${orderCode} found but has no checkoutUrl/url.`);
    }
    return { status: info?.status, url: link };
  } catch (e) {
    console.warn(
      "Cannot retrieve existing payment link for order:",
      orderCode,
      "Error:",
      e.message
    );
  }
  return null;
}

async function cancelExistingPaymentLink(orderCode) {
  try {
    if (payos?.paymentRequests?.cancelPaymentLink) {
      await payos.paymentRequests.cancelPaymentLink(orderCode);
      return true;
    }
    if (payos?.paymentRequests?.cancel) {
      await payos.paymentRequests.cancel(orderCode);
      return true;
    }
    if (payos?.paymentLinks?.cancelPaymentLink) {
      await payos.paymentLinks.cancelPaymentLink(orderCode);
      return true;
    }
  } catch (e) {
    console.warn("Cannot cancel existing payment link for order:", orderCode);
  }
  return false;
}

const createPaymentLink = async (req, res) => {
  try {
    console.log("Account info from JWT:", req.user);
    const { classID } = req.body;
    const accId = req.user.id;

    if (!classID) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    const db = await connectDB();

    // Tìm learner dựa trên AccID
    const [learners] = await db.query("SELECT * FROM learner WHERE AccID = ?", [
      accId,
    ]);
    if (!learners.length) {
      return res
        .status(404)
        .json({ message: "Learner not found for this account" });
    }

    const learner = learners[0];
    const learnerId = learner.LearnerID;

    // Kiểm tra lớp học và lấy thông tin thanh toán
    // Logic giá tiền: Nếu class có Fee thì lấy từ class, nếu không thì lấy từ course
    const [classData] = await db.query(
      `SELECT cl.*, c.Title as CourseTitle, 
       CASE WHEN cl.Fee IS NOT NULL THEN cl.Fee ELSE COALESCE(c.Fee, 0) END as TuitionFee
       FROM class cl 
       LEFT JOIN course c ON cl.CourseID = c.CourseID 
       WHERE cl.ClassID = ? AND cl.Status = 'active'`,
      [classID]
    );
    if (!classData.length)
      return res.status(404).json({ message: "Class not found" });

    const classInfo = classData[0];
    let amount = Number(classInfo.TuitionFee) || 0;
    // Nếu chưa thiết lập học phí cho lớp (đặc biệt lớp 1-1), fallback hợp lệ
    if (amount <= 0) {
      // Thử lấy lại từ course
      const [courseRows] = await db.query(
        "SELECT COALESCE(Fee, 0) as Fee FROM course WHERE CourseID = ?",
        [classInfo.CourseID]
      );
      const courseFee = Number(courseRows?.[0]?.Fee) || 0;
      amount = courseFee;
    }
    // Nếu vẫn không có học phí, dùng mặc định
    if (amount <= 0) {
      amount = Number(process.env.DEFAULT_TUITION_FEE || 5000); // VND
    }

    // Chặn trùng: nếu đã Enrolled -> từ chối; nếu Pending -> tái sử dụng OrderCode
    const [existingEnrollments] = await db.query(
      "SELECT * FROM enrollment WHERE LearnerID = ? AND ClassID = ? AND Status IN ('Enrolled','Pending') ORDER BY EnrollmentID DESC LIMIT 1",
      [learnerId, classID]
    );

    if (
      existingEnrollments.length &&
      existingEnrollments[0].Status === "Enrolled"
    ) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this class" });
    }

    // Tạo hoặc tái sử dụng OrderCode numeric 15 chữ số (<= 9007199254740991)
    const genOrderCode = () => {
      const base = Date.now(); // 13 digits
      const rand = Math.floor(Math.random() * 90) + 10; // 2 digits (10-99)
      const code = Number(`${base}${rand}`);
      // Bảo đảm không vượt MAX_SAFE_INTEGER (chuẩn PayOS)
      return Math.min(code, 9007199254740991);
    };

    let orderCode = existingEnrollments[0]?.OrderCode || genOrderCode();
    if (!existingEnrollments.length) {
      // Insert enrollment Pending kèm OrderCode
      // đảm bảo không trùng OrderCode
      for (let i = 0; i < 3; i++) {
        const [exists] = await db.query(
          "SELECT 1 FROM enrollment WHERE OrderCode = ? LIMIT 1",
          [orderCode]
        );
        if (!exists.length) break;
        orderCode = genOrderCode();
      }
      await db.query(
        "INSERT INTO enrollment (EnrollmentDate, Status, LearnerID, ClassID, OrderCode) VALUES (NOW(), 'Pending', ?, ?, ?)",
        [learnerId, classID, orderCode]
      );
    }

    const body = {
      orderCode: orderCode,
      amount: Math.round(amount),
      description: `Thanh toán lớp học`,
      returnUrl: `${
        process.env.FRONTEND_URL
      }/payment-success?orderCode=${encodeURIComponent(orderCode)}`,
      cancelUrl: `${
        process.env.FRONTEND_URL
      }/payment-failed?orderCode=${encodeURIComponent(orderCode)}`,
      buyerName: learner.FullName || req.user.name || "Người học",
      buyerEmail: req.user.email || "unknown@example.com",
      buyerPhone: req.user.phone || "0000000000",
    };

    //     console.log("Creating payment link with body:", body);

    try {
      const paymentLink = await createPaymentWithBody(body);

      console.log("Payment link response:", paymentLink);

      res.json({
        success: true,
        paymentUrl: paymentLink.checkoutUrl || paymentLink.url,
        orderCode: orderCode,
      });
    } catch (e) {
      if (e?.error?.code === "231") {
        const info = await getExistingPaymentLink(orderCode);

        if (info?.status === "PAID") {
          return res.json({
            success: true,
            paymentUrl: null,
            orderCode: orderCode,
            message: "Payment already completed for this order",
          });
        }

        if (info?.url) {
          return res.json({
            success: true,
            paymentUrl: info.url,
            orderCode: orderCode,
            reused: true,
          });
        }
      }
      throw e;
    }
  } catch (error) {
    console.error("Create payment link error:", error);
    res.status(500).json({
      message: "Failed to create payment link",
      error: error.message,
      details: error.response?.data || "No additional details",
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderCode, status, amount } = req.body;

    if (!orderCode || !status) {
      return res
        .status(400)
        .json({ message: "Order code and status are required" });
    }

    const db = await connectDB();

    // Tìm enrollment theo OrderCode trước, fallback theo EnrollmentID nếu orderCode là số
    let enrollments = [];
    const [rowsByCode] = await db.query(
      `SELECT e.*, 
       CASE WHEN cl.Fee IS NOT NULL THEN cl.Fee ELSE COALESCE(c.Fee, 0) END as TuitionFee 
       FROM enrollment e 
       LEFT JOIN class cl ON e.ClassID = cl.ClassID 
       LEFT JOIN course c ON cl.CourseID = c.CourseID 
       WHERE e.OrderCode = ?`,
      [orderCode]
    );
    enrollments = rowsByCode;
    if (!enrollments.length && /^\d+$/.test(String(orderCode))) {
      const [rowsById] = await db.query(
        `SELECT e.*, 
         CASE WHEN cl.Fee IS NOT NULL THEN cl.Fee ELSE COALESCE(c.Fee, 0) END as TuitionFee 
         FROM enrollment e 
         LEFT JOIN class cl ON e.ClassID = cl.ClassID 
         LEFT JOIN course c ON cl.CourseID = c.CourseID 
         WHERE e.EnrollmentID = ?`,
        [orderCode]
      );
      enrollments = rowsById;
    }

    if (!enrollments.length) {
      // Nếu không tìm thấy enrollment, có thể đã bị xóa do failed trước đó
      if (status === "failed" || status === "cancelled") {
        return res.json({
          success: true,
          message: "Enrollment already deleted",
        });
      }
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const enrollment = enrollments[0];
    const enrollmentId = enrollment.EnrollmentID;

    // Lấy amount từ course.TuitionFee hoặc từ request body
    const paymentAmount = amount || enrollment.TuitionFee;

    // KIỂM TRA KỸ HƠN: Tìm payment theo EnrollmentID
    const [existingPayments] = await db.query(
      `SELECT p.* FROM payment p 
       JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID 
       WHERE e.EnrollmentID = ?`,
      [enrollmentId]
    );

    // Nếu đã có payment thành công cho orderCode này, không xử lý nữa
    if (existingPayments.length > 0) {
      console.log(
        "Payment already processed successfully for orderCode:",
        orderCode
      );
      return res.json({
        success: true,
        message: "Payment already processed successfully",
      });
    }

    if (status === "success") {
      // KIỂM TRA THÊM: Đảm bảo enrollment chưa được cập nhật thành Enrolled
      if (enrollment.Status === "Enrolled") {
        console.log(
          "Enrollment already marked as Enrolled for orderCode:",
          orderCode
        );
        return res.json({
          success: true,
          message: "Enrollment already processed",
        });
      }

      // THANH TOÁN THÀNH CÔNG: Ghi nhận payment trước
      await db.query(
        `INSERT INTO payment (Amount, PaymentMethod, PaymentDate, EnrollmentID) 
         VALUES (?, ?, NOW(), ?)`,
        [paymentAmount, "PayOS", enrollmentId]
      );

      //       // Sau đó cập nhật enrollment status
      await db.query(
        "UPDATE enrollment SET Status = 'Enrolled' WHERE EnrollmentID = ?",
        [enrollmentId]
      );

      console.log("Payment success recorded - enrollment updated to Enrolled");

      // Sau khi Enrolled: gửi email lịch học
      try {
        // Lấy thông tin learner + email
        const [learnerRows] = await db.query(
          `SELECT l.LearnerID, l.FullName, a.Email, a.AccID
           FROM learner l JOIN account a ON l.AccID = a.AccID
           WHERE l.LearnerID = ?`,
          [enrollment.LearnerID]
        );

        const [classRows] = await db.query(
          `SELECT cl.Name as ClassName, cl.ZoomURL, c.Title as CourseTitle
           FROM class cl LEFT JOIN course c ON cl.CourseID = c.CourseID
           WHERE cl.ClassID = ?`,
          [enrollment.ClassID]
        );

        const [scheduleRows] = await db.query(
          `SELECT s.Title, s.Date, ts.StartTime, ts.EndTime
           FROM session s LEFT JOIN timeslot ts ON s.TimeslotID = ts.TimeslotID
           WHERE s.ClassID = ?
           ORDER BY s.Date ASC, ts.StartTime ASC`,
          [enrollment.ClassID]
        );

        const learnerInfo = learnerRows[0];
        const classInfo = classRows[0] || {};

        if (learnerInfo?.Email) {
          const scheduleHtml = scheduleRows
            .map((r) => {
              const date = r.Date
                ? new Date(r.Date).toISOString().slice(0, 10)
                : "";
              const start = r.StartTime
                ? r.StartTime.toString().slice(0, 5)
                : "";
              const end = r.EndTime ? r.EndTime.toString().slice(0, 5) : "";
              return `<tr><td style="padding:6px 8px;border:1px solid #eee;">${
                r.Title || "Buổi học"
              }</td><td style="padding:6px 8px;border:1px solid #eee;">${date}</td><td style=\"padding:6px 8px;border:1px solid #eee;\">${start} - ${end}</td></tr>`;
            })
            .join("");

          const html = `
            <div style="font-family:Arial,Helvetica,sans-serif;">
              <h2>Chào ${learnerInfo.FullName || "bạn"},</h2>
              <p>Bạn đã đăng ký thành công lớp học: <strong>${
                classInfo.ClassName || "Lớp học"
              }</strong>${
            classInfo.CourseTitle ? ` (Khóa: ${classInfo.CourseTitle})` : ""
          }.</p>
              ${
                classInfo.ZoomURL
                  ? `<p>Link học/Zoom: <a href="${classInfo.ZoomURL}">${classInfo.ZoomURL}</a></p>`
                  : ""
              }
              <p>Lịch học dự kiến:</p>
              <table style="border-collapse:collapse;border:1px solid #eee;">
                <thead>
                  <tr>
                    <th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Buổi</th>
                    <th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Ngày</th>
                    <th style="padding:6px 8px;border:1px solid #eee;text-align:left;">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    scheduleHtml ||
                    `<tr><td colspan="3" style="padding:8px;">Lịch sẽ được cập nhật sau.</td></tr>`
                  }
                </tbody>
              </table>
              <p>Nếu có thay đổi, hệ thống sẽ cập nhật đến bạn.</p>
              <p>Trân trọng,<br/>ATPS Education</p>
            </div>`;

          await sendEmail({
            to: learnerInfo.Email,
            subject: "Xác nhận đăng ký và lịch học",
            html,
          });
        }
        // Tạo thông báo cho tài khoản
        try {
          const notificationService = require("../services/notificationService");
          const accId = learnerInfo?.AccID;
          if (accId) {
            await notificationService.create({
              accId,
              type: "schedule",
              content: `Đăng ký thành công lớp ${
                classInfo.ClassName || ""
              }. Lịch học đã sẵn sàng trong mục Lịch học.`,
            });
          }
        } catch (_) {}
      } catch (mailErr) {
        console.warn("Send schedule email failed:", mailErr.message);
      }
    } else if (status === "failed" || status === "cancelled") {
      // KIỂM TRA: Nếu enrollment đã bị xóa hoặc đã thành Enrolled thì không xử lý
      if (enrollment.Status === "Enrolled") {
        console.log(
          "Cannot delete enrolled enrollment for orderCode:",
          orderCode
        );
        return res.json({
          success: true,
          message: "Enrollment is already enrolled, cannot delete",
        });
      }

      // THANH TOÁN THẤT BẠI: Xóa enrollment, KHÔNG tạo payment record
      await db.query("DELETE FROM enrollment WHERE EnrollmentID = ?", [
        enrollmentId,
      ]);

      console.log(
        "Payment failed - enrollment deleted, no payment record created"
      );
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    res.json({
      success: true,
      message: `Payment ${status} processed successfully`,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};
module.exports = { createPaymentLink, updatePaymentStatus };
