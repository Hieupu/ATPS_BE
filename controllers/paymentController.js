const { PayOS } = require("@payos/node");
const connectDB = require("../config/db");
const { sendEmail } = require("../utils/nodemailer");
const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");
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

const checkPromotionCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !String(code).trim()) {
      return res
        .status(400)
        .json({ valid: false, message: "Mã giảm giá không hợp lệ" });
    }

    const db = await connectDB();
    const [promoRows] = await db.query(
      `SELECT PromotionID, Code, Discount, StartDate, EndDate
       FROM promotion WHERE Code = ? LIMIT 1`,
      [String(code).trim()]
    );

    if (!promoRows.length) {
      return res.json({ valid: false, message: "Không tìm thấy mã giảm giá" });
    }

    const promo = promoRows[0];
    const [dateRows] = await db.query("SELECT CURDATE() as today");
    const today = dateRows?.[0]?.today;
    const startOk = !promo.StartDate || promo.StartDate <= today;
    const endOk = !promo.EndDate || promo.EndDate >= today;
    const discount = Number(promo.Discount) || 0;
    if (!startOk || !endOk || discount <= 0) {
      return res.json({
        valid: false,
        message: "Mã giảm giá không còn hiệu lực",
      });
    }

    return res.json({
      valid: true,
      code: promo.Code,
      discountPercent: Math.min(discount, 100),
    });
  } catch (error) {
    console.error("Check promotion error:", error);
    res.status(500).json({ valid: false, message: "Lỗi kiểm tra mã giảm giá" });
  }
};

