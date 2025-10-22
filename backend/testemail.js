import nodemailer from "nodemailer";

// ✅ Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // your Gmail App Password
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: "311nicket@gmail.com",
      to: "pauloanmove@gmail.com",
      subject: "Test Email from Nodemailer",
      text: "This is a test email sent from Gmail SMTP using Nodemailer.",
    });
    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Email Error:", err);
  }
}

testEmail();
