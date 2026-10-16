const express = require("express");
const router = express.Router();
const {
  listReviews,
  createReview,
  createReviewSchema
} = require("../controllers/reviewController");
const { validate } = require("../middleware/validate");
const { optionalAuth } = require("../middleware/auth");

// GET /api/products/:slug/reviews - Paginated customer reviews & star breakdown (Public)
router.get("/:slug/reviews", listReviews);

// POST /api/products/:slug/reviews - Submit customer review (Authenticated or Guest)
router.post(
  "/:slug/reviews",
  optionalAuth,
  validate({ body: createReviewSchema }),
  createReview
);

module.exports = router;
