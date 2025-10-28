import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const allowedOrigins = [ 
  "https://nicketfrontend.vercel.app",
  ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

const SEND_EMAIL_URL = "https://nicket-email-service.vercel.app/api/send-email";

app.get("/", (req, res) => {
  res.send("🚀 NICKET Backend running with Monnify integration ✅");
});

// 🔐 Get Monnify access token
async function getMonnifyToken() {
  const credentials = `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`;
  const encodedCreds = Buffer.from(credentials).toString("base64");

  const response = await fetch("https://sandbox.monnify.com/api/v1/auth/login", {
    method: "POST",
    headers: { Authorization: `Basic ${encodedCreds}` },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to get token");

  return data.responseBody.accessToken;
}

// ✅ Payment verification and email
app.post("/submit", async (req, res) => {
  console.log("📩 Incoming /submit request body:", req.body);
  
  const {
    reference, 
    name, 
    email, 
    phone, 
    eventValue, 
    selectedNumbers, 
    totalValue 
  } = req.body;

  if (!reference || !name || !email || !phone || !eventValue || !selectedNumbers?.length) {
    return res.status(400).json({ message: "Missing information or numbers not selected" });
  }

  try {
    const token = await getMonnifyToken();

    const verifyRes = await fetch(`https://sandbox.monnify.com/api/v1/transactions/${reference}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const verifyData = await verifyRes.json();
    console.log("🔍 Monnify Verify Response:", verifyData);

    if (verifyData.requestSuccessful && verifyData.responseBody.paymentStatus === "PAID") {
      console.log("✅ Payment verified successfully");

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
          reference,
        }),
      });

      const emailResult = await emailRes.json();

      if (!emailRes.ok) {
        console.error("❌ Email service failed:", emailResult);
        return res.status(500).json({ message: "Payment verified, but email failed." });
      }

      return res.json({
        message: `✅ Payment verified & confirmation sent to ${email}`,
        reference,
      });
    } else {
      console.error("❌ Payment verification failed:", verifyData);
      return res.status(400).json({ message: "Payment not verified" });
    }
  } catch (error) {
    console.error("❌ Error verifying Monnify payment:", error);
    res.status(500).json({ message: "Server error verifying Monnify payment", error });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (Monnify Enabled)`));
