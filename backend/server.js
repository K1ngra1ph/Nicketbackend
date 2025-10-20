// server.js
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON requests

// POST endpoint to handle form submission
app.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, eventValue, selectedNumbers, totalValue } = req.body;

    // Basic validation
    if (!name || !email || !phone || !eventValue || !selectedNumbers || selectedNumbers.length === 0) {
      return res.status(400).json({ message: 'Please fill all required fields and select numbers.' });
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: `"Event Registration" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Event Registration Confirmation',
      html: `
        <h2>Thank you for registering, ${name}!</h2>
        <p><strong>Event:</strong> ${eventValue}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Selected Numbers:</strong> ${selectedNumbers.join(', ')}</p>
        <p><strong>Total Spent:</strong> ₦${totalValue.toLocaleString()}</p>
        <p>We look forward to seeing you at the event!</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Respond back to frontend
    res.status(200).json({ message: 'Email sent successfully!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error, email not sent.' });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
