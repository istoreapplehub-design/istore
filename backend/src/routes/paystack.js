const express = require("express");
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  handleWebhook,
  initializePaymentSchema
} = require("../controllers/paystackController");
const { validate } = require("../middleware/validate");
const { optionalAuth } = require("../middleware/auth");

// POST /api/paystack/initialize - Initialize Paystack checkout for an order
// (Optional auth: authenticated users pay their own orders; guests pay a null-userId
//  order by passing the contact email stored on the order — invalid tokens still 401)
router.post(
  "/initialize",
  optionalAuth,
  validate({ body: initializePaymentSchema }),
  initializePayment
);

// GET /api/paystack/verify/:reference - Verify transaction reference and confirm payment (Public deep-link)
router.get("/verify/:reference", verifyPayment);

// POST /api/paystack/webhook - Paystack server webhook event handler (Public with HMAC verification)
router.post("/webhook", handleWebhook);

module.exports = router;
