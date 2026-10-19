const express = require("express");
const router = express.Router();
const {
  createOrder,
  createGuestOrder,
  trackGuestOrder,
  listMyOrders,
  getOrder,
  cancelOrder,
  updateStatus,
  getDeliveryQuoteHandler,
  createOrderSchema,
  guestCreateOrderSchema,
  trackGuestOrderSchema,
  updateStatusSchema
} = require("../controllers/orderController");
const { validate } = require("../middleware/validate");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// GET /api/orders/delivery-quote - Dynamic delivery fee or TBD status by region (Public)
router.get("/delivery-quote", getDeliveryQuoteHandler);

// POST /api/orders - Create pending order with snapshot items (Authenticated)
router.post(
  "/",
  requireAuth,
  validate({ body: createOrderSchema }),
  createOrder
);

// POST /api/orders/guest - Create a pending guest order without an account;
// requires a contact email which is stored inside shippingAddress (Public)
router.post(
  "/guest",
  validate({ body: guestCreateOrderSchema }),
  createGuestOrder
);

// GET /api/orders/me - List authenticated user's order history (Authenticated)
// (Must come before /:id so "me" is not matched as an order ID parameter)
router.get("/me", requireAuth, listMyOrders);

// GET /api/orders/track/:id - Track a guest order; the matching contact email is
// required and non-guest orders are reported as 404 (Public)
// (Must come before /:id so "track" is not matched as an order ID parameter)
router.get(
  "/track/:id",
  validate({ query: trackGuestOrderSchema }),
  trackGuestOrder
);

// GET /api/orders/:id - Get specific order details (Authenticated)
router.get("/:id", requireAuth, getOrder);

// POST /api/orders/:id/cancel - Customer cancels own pending/paid order (Authenticated)
router.post("/:id/cancel", requireAuth, cancelOrder);

// PATCH /api/orders/:id/status - Update order lifecycle status (Admin only)
router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  validate({ body: updateStatusSchema }),
  updateStatus
);

module.exports = router;