const createPaymentLink = async (req, res) => {
  try {
    console.log("Account info from JWT:", req.user);
    const { classID, promoCode } = req.body;
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
   COALESCE(cl.Fee, 0) as TuitionFee  -- Sửa: chỉ dùng cl.Fee
   FROM class cl 
   LEFT JOIN course c ON cl.CourseID = c.CourseID 
   WHERE cl.ClassID = ? AND cl.Status IN ('active','pending','paid')`,
      [classID]
    );
    if (!classData.length)
      return res.status(404).json({ message: "Class not found" });

    const classInfo = classData[0];
    let amount = Number(classInfo.TuitionFee) || 0;

    // Áp dụng mã giảm giá (nếu có)
    let appliedDiscountPercent = 0;
    let appliedPromoCode = null;
    if (promoCode && String(promoCode).trim()) {
      try {
        const code = String(promoCode).trim();
        const [promoRows] = await db.query(
          `SELECT PromotionID, Code, Discount, StartDate, EndDate
           FROM promotion WHERE Code = ? LIMIT 1`,
          [code]
        );
        if (promoRows.length) {
          const promo = promoRows[0];
          const [dateRows] = await db.query("SELECT CURDATE() as today");
          const today = dateRows?.[0]?.today;
          const startOk = !promo.StartDate || promo.StartDate <= today;
          const endOk = !promo.EndDate || promo.EndDate >= today;
          if (startOk && endOk) {
            const discount = Number(promo.Discount) || 0;
            if (discount > 0) {
              appliedDiscountPercent = Math.min(discount, 100);
              appliedPromoCode = promo.Code;
            }
          }
        }
      } catch (_) {}
    }

    if (appliedDiscountPercent > 0) {
      const discounted = amount * (1 - appliedDiscountPercent / 100);
      amount = Math.max(0, Math.round(discounted));
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

    // PayOS chỉ cho phép description tối đa 25 ký tự
    const description = "Thanh toán lớp học".substring(0, 25);

    const body = {
      orderCode: orderCode,
      amount: Math.round(amount),
      description: description,
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
        amount: Math.round(amount),
        appliedPromo: appliedPromoCode,
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
  let db;
  try {
    const { orderCode, status, amount } = req.body;

    if (!orderCode || !status) {
      return res
        .status(400)
        .json({ message: "Order code and status are required" });
    }

    db = await connectDB();

    // BẮT ĐẦU TRANSACTION
    await db.query("START TRANSACTION");

    const [enrollments] = await db.query(
      `SELECT e.*, 
   COALESCE(cl.Fee, 0) as TuitionFee  
   FROM enrollment e 
   LEFT JOIN class cl ON e.ClassID = cl.ClassID 
   LEFT JOIN course c ON cl.CourseID = c.CourseID 
   WHERE e.OrderCode = ? FOR UPDATE`,
      [orderCode]
    );
    if (!enrollments.length) {
      await db.query("ROLLBACK");
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

    // KIỂM TRA TRẠNG THÁI HIỆN TẠI TRƯỚC KHI XỬ LÝ
    console.log(
      `Current enrollment status: ${enrollment.Status} for orderCode: ${orderCode}`
    );

    // Nếu đã là Enrolled rồi, không xử lý tiếp
    if (enrollment.Status === "Enrolled") {
      await db.query("ROLLBACK");
      console.log(
        `Enrollment ${enrollmentId} already enrolled, skipping processing`
      );
      return res.json({ success: true, message: "Already enrolled" });
    }

    const paymentAmount = amount || enrollment.TuitionFee;

    // Kiểm tra payment đã tồn tại chưa
    const [existingPayments] = await db.query(
      `SELECT p.* FROM payment p 
       WHERE p.EnrollmentID = ?`,
      [enrollmentId]
    );

    if (existingPayments.length > 0) {
      await db.query("ROLLBACK");
      console.log(`Payment already exists for enrollment ${enrollmentId}`);
      return res.json({ success: true, message: "Payment already processed" });
    }

    if (status === "success") {
      await db.query(
        `INSERT INTO payment (Amount, PaymentMethod, PaymentDate, EnrollmentID, Status) 
   VALUES (?, ?, NOW(), ?, 'success')`, // Hoặc 'paid', 'completed', 'success'
        [paymentAmount, "PayOS", enrollmentId]
      );

      // CẬP NHẬT ENROLLMENT STATUS - QUAN TRỌNG!
      const [updateResult] = await db.query(
        "UPDATE enrollment SET Status = 'Enrolled' WHERE EnrollmentID = ? AND Status = 'Pending'",
        [enrollmentId]
      );

      // Kiểm tra xem có thực sự update được không
      if (updateResult.affectedRows === 0) {
        await db.query("ROLLBACK");
        console.error(`Failed to update enrollment status for ${enrollmentId}`);
        return res
          .status(500)
          .json({ message: "Failed to update enrollment status" });
      }

      console.log(
        `Successfully updated enrollment ${enrollmentId} to Enrolled`
      );

     // Cập nhật class status
try {
  // Lấy thông tin class name và status hiện tại
  const [classInfoRows] = await db.query(
    "SELECT ClassID, Name, Status FROM class WHERE ClassID = ?",
    [enrollment.ClassID]
  );

  if (classInfoRows.length > 0) {
    const classInfo = classInfoRows[0];
    let newStatus = classInfo.Status; // Giữ nguyên status cũ mặc định

    // Chỉ cập nhật nếu là lớp 1-on-1
    if (classInfo.Name && classInfo.Name.includes('1-on-1')) {
      newStatus = 'Ongoing';
      console.log(`Class ${classInfo.ClassID} is 1-on-1, updating status to Ongoing`);
      
      // Cập nhật status class chỉ cho lớp 1-on-1
      await db.query("UPDATE class SET Status = ? WHERE ClassID = ?", [
        newStatus,
        enrollment.ClassID
      ]);

      console.log(`Class ${classInfo.ClassID} status updated to: ${newStatus}`);
    } else {
      console.log(`Class ${classInfo.ClassID} is regular class, keeping current status: ${classInfo.Status}`);
      // Không cập nhật gì cả, giữ nguyên status trong DB
    }
  }
} catch (classError) {
  console.warn("Class status update warning:", classError.message);
  // Không rollback vì lỗi này không quan trọng bằng enrollment
}

      // COMMIT TRANSACTION
      await db.query("COMMIT");

      // Không cần cập nhật session vì enrollment status đã được cập nhật thành 'Enrolled'
      // Các session sẽ tự động hiển thị vì query đã filter theo enrollment status = 'Enrolled'

      // GỬI EMAIL VÀ XỬ LÝ NOTIFICATION (sau khi commit)
      try {
        await sendConfirmationEmail(db, enrollmentId, orderCode);
      } catch (emailError) {
        console.warn("Email sending failed:", emailError.message);
        // Không ảnh hưởng đến kết quả chính
      }

      // GỬI NOTIFICATION CHO HỌC SINH VÀ GIÁO VIÊN
      try {
        const notificationService = require("../services/notificationService");

        // Lấy thông tin class và learner
        const [classRows] = await db.query(
          `SELECT c.Name as ClassName, c.InstructorID, i.AccID as InstructorAccID,
           l.AccID as LearnerAccID, l.FullName as LearnerName
           FROM class c
           INNER JOIN enrollment e ON c.ClassID = e.ClassID
           INNER JOIN learner l ON e.LearnerID = l.LearnerID
           INNER JOIN instructor i ON c.InstructorID = i.InstructorID
           WHERE e.EnrollmentID = ?`,
          [enrollmentId]
        );

        if (classRows.length > 0) {
          const classInfo = classRows[0];

          // Notification cho học sinh
          await notificationService.create({
            content: `Thanh toán thành công! Bạn đã đăng ký lớp "${classInfo.ClassName}". Lịch học đã được tạo.`,
            type: "enrollment",
            status: "unread",
            accId: classInfo.LearnerAccID,
          });

          // Notification cho giáo viên
          await notificationService.create({
            content: `Học sinh ${classInfo.LearnerName} đã thanh toán và đăng ký lớp "${classInfo.ClassName}". Lịch học đã được tạo.`,
            type: "enrollment",
            status: "unread",
            accId: classInfo.InstructorAccID,
          });
        }
      } catch (notifError) {
        console.warn("Notification creation failed:", notifError.message);
      }

      // XÓA NOTIFICATION PAYMENT
      try {
        await deletePaymentNotification(db, enrollment.LearnerID, orderCode);
      } catch (notifError) {
        console.warn("Notification cleanup failed:", notifError.message);
      }
   } else if (status === "failed" || status === "cancelled") {
  // Lấy thông tin class trước khi xóa để kiểm tra
  const [classRows] = await db.query(
    `SELECT c.ClassID, c.Name as ClassName, c.InstructorID, i.AccID as InstructorAccID,
     l.AccID as LearnerAccID, l.FullName as LearnerName
     FROM class c
     INNER JOIN enrollment e ON c.ClassID = e.ClassID
     INNER JOIN learner l ON e.LearnerID = l.LearnerID
     INNER JOIN instructor i ON c.InstructorID = i.InstructorID
     WHERE e.EnrollmentID = ?`,
    [enrollmentId]
  );

  // XÓA NOTIFICATION PAYMENT TRƯỚC
  try {
    await deletePaymentNotification(db, enrollment.LearnerID, orderCode);
  } catch (notifError) {
    console.warn("Notification cleanup failed:", notifError.message);
  }

  const classId = enrollment.ClassID;
  const className = classRows.length > 0 ? classRows[0].ClassName : "";

  // CHỈ XÓA CLASS NẾU LÀ LỚP 1-ON-1 (chứa "1-on-1" trong tên)
  const isOneOnOneClass = className && className.includes("1-on-1");

  console.log(`Class ${classId} name: "${className}", isOneOnOne: ${isOneOnOneClass}`);

  if (isOneOnOneClass) {
    // XÓA HOÀN TOÀN: session → enrollment → class (lớp 1-on-1)
    
    // 1. Xóa tất cả session của class
    await db.query(`DELETE FROM session WHERE ClassID = ?`, [classId]);
    console.log(`Deleted sessions for 1-on-1 class ${classId}`);

    // 2. Xóa enrollment
    await db.query("DELETE FROM enrollment WHERE EnrollmentID = ?", [enrollmentId]);
    console.log(`Deleted enrollment ${enrollmentId} for 1-on-1 class`);

    // 3. Xóa class (lớp 1-on-1 chờ thanh toán)
    await db.query(`DELETE FROM class WHERE ClassID = ?`, [classId]);
    console.log(`Deleted 1-on-1 class ${classId} due to ${status} payment`);

  } else {
    // CHỈ XÓA ENROLLMENT (lớp thường - giữ lại class cho người khác đăng ký)
    await db.query("DELETE FROM enrollment WHERE EnrollmentID = ?", [enrollmentId]);
    console.log(`Deleted enrollment ${enrollmentId} for regular class (class ${classId} preserved)`);
  }

  await db.query("COMMIT");
  console.log(`Payment ${status} processed successfully for order ${orderCode}`);

  // Không gửi notification khi thanh toán thất bại/hủy
} else {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid status" });
    }

    res.json({
      success: true,
      message: `Payment ${status} processed successfully`,
    });
  } catch (error) {
    // ROLLBACK NẾU CÓ LỖI
    if (db)
      await db.query("ROLLBACK").catch((rollbackError) => {
        console.error("Rollback failed:", rollbackError);
      });

    console.error("Update payment status error:", error);
    res.status(500).json({
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};
// Get payment link by OrderCode
const getPaymentLinkByOrderCode = async (req, res) => {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({ message: "OrderCode is required" });
    }

    const db = await connectDB();

    // Lấy thông tin enrollment từ OrderCode
    const [enrollments] = await db.query(
      `SELECT e.EnrollmentID, e.LearnerID, e.ClassID, e.OrderCode, cl.Fee as ClassFee, cl.Name as ClassName,
       l.FullName, a.Email, a.AccID
       FROM enrollment e
       INNER JOIN class cl ON e.ClassID = cl.ClassID
       INNER JOIN learner l ON e.LearnerID = l.LearnerID
       INNER JOIN account a ON l.AccID = a.AccID
       WHERE e.OrderCode = ? AND e.Status = 'Pending'`,
      [orderCode]
    );

    if (!enrollments.length) {
      return res
        .status(404)
        .json({ message: "Enrollment not found or already paid" });
    }

    const enrollment = enrollments[0];

    // Thử lấy payment link từ PayOS trước
    let paymentInfo = await getExistingPaymentLink(orderCode);

    // Nếu không tìm thấy trong PayOS, tạo payment link mới
    if (!paymentInfo || !paymentInfo.url) {
      console.log(
        `Payment link not found in PayOS for orderCode: ${orderCode}, creating new link...`
      );

      // Lấy số tiền từ ClassFee của enrollment
      const amount = Math.round(enrollment.ClassFee || 0);

      // PayOS chỉ cho phép description tối đa 25 ký tự
      const classNameShort = enrollment.ClassName
        ? enrollment.ClassName.length > 20
          ? enrollment.ClassName.substring(0, 20) + "..."
          : enrollment.ClassName
        : "1-on-1";
      const description = `Thanh toán: ${classNameShort}`.substring(0, 25);

      const paymentBody = {
        orderCode: Number(orderCode),
        amount: amount,
        description: description,
        returnUrl: `${
          process.env.FRONTEND_URL
        }/payment-success?orderCode=${encodeURIComponent(orderCode)}`,
        cancelUrl: `${
          process.env.FRONTEND_URL
        }/payment-failed?orderCode=${encodeURIComponent(orderCode)}`,
        buyerName: enrollment.FullName || "Người học",
        buyerEmail: enrollment.Email || "unknown@example.com",
        buyerPhone: "0000000000",
      };

      try {
        const paymentLink = await createPaymentWithBody(paymentBody);
        const paymentUrl = paymentLink.checkoutUrl || paymentLink.url;

        console.log(`✅ Created new payment link for orderCode: ${orderCode}`);

        return res.json({
          paymentUrl: paymentUrl,
          status: "PENDING",
        });
      } catch (createError) {
        console.error("Error creating new payment link:", createError);
        return res.status(500).json({
          message: "Cannot create payment link",
          error: createError.message,
        });
      }
    }

    // Nếu đã tìm thấy trong PayOS
    if (paymentInfo.status === "PAID") {
      return res.status(400).json({
        message: "Order has already been paid",
        status: "PAID",
      });
    }

    if (paymentInfo.url) {
      return res.json({
        paymentUrl: paymentInfo.url,
        status: paymentInfo.status || "PENDING",
      });
    }

    return res.status(404).json({ message: "Payment URL not available" });
  } catch (error) {
    console.error("Error getting payment link:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

const getPaymentHistory = async(req, res) => {
  try {
    const { learnerId } = req.params;

    if (!learnerId) {
      return res.status(400).json({ message: "Learner ID is required" });
    }

    const payments = await paymentService.getPaymentHistory(learnerId);
    return res.json({ payments });
  } catch (error) {
    console.error("Error in getPaymentHistory:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAdminPaymentHistory = async (req, res) => {
  try {
    const { search } = req.query;
    const payments = await paymentService.getAdminPaymentHistory(search);
    return res.json({ payments });
  } catch (error) {
    console.error("Error in getAdminPaymentHistory:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const requestRefund = async(req, res) => {
  try {
    const { enrollmentId, reason } = req.body;

    if (!enrollmentId || !reason) {
      return res.status(400).json({ 
        message: "Enrollment ID and reason are required" 
      });
    }

    const result = await paymentService.requestRefund(enrollmentId, reason);
    
    // Tạo notification sau khi request refund thành công
    if (result.success) {
      await notificationService.createRefundNotification(
        enrollmentId, 
        result.refundRequest.RefundID,
        'requested'
      );
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Error in requestRefund:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

const cancelRefundRequest = async(req, res) => {
  try {
    const { refundId } = req.params;

    if (!refundId) {
      return res.status(400).json({ 
        message: "Refund ID is required" 
      });
    }

    const result = await paymentService.cancelRefundRequest(refundId);
    
    // Tạo notification sau khi cancel refund thành công
    if (result.success) {
      await notificationService.createRefundNotification(
        result.refundRequest.EnrollmentID, 
        refundId,
        'cancelled'
      );
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Error in cancelRefundRequest:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

module.exports = {
  createPaymentLink,
  updatePaymentStatus,
  checkPromotionCode,
  getPaymentLinkByOrderCode,
  requestRefund,
  getPaymentHistory,
  getAdminPaymentHistory,
  cancelRefundRequest
};
