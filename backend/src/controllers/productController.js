const { formatProduct } = require("../utils/json");
const { parsePagination } = require("../utils/pagination");
const { CATALOG_2026_PRODUCTS } = require("../utils/catalog2026");

const prisma = require("../utils/prisma");

function formatCatalogItem(item) {
  return {
    ...item,
    tags:
      typeof item.tags === "string"
        ? item.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : Array.isArray(item.tags)
          ? item.tags
          : [],
    isActive: true
  };
}

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
      sort,
      inStock
    } = req.query;

    const rawProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        images: {
          orderBy: { displayOrder: "asc" }
        }
      }
    });

    const dbFormatted = rawProducts.map(formatProduct);
    const bySlug = new Map();
    for (const c of CATALOG_2026_PRODUCTS) {
      bySlug.set(c.slug, formatCatalogItem(c));
    }
    for (const p of dbFormatted) {
      if (!bySlug.has(p.slug)) {
        bySlug.set(p.slug, p);
      }
    }

    let list = Array.from(bySlug.values());

    if (inStock === "true" || inStock === true) {
      list = list.filter((p) => p.stock > 0);
    }
    if (category) {
      const cat = String(category).trim().toLowerCase();
      list = list.filter((p) => p.category.trim().toLowerCase() === cat);
    }
    if (featured !== undefined) {
      const want = featured === "true" || featured === true;
      list = list.filter((p) => Boolean(p.featured) === want);
    }
    if (condition) {
      const cond = String(condition).trim().toLowerCase();
      list = list.filter((p) => p.condition.trim().toLowerCase() === cond);
    }
    if (minPrice) {
      list = list.filter((p) => p.priceGHS >= parseFloat(minPrice));
    }
    if (maxPrice) {
      list = list.filter((p) => p.priceGHS <= parseFloat(maxPrice));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.model && p.model.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (sort === "price_asc") {
      list.sort((a, b) => a.priceGHS - b.priceGHS);
    } else if (sort === "price_desc") {
      list.sort((a, b) => b.priceGHS - a.priceGHS);
    } else if (sort === "newest") {
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    } else if (sort === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === "popular") {
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    } else {
      list.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
    }

    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const hasNext = page < totalPages;
    const data = list.slice(skip, skip + limit);

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
      const catMatch = CATALOG_2026_PRODUCTS.find(
        (p) => p.slug === slug || p.id === slug
      );
      if (catMatch) {
        const formattedCat = formatCatalogItem(catMatch);
        const rel = CATALOG_2026_PRODUCTS.filter(
          (p) => p.category === catMatch.category && p.slug !== catMatch.slug
        )
          .slice(0, 4)
          .map(formatCatalogItem);
        return res.json({
          ...formattedCat,
          reviews: [
            {
              id: `rev-${catMatch.id}-1`,
              productId: catMatch.id,
              authorName: "Kwame Mensah",
              rating: 5,
              title: "Sealed Apple box, express delivery in Accra",
              body: "Unboxed this today in East Legon — 100% factory sealed with official Apple warranty verified online.",
              createdAt: "2026-10-15T10:00:00.000Z"
            },
            {
              id: `rev-${catMatch.id}-2`,
              productId: catMatch.id,
              authorName: "Ama Serwaa",
              rating: 5,
              title: "Unbelievable battery life and build quality",
              body: "Upgraded through I-Store and paid effortlessly with MTN MoMo. Easily lasts two full days.",
              createdAt: "2026-10-12T10:00:00.000Z"
            }
          ],
          relatedProducts: rel
        });
      }

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
      const catMatch = CATALOG_2026_PRODUCTS.find(
        (p) => p.slug === slug || p.id === slug
      );
      if (catMatch) {
        const rel = CATALOG_2026_PRODUCTS.filter(
          (p) => p.category === catMatch.category && p.slug !== catMatch.slug
        )
          .slice(0, limit)
          .map(formatCatalogItem);
        return res.json(rel);
      }

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
