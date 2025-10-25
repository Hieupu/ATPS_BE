const { PayOS } = require("@payos/node");
const connectDB = require("../config/db");

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

const createPaymentLink = async (req, res) => {
  try {
    console.log("Account info from JWT:", req.user);
    const { courseId } = req.body;
    const accId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const db = await connectDB();

    // Tìm learner dựa trên AccID
    const [learners] = await db.query("SELECT * FROM learner WHERE AccID = ?", [accId]);
    if (!learners.length) {
      return res.status(404).json({ message: "Learner not found for this account" });
    }

    const learner = learners[0];
    const learnerId = learner.LearnerID;

    // Kiểm tra khóa học
    const [course] = await db.query("SELECT * FROM course WHERE CourseID = ?", [courseId]);
    if (!course.length) return res.status(404).json({ message: "Course not found" });

    const courseData = course[0];
    
    // Generate order code
    const orderCode = Math.floor(Math.random() * 900000000) + 100000000;

    const body = {
      orderCode: orderCode,
      amount: Math.round(courseData.TuitionFee),
      description: `Thanh toán khóa học`,
      returnUrl: `${process.env.FRONTEND_URL}/payment-success?orderCode=${orderCode}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment-failed?orderCode=${orderCode}`,
      buyerName: learner.FullName || req.user.name || "Người học",
      buyerEmail: req.user.email || "unknown@example.com",
      buyerPhone: req.user.phone || "0000000000",
    };

    console.log("Creating payment link with body:", body);

    let paymentLink;
    
    if (typeof payos.paymentRequests.createPaymentLink === 'function') {
      paymentLink = await payos.paymentRequests.createPaymentLink(body);
    } else if (typeof payos.paymentRequests.create === 'function') {
      paymentLink = await payos.paymentRequests.create(body);
    } else if (typeof payos.paymentRequests.init === 'function') {
      paymentLink = await payos.paymentRequests.init(body);
    } else {
      console.log("paymentRequests methods:", Object.keys(payos.paymentRequests));
      throw new Error("No valid payment creation method found in paymentRequests");
    }

    console.log("Payment link response:", paymentLink);

    // Lưu thông tin tạm thời vào enrollment với status Pending
   await db.query(
  "INSERT INTO enrollment (EnrollmentDate, Status, LearnerID, OrderCode, CourseID) VALUES (NOW(), 'Pending', ?, ?, ?)",
  [learnerId, orderCode, courseId]
);
    res.json({
      success: true,
      paymentUrl: paymentLink.checkoutUrl || paymentLink.url,
      orderCode: orderCode
    });

  } catch (error) {
    console.error("Create payment link error:", error);
    res.status(500).json({ 
      message: "Failed to create payment link",
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { orderCode, status, amount } = req.body;

    if (!orderCode || !status) {
      return res.status(400).json({ message: "Order code and status are required" });
    }

    const db = await connectDB();

    // Tìm enrollment với OrderCode
    const [enrollments] = await db.query(
      "SELECT e.*, c.TuitionFee FROM enrollment e JOIN course c ON e.CourseID = c.CourseID WHERE e.OrderCode = ?",
      [orderCode]
    );

    if (!enrollments.length) {
      // Nếu không tìm thấy enrollment, có thể đã bị xóa do failed trước đó
      if (status === "failed" || status === "cancelled") {
        return res.json({ success: true, message: "Enrollment already deleted" });
      }
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const enrollment = enrollments[0];
    const enrollmentId = enrollment.EnrollmentID;
    
    // Lấy amount từ course.TuitionFee hoặc từ request body
    const paymentAmount = amount || enrollment.TuitionFee;

    // KIỂM TRA KỸ HƠN: Tìm payment theo OrderCode thông qua enrollment
    const [existingPayments] = await db.query(
      `SELECT p.* FROM payment p 
       JOIN enrollment e ON p.EnrollmentID = e.EnrollmentID 
       WHERE e.OrderCode = ? AND p.Status = 'Success'`,
      [orderCode]
    );

    // Nếu đã có payment thành công cho orderCode này, không xử lý nữa
    if (existingPayments.length > 0) {
      console.log("Payment already processed successfully for orderCode:", orderCode);
      return res.json({ success: true, message: "Payment already processed successfully" });
    }

    if (status === "success") {
      // KIỂM TRA THÊM: Đảm bảo enrollment chưa được cập nhật thành Enrolled
      if (enrollment.Status === 'Enrolled') {
        console.log("Enrollment already marked as Enrolled for orderCode:", orderCode);
        return res.json({ success: true, message: "Enrollment already processed" });
      }

      // THANH TOÁN THÀNH CÔNG: Ghi nhận payment trước
      await db.query(
        `INSERT INTO payment (Amount, PaymentMethod, PaymentDate, EnrollmentID, Status) 
         VALUES (?, ?, NOW(), ?, ?)`,
        [paymentAmount, "PayOS", enrollmentId, "Success"]
      );

      // Sau đó cập nhật enrollment status
      await db.query(
        "UPDATE enrollment SET Status = 'Enrolled' WHERE EnrollmentID = ?",
        [enrollmentId]
      );

      console.log("Payment success recorded - enrollment updated to Enrolled");

    } else if (status === "failed" || status === "cancelled") {
      // KIỂM TRA: Nếu enrollment đã bị xóa hoặc đã thành Enrolled thì không xử lý
      if (enrollment.Status === 'Enrolled') {
        console.log("Cannot delete enrolled enrollment for orderCode:", orderCode);
        return res.json({ success: true, message: "Enrollment is already enrolled, cannot delete" });
      }

      // THANH TOÁN THẤT BẠI: Xóa enrollment, KHÔNG tạo payment record
      await db.query(
        "DELETE FROM enrollment WHERE EnrollmentID = ?",
        [enrollmentId]
      );

      console.log("Payment failed - enrollment deleted, no payment record created");
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    res.json({ 
      success: true, 
      message: `Payment ${status} processed successfully` 
    });

  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({ 
      message: "Failed to update payment status",
      error: error.message 
    });
  }
};

module.exports = { createPaymentLink, updatePaymentStatus };