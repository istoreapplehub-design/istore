const express = require("express");
const router = express.Router();
const {
  provisionUser,
  getMe,
  upgradeRole,
  listAdmins,
  listAllUsers,
  provisionSchema,
  upgradeRoleSchema,
} = require("../controllers/authController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

router.post(
  "/provision",
  validate({ body: provisionSchema }),
  provisionUser
);
router.get("/me", requireAuth, getMe);
router.get("/admins", requireAuth, requireAdmin, listAdmins);
router.get("/users", requireAuth, requireAdmin, listAllUsers);
router.post(
  "/role/upgrade",
  requireAuth,
  requireAdmin,
  validate({ body: upgradeRoleSchema }),
  upgradeRole
);

module.exports = router;
