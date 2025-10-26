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

// ✅ Route
app.post("/submit", async (req, res) => {
  const {
    reference,
    name,
    email,
    phone,
    eventValue,
    selectedNumbers,
    totalValue,
  } = req.body;

  if (
    !reference ||
    !name ||
    !email ||
    !phone ||
    !eventValue ||
    !selectedNumbers ||
    selectedNumbers.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Missing information or numbers not selected" });
  }

  try {
    const verifyRes = await fetch(
      `https://sandbox.monnify.com/api/v1/transactions/${reference}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
          ).toString("base64")}`,
        },
      }
    );

    const verifyData = await verifyRes.json();
    console.log("🔍 Monnify Verify Response:", verifyData);

    if (
      verifyData.requestSuccessful &&
      verifyData.responseBody &&
      verifyData.responseBody.paymentStatus === "PAID"
    ) {
      console.log("✅ Payment verified successfully");

      // ✅ Send email confirmation
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
