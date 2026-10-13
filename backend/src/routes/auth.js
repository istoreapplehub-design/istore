const express = require("express");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const {
  registerSchema,
  loginSchema,
  register,
  login,
  getMe
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.get("/me", requireAuth, getMe);

module.exports = router;
