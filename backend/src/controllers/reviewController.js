const { z } = require("zod");

const prisma = require("../utils/prisma");

const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  body: z.string().trim().min(10, "Body must be at least 10 characters").max(1000, "Body cannot exceed 1000 characters"),
  authorName: z.string().trim().min(2, "Author name must be at least 2 characters").max(50, "Author name cannot exceed 50 characters")
});

/**
 * Retrieves paginated reviews for a product with breakdown counts and average rating
 */
async function listReviews(req, res, next) {
  try {
    const { slug } = req.params;
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;
    const sort = req.query.sort;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, rating: true, reviewCount: true, isActive: true }
    });

    if (!product || !product.isActive) {
      const err = new Error("Product not found");
      err.status = 404;
      return next(err);
    }

    let orderBy = { createdAt: "desc" };
    if (sort === "highest") {
      orderBy = { rating: "desc" };
    } else if (sort === "lowest") {
      orderBy = { rating: "asc" };
    }

    const [total, reviews, breakdowns] = await Promise.all([
      prisma.review.count({
        where: { productId: product.id }
      }),
      prisma.review.findMany({
        where: { productId: product.id },
        orderBy,
        skip,
        take: limit
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId: product.id },
        _count: { _all: true }
      })
    ]);

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRating = 0;
    breakdowns.forEach((item) => {
      ratingBreakdown[item.rating] = item._count._all;
      sumRating += item.rating * item._count._all;
    });

    const avgRating = total > 0 ? parseFloat((sumRating / total).toFixed(1)) : 5.0;
    const totalPages = Math.ceil(total / limit) || 1;
    const hasNext = page < totalPages;

    res.json({
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        avgRating,
        ratingBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new customer review and recomputes the product average rating in a transaction
 */
async function createReview(req, res, next) {
  try {
    const { slug } = req.params;
    const { rating, title, body, authorName } = req.body;
    const userId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { slug }
      });

      if (!product || !product.isActive) {
        const err = new Error("Product not found");
        err.status = 404;
        throw err;
      }

      const existing = await tx.review.findFirst({
        where: { productId: product.id, userId }
      });

      if (existing) {
        const err = new Error("You have already reviewed this product.");
        err.status = 409;
        throw err;
      }

      const review = await tx.review.create({
        data: {
          productId: product.id,
          userId,
          authorName,
          rating,
          title,
          body
        }
      });

      const stats = await tx.review.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { _all: true }
      });

      const newRating = stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : rating;
      const newReviewCount = stats._count._all || 1;

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          rating: newRating,
          reviewCount: newReviewCount
        },
        select: {
          id: true,
          rating: true,
          reviewCount: true
        }
      });

      return {
        review,
        product: {
          rating: updatedProduct.rating,
          reviewCount: updatedProduct.reviewCount
        }
      };
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listReviews,
  createReview,
  createReviewSchema
};
