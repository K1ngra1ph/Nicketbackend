import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.send("NICKET BACKEND Server is running");
});

// ✅ Submit route
app.post("/submit", async (req, res) => {
  const { name, email, phone, eventValue, selectedNumbers, totalValue } = req.body;

  if (!name || !email || !phone || !eventValue || !selectedNumbers || selectedNumbers.length === 0) {
    return res.status(400).json({ message: "Missing information or numbers not selected" });
  }

  try {
    // ✅ Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Event Registration Confirmation: ${eventValue}`,
      html: `
        <h3>Hi ${name},</h3>
        <p>Thank you for registering to get a free ticket for <strong>${eventValue}</strong>.</p>
        <p><strong>Phone:</strong> ${phone}<br>
           <strong>Selected Numbers:</strong> ${selectedNumbers.join(", ")}<br>
           <strong>Total Value:</strong> ₦${totalValue.toLocaleString()}</p>
        <p>We look forward to seeing you at the event!</p>
        <p style="color:#555;">– The Nicket Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: `✅ Email sent successfully to ${email}` });
  } catch (error) {
    console.error("❌ Email Error:", error);
    res.status(500).json({ message: "Failed to send email", error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
