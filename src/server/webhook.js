import express from "express";
import { handleWebhook } from "../utils/paystackService";

const router = express.Router();

// Paystack webhook endpoint
router.post("/paystack-webhook", async (req, res) => {
  try {
    const event = {
      headers: req.headers,
      body: req.body,
    };

    await handleWebhook(event);
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
});

export default router;
