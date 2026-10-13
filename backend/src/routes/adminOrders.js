const express = require("express");
const router = express.Router();
const {
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderTimeline,
  getRevenueStats,
  getPendingCount,
  exportOrders
} = require("../controllers/adminOrderController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { z } = require("zod");

const updateStatusSchema = z.object({
  status: z.enum(["shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().max(100).optional(),
  courier: z.string().max(50).optional(),
  adminNote: z.string().max(500).optional()
});

router.use(requireAuth, requireAdmin);

router.get("/", listAllOrders);
router.get("/stats", getRevenueStats);
router.get("/pending-count", getPendingCount);
router.get("/export", exportOrders);
router.get("/:id", getOrderById);
router.get("/:id/timeline", getOrderTimeline);
router.patch(
  "/:id/status",
  validate({ body: updateStatusSchema }),
  updateOrderStatus
);

module.exports = router;
