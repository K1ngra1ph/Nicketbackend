import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const SEND_EMAIL_URL = "https://nicket-email-service.vercel.app/api/send-email";

app.get("/", (req, res) => {
  res.send("NICKET BACKEND Server is running ✅");
});

✅ Submit route
app.post("/submit", async (req, res) => {
  const { name, email, phone, eventValue, selectedNumbers, totalValue } = req.body;

  if (!name || !email || !phone || !eventValue || !selectedNumbers || selectedNumbers.length === 0) {
    return res.status(400).json({ message: "Missing information or numbers not selected" });
  }

  try {
    const response = await fetch(SEND_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.BACKEND_SECRET}`,
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        eventValue,
        selectedNumbers,
        totalValue,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Email Service Error:", result);
      return res.status(500).json({ message: "Email service failed", error: result });
    }

    console.log(`✅ Email sent successfully to ${email}`);
    res.json({ message: `✅ Email sent successfully to ${email}` });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ message: "Failed to connect to email service", error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
