const express = require("express");
const router = express.Router();
const {
  listProducts,
  getProduct,
  getRelated
} = require("../controllers/productController");

// GET /api/products - List products with filters and pagination (Public)
router.get("/", listProducts);

// GET /api/products/:slug/related - Get 4 related products in same category (Public)
router.get("/:slug/related", getRelated);

// GET /api/products/:slug - Get full product details by slug (Public)
router.get("/:slug", getProduct);

module.exports = router;
