const express = require("express");
const router = express.Router();
const {
  listAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  getAdminStats,
  exportProducts,
} = require("../controllers/adminProductController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createProductSchema,
  updateProductSchema,
} = require("../utils/validation/adminProductSchemas");

// Every route in this file requires an admin
router.use(requireAuth, requireAdmin);

router.get("/", listAllProducts);
router.get("/stats", getAdminStats);
router.get("/export", exportProducts);
router.get("/:id", getProductById);
router.post("/", validate({ body: createProductSchema }), createProduct);
router.patch("/:id", validate({ body: updateProductSchema }), updateProduct);
router.delete("/:id", softDeleteProduct);
router.patch("/:id/restore", restoreProduct);

module.exports = router;
