import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const allowedOrigins = ["https://nicketfrontend.vercel.app"];

const BASE_URL =
  process.env.MONNIFY_MODE === "LIVE"
    ? "https://api.monnify.com"
    : "https://sandbox.monnify.com";

console.log("🌍 Using Monnify Base URL:", BASE_URL);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    console.warn("🚫 Blocked by CORS:", req.headers.origin);
    return res.status(403).json({ message: "CORS blocked this origin" });
  }
  next(err);
});

app.use(express.json());

const SEND_EMAIL_URL = "https://nicket-email-service.vercel.app/api/send-email";

app.get("/", (req, res) => {
  res.send("🚀 NICKET Backend running with Monnify integration ✅");
});

// 🔐 Get Monnify access token
async function getMonnifyToken() {
  const credentials = `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`;
  const encodedCreds = Buffer.from(credentials).toString("base64");

  console.log("🔑 Getting Monnify token...");
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${encodedCreds}`, Accept: "application/json", },
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    const text = await response.text();
    console.error("⚠️ Token fetch returned non-JSON:", text);
    throw new Error("Invalid JSON while getting Monnify token");
  }

  if (!response.ok) {
    console.error("❌ Failed to get token:", data);
    throw new Error(data.message || "Failed to get token");
  }

  console.log("✅ Got Monnify token successfully");
  return data.responseBody.accessToken;
}

// ✅ Payment verification and email
app.post("/submit", async (req, res) => {
  console.log("📩 Incoming /submit request body:", req.body);

  const { reference, name, email, phone, eventValue, selectedNumbers, totalValue } = req.body;

  if (!reference || !name || !email || !phone || !eventValue || !selectedNumbers?.length) {
    return res
      .status(400)
      .json({ message: "Missing information or numbers not selected" });
  }

  try {
    const token = await getMonnifyToken();
    console.log("🧾 Verifying payment for reference:", reference);

        const verifyRes = await fetch(`${BASE_URL}/api/v1/transactions/${reference}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", },
    });

    const rawText = await verifyRes.text();
    let verifyData;

    try {
      verifyData = JSON.parse(rawText);
    } catch (e) {
      console.error("⚠️ Monnify returned non-JSON response (raw):", rawText.slice(0, 500));
      throw new Error("Invalid JSON from Monnify verification endpoint");
    }

    console.log("🔍 Monnify Verify Response:", verifyData);

    if (
      verifyData.requestSuccessful &&
      verifyData.responseBody?.paymentStatus === "PAID"
    ) {
      console.log("✅ Payment verified successfully. Sending confirmation email...");

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

      const emailText = await emailRes.text();
      console.log("📧 Email service raw response:", emailText);

      let emailResult;
      try {
        emailResult = JSON.parse(emailText);
      } catch {
        console.error("⚠️ Email response was not JSON:", emailText);
        emailResult = { message: "Invalid email response" };
      }

      if (!emailRes.ok) {
        console.error("❌ Email service failed:", emailResult);
        return res
          .status(500)
          .json({ message: "Payment verified, but email failed.", emailResult });
      }

      return res.json({
        message: `✅ Payment verified & confirmation sent to ${email}`,
        reference,
      });
    } else {
      console.error("❌ Payment verification failed:", verifyData);
      return res.status(400).json({ message: "Payment not verified", verifyData });
    }
  } catch (error) {
    console.error("❌ Error verifying Monnify payment:", error);
    res.status(500).json({
      message: "Server error verifying Monnify payment",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (Monnify Enabled)`)
);
