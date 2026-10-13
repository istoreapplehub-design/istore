const express = require("express");
const router = express.Router();
const { listCategories } = require("../controllers/categoryController");

// GET /api/categories - List 7 store categories with aggregated product counts (Public)
router.get("/", listCategories);

module.exports = router;
