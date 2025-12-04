const nodemailer = require("nodemailer");
require("dotenv").config();

const generateVerificationCode = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

// Tạo transporter với cấu hình từ .env
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USERNAME_GMAIL,
    pass: process.env.PASSWORD_GMAIL,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("Email transporter is ready to send emails");
  }
});

// Gửi email verification (giữ lại cho backward compatibility)
const sendVerificationEmail = (userEmail, verificationCode) => {
  const mailOptions = {
    from: process.env.USERNAME_GMAIL,
    to: userEmail,
    subject: "Mã xác thực tài khoản",
    text: `Mã xác thực của bạn là: ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Lỗi khi gửi email:", error);
    } else {
      console.log("Email đã được gửi:", info.response);
    }
  });
};

// Gửi email tổng quát (dùng cho email templates)
const sendEmail = async (options) => {
  try {
    const { to, subject, text, html, from } = options;

    if (!to || !subject || (!text && !html)) {
      throw new Error("Thiếu thông tin cần thiết để gửi email");
    }

    const mailOptions = {
      from: from || process.env.USERNAME_GMAIL,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text: text || "",
      html: html || text?.replace(/\n/g, "<br>") || "",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendEmail,
  transporter,
};
