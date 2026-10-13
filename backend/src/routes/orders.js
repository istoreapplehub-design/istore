const express = require("express");
const router = express.Router();
const {
  createOrder,
  listMyOrders,
  getOrder,
  updateStatus,
  createOrderSchema,
  updateStatusSchema
} = require("../controllers/orderController");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

// POST /api/orders - Create pending order with snapshot items (Authenticated)
router.post(
  "/",
  requireAuth,
  validate({ body: createOrderSchema }),
  createOrder
);

// GET /api/orders/me - List authenticated user's order history (Authenticated)
// (Must come before /:id so "me" is not matched as an order ID parameter)
router.get("/me", requireAuth, listMyOrders);

// GET /api/orders/:id - Get specific order details (Authenticated)
router.get("/:id", requireAuth, getOrder);

// PATCH /api/orders/:id/status - Update order lifecycle status (Authenticated / Admin)
router.patch(
  "/:id/status",
  requireAuth,
  validate({ body: updateStatusSchema }),
  updateStatus
);

module.exports = router;
