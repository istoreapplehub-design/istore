const express = require("express");
const router = express.Router();
const {
  verifyNia,
  calculateInstallment,
  applyInstallmentPlan,
  initializeDownPayment,
  verifyDownPayment,
  getMyPlans,
  getPlanDetails,
  payMilestone,
  confirmMilestone,
  getAdminInstallmentPlans,
  verifyNiaSchema,
  calculateInstallmentSchema,
  applyInstallmentSchema
} = require("../controllers/installmentController");
const { validate } = require("../middleware/validate");
const { optionalAuth, requireAuth, requireAdmin } = require("../middleware/auth");

// Public / Authenticated KYC NIA Check
router.post("/verify-nia", optionalAuth, validate({ body: verifyNiaSchema }), verifyNia);

// Calculation simulator
router.post("/calculate", validate({ body: calculateInstallmentSchema }), calculateInstallment);

// Apply for installment plan on an order
router.post("/apply", optionalAuth, validate({ body: applyInstallmentSchema }), applyInstallmentPlan);

// Downpayment checkout
router.post("/initialize-downpayment", optionalAuth, initializeDownPayment);
router.post("/verify-downpayment", verifyDownPayment);

// Customer installment views & repayments
router.get("/my-plans", optionalAuth, getMyPlans);
router.get("/plan/:id", optionalAuth, getPlanDetails);
router.post("/pay-milestone", optionalAuth, payMilestone);
router.post("/confirm-milestone", confirmMilestone);

// Admin installment management
router.get("/admin/all", requireAdmin, getAdminInstallmentPlans);

module.exports = router;
