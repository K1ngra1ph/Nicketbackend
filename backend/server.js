import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Email microservice endpoint
const SEND_EMAIL_URL = "https://nicket-email-service.vercel.app/api/send-email";

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("🚀 NICKET Backend running with Monnify integration ✅");
});

// 🔐 Get Monnify Access Token
async function getMonnifyToken() {
  const credentials = `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`;
  const encodedCreds = Buffer.from(credentials).toString("base64");

  const response = await fetch("https://sandbox.monnify.com/api/v1/auth/login", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedCreds}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok || !data.responseBody?.accessToken) {
    console.error("❌ Failed to get Monnify token:", data);
    throw new Error(data.message || "Failed to get Monnify access token");
  }

  return data.responseBody.accessToken;
}

// ✅ Submit route
app.post("/submit", async (req, res) => {
 console.log("🧾 Incoming payload:", req.body);
  res.status(200).json({ message: "Received successfully", data: req.body }); 
} {
    return res
      .status(400)
      .json({ message: "Missing information or numbers not selected" });
  }

  try {
    const token = await getMonnifyToken();
    const verifyRes = await fetch(
      `https://sandbox.monnify.com/api/v1/transactions/${reference}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const verifyData = await verifyRes.json();
    console.log("🔍 Monnify Verify Response:", verifyData);

    if (
      verifyData.requestSuccessful &&
      verifyData.responseBody?.paymentStatus === "PAID"
    ) {
      console.log("✅ Payment verified successfully");

      // ✅ Send confirmation email
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
        return res
          .status(500)
          .json({ message: "Payment verified, but email failed." });
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
    res
      .status(500)
      .json({ message: "Server error verifying Monnify payment", error });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (Monnify Enabled)`)
);
