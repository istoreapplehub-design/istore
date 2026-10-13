const express = require("express");
const router = express.Router();
const {
  wipeDemoOrders,
  resetAllData,
  resetSchema
} = require("../controllers/adminSettingsController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

router.use(requireAuth, requireAdmin);

router.delete("/demo-orders", wipeDemoOrders);
router.post("/reset", validate({ body: resetSchema }), resetAllData);

module.exports = router;
