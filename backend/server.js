import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SEND_EMAIL_URL = "https://nicket-email-service.vercel.app/api/send-email";

// ✅ Health check
app.get("/", (req, res) => {
  res.send("NICKET BACKEND Server is running ✅");
});

// ✅ Main submit route (no Paystack verification)
app.post("/submit", async (req, res) => {
  console.log("DEBUG /submit received body:", JSON.stringify(req.body));

  const { name, email, phone, eventValue, selectedNumbers, totalValue } = req.body;

  // Basic validation
  if (!name || !email || !phone || !eventValue || !selectedNumbers?.length) {
    return res.status(400).json({ message: "Missing information or numbers not selected" });
  }

  try {
    // ✅ Forward data to email microservice
    const emailRes = await fetch(SEND_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BACKEND_SECRET}`,
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

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      console.error("❌ Email Service Error:", emailResult);
      return res.status(500).json({ message: "Email service failed", error: emailResult });
    }

    console.log(`📨 Email request sent to Vercel for ${email}`);
    return res.json({ message: `✅ Submission received and email sent to ${email}` });

  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({ message: "Server error sending email" });
  }
});

const PORT = process.env.PORT || 10000;

// Debug echo route (safe for dev only)
if (process.env.NODE_ENV !== "production") {
  app.post("/debug-echo", (req, res) => {
    console.log("DEBUG /debug-echo received body:", JSON.stringify(req.body));
    res.json({ received: req.body });
  });
}

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
