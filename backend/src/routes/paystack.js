const express = require("express");
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  handleWebhook,
  initializePaymentSchema
} = require("../controllers/paystackController");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

// POST /api/paystack/initialize - Initialize Paystack checkout for an order (Authenticated)
router.post(
  "/initialize",
  requireAuth,
  validate({ body: initializePaymentSchema }),
  initializePayment
);

// GET /api/paystack/verify/:reference - Verify transaction reference and confirm payment (Public deep-link)
router.get("/verify/:reference", verifyPayment);

// POST /api/paystack/webhook - Paystack server webhook event handler (Public with HMAC verification)
router.post("/webhook", handleWebhook);

module.exports = router;
