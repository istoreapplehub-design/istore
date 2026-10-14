const { formatProduct } = require("../utils/json");
const { parsePagination } = require("../utils/pagination");

const prisma = require("../utils/prisma");

/**
 * Retrieves a paginated list of active products with filtering and sorting
 */
async function listProducts(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      category,
      featured,
      search,
      minPrice,
      maxPrice,
      condition,
      sort
    } = req.query;

    const where = {
      isActive: true
    };

    if (category) {
      where.category = {
        equals: category
      };
    }

    if (featured !== undefined) {
      where.featured = featured === "true" || featured === true;
    }

    if (condition) {
      where.condition = {
        equals: condition
      };
    }

    if (minPrice || maxPrice) {
      where.priceGHS = {};
      if (minPrice) where.priceGHS.gte = parseFloat(minPrice);
      if (maxPrice) where.priceGHS.lte = parseFloat(maxPrice);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { model: { contains: q } },
        { description: { contains: q } }
      ];
    }

    let orderBy = [{ displayOrder: "asc" }, { createdAt: "desc" }];
    if (sort === "price_asc") {
      orderBy = [{ priceGHS: "asc" }];
    } else if (sort === "price_desc") {
      orderBy = [{ priceGHS: "desc" }];
    } else if (sort === "newest") {
      orderBy = [{ createdAt: "desc" }];
    } else if (sort === "rating") {
      orderBy = [{ rating: "desc" }];
    } else if (sort === "popular") {
      orderBy = [{ reviewCount: "desc" }];
    }

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: {
            orderBy: { displayOrder: "asc" }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNext = page < totalPages;
    const data = rawProducts.map(formatProduct);

    res.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches a single active product by slug, including recent reviews and related products
 */
async function getProduct(req, res, next) {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isActive: true
      },
      include: {
        images: {
          orderBy: { displayOrder: "asc" }
        },
        reviews: {
          take: 3,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!product) {
      const err = new Error("Product not found");
      err.status = 404;
      return next(err);
    }

    const related = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
        isActive: true
      },
      take: 4,
      orderBy: { displayOrder: "asc" },
      include: {
        images: {
          orderBy: { displayOrder: "asc" }
        }
      }
    });

    const formatted = formatProduct(product);
    res.json({
      ...formatted,
      reviews: product.reviews,
      relatedProducts: related.map(formatProduct)
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns a list of active related products from the same category
 */
async function getRelated(req, res, next) {
  try {
    const { slug } = req.params;
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 4;
    if (limit > 12) limit = 12;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, category: true, isActive: true }
    });

    if (!product || !product.isActive) {
      const err = new Error("Product not found");
      err.status = 404;
      return next(err);
    }

    const related = await prisma.product.findMany({
      where: {
        category: product.category,
        id: { not: product.id },
        isActive: true
      },
      take: limit,
      orderBy: { displayOrder: "asc" },
      include: {
        images: {
          orderBy: { displayOrder: "asc" }
        }
      }
    });

    res.json(related.map(formatProduct));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  getRelated
};
