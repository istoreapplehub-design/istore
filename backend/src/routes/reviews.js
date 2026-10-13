const express = require("express");
const router = express.Router();
const {
  listReviews,
  createReview,
  createReviewSchema
} = require("../controllers/reviewController");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

// GET /api/products/:slug/reviews - Paginated customer reviews & star breakdown (Public)
router.get("/:slug/reviews", listReviews);

// POST /api/products/:slug/reviews - Submit customer review (Authenticated)
router.post(
  "/:slug/reviews",
  requireAuth,
  validate({ body: createReviewSchema }),
  createReview
);

module.exports = router;
