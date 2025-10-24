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

// ✅ Main submit route (with Paystack verification + email)
app.post("/submit", async (req, res) => {
  const { reference, name, email, phone, eventValue, selectedNumbers, totalValue } = req.body;

  if (!reference || !name || !email || !phone || !eventValue || !selectedNumbers?.length) {
    return res.status(400).json({ message: "Missing information or numbers not selected" });
  }

  try {
    // ✅ Verify payment with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (verifyData.data?.status === "success") {
      console.log(`✅ Verified payment for ${email}: ₦${verifyData.data.amount / 100}`);

      // ✅ Forward to email microservice
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
      return res.json({ message: `✅ Payment verified and email sent to ${email}` });
    } else {
      console.error("❌ Payment not verified:", verifyData);
      return res.status(400).json({ message: "Payment not verified" });
    }
  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({ message: "Server error verifying payment", error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
