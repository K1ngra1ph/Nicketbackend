import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000; // Use Render's dynamic port

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.send('Server is running'));

// Handle submission
app.post('/submit', async (req, res) => {
  const { name, email, phone, eventValue, selectedNumbers, totalValue } = req.body;

  if (!name || !email || !phone || !eventValue || !selectedNumbers || selectedNumbers.length === 0) {
    return res.status(400).json({ message: 'Missing information or numbers not selected' });
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Event Registration Confirmation: ${eventValue}`,
      html: `
        <h3>Hi ${name},</h3>
        <p>Thank you for registering for <strong>${eventValue}</strong>.</p>
        <p><strong>Phone:</strong> ${phone}<br>
           <strong>Selected Numbers:</strong> ${selectedNumbers.join(', ')}<br>
           <strong>Total Value:</strong> ₦${totalValue.toLocaleString()}</p>
        <p>We look forward to seeing you at the event!</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: `Email sent successfully to ${email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email', error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
