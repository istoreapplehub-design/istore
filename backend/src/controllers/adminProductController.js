const prisma = require("../utils/prisma");
const { formatProduct, safeJsonStringify } = require("../utils/json");
const { parsePagination } = require("../utils/pagination");

/**
 * 1. GET /api/admin/products
 * Retrieves paginated list of all products (including inactive), with stats
 */
async function listAllProducts(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      search,
      category,
      status = "all",
      featured,
      sort
    } = req.query;

    const where = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }
    // if status === "all", no isActive filter is applied

    if (category) {
      where.category = category;
    }

    if (featured !== undefined) {
      where.featured = featured === "true" || featured === true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ];
    }

    let orderBy = [{ createdAt: "desc" }];
    if (sort === "price_desc") {
      orderBy = [{ priceGHS: "desc" }];
    } else if (sort === "price_asc") {
      orderBy = [{ priceGHS: "asc" }];
    } else if (sort === "stock_asc") {
      orderBy = [{ stock: "asc" }];
    } else if (sort === "name_asc") {
      orderBy = [{ name: "asc" }];
    } else if (sort === "createdAt") {
      orderBy = [{ createdAt: "desc" }];
    }

    const [total, products, allStatsRecords] = await Promise.all([
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
      }),
      prisma.product.findMany({
        select: {
          id: true,
          isActive: true,
          stock: true
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const stats = {
      totalCount: allStatsRecords.length,
      activeCount: allStatsRecords.filter((p) => p.isActive).length,
      inactiveCount: allStatsRecords.filter((p) => !p.isActive).length,
      outOfStockCount: allStatsRecords.filter((p) => p.stock === 0).length,
      lowStockCount: allStatsRecords.filter((p) => p.stock > 0 && p.stock < 5).length
    };

    return res.json({
      data: products.map(formatProduct),
      meta: {
        page,
        limit,
        total,
        totalPages
      },
      stats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. GET /api/admin/products/:id
 * Fetches single product by ID with images and first 10 reviews
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { displayOrder: "asc" }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: true,
        message: "Product not found"
      });
    }

    const formatted = formatProduct(product);
    return res.json({
      product: formatted,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. POST /api/admin/products
 * Creates a new product with images
 */
async function createProduct(req, res, next) {
  try {
    const {
      name,
      slug,
      category,
      model,
      storage,
      storages,
      priceGHS,
      compareAtPriceGHS,
      stock,
      description,
      specs = {},
      images = [],
      colors = [],
      warranty,
      condition,
      brand = "Apple",
      tags = "",
      featured = false,
      isActive = true,
      displayOrder = 0
    } = req.body;

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug }
    });

    if (existing) {
      return res.status(409).json({
        error: true,
        message: "A product with this slug already exists"
      });
    }

    const finalSpecs = { ...specs };
    if (storages && Array.isArray(storages)) {
      finalSpecs.availableStorages = storages.join(", ");
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        category,
        model,
        storage: storage || null,
        priceGHS,
        compareAtPriceGHS: compareAtPriceGHS || null,
        stock,
        description,
        specs: safeJsonStringify(finalSpecs),
        colors: safeJsonStringify(colors),
        warranty,
        condition,
        brand,
        tags,
        featured,
        isActive,
        displayOrder,
        images: {
          create: images.map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            displayOrder: idx + 1
          }))
        }
      },
      include: {
        images: {
          orderBy: { displayOrder: "asc" }
        }
      }
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} created product ${product.id} (${product.name})`);
    }

    return res.status(201).json({
      product: formatProduct(product),
      message: "Product created"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. PATCH /api/admin/products/:id
 * Updates an existing product
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        error: true,
        message: "Product not found"
      });
    }

    const {
      name,
      slug,
      category,
      model,
      storage,
      storages,
      priceGHS,
      compareAtPriceGHS,
      stock,
      description,
      specs,
      images,
      colors,
      warranty,
      condition,
      brand,
      tags,
      featured,
      isActive,
      displayOrder
    } = req.body;

    // Check slug collision excluding current product
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.product.findUnique({
        where: { slug }
      });
      if (duplicate) {
        return res.status(409).json({
          error: true,
          message: "A product with this slug already exists"
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (category !== undefined) updateData.category = category;
    if (model !== undefined) updateData.model = model;
    if (storage !== undefined) updateData.storage = storage;
    if (priceGHS !== undefined) updateData.priceGHS = priceGHS;
    if (compareAtPriceGHS !== undefined) updateData.compareAtPriceGHS = compareAtPriceGHS;
    if (stock !== undefined) updateData.stock = stock;
    if (description !== undefined) updateData.description = description;
    if (warranty !== undefined) updateData.warranty = warranty;
    if (condition !== undefined) updateData.condition = condition;
    if (brand !== undefined) updateData.brand = brand;
    if (tags !== undefined) updateData.tags = tags;
    if (featured !== undefined) updateData.featured = featured;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    if (colors !== undefined) {
      updateData.colors = safeJsonStringify(colors);
    }

    if (specs !== undefined || storages !== undefined) {
      let currentSpecs = {};
      try {
        currentSpecs = JSON.parse(existing.specs || "{}");
      } catch {}
      const mergedSpecs = { ...currentSpecs, ...(specs || {}) };
      if (storages && Array.isArray(storages)) {
        mergedSpecs.availableStorages = storages.join(", ");
      }
      updateData.specs = safeJsonStringify(mergedSpecs);
    }

    // Handle image updates in transaction if images provided
    let updated;
    if (images && Array.isArray(images)) {
      updated = await prisma.$transaction(async (tx) => {
        await tx.productImage.deleteMany({
          where: { productId: id }
        });
        return tx.product.update({
          where: { id },
          data: {
            ...updateData,
            images: {
              create: images.map((url, idx) => ({
                url,
                isPrimary: idx === 0,
                displayOrder: idx + 1
              }))
            }
          },
          include: {
            images: {
              orderBy: { displayOrder: "asc" }
            }
          }
        });
      });
    } else {
      updated = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          images: {
            orderBy: { displayOrder: "asc" }
          }
        }
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} updated product ${id} (${updated.name})`);
    }

    return res.json({
      product: formatProduct(updated),
      message: "Product updated"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. DELETE /api/admin/products/:id
 * Soft deletes product by setting isActive = false
 */
async function softDeleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        error: true,
        message: "Product not found"
      });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} deactivated product ${id}`);
    }

    return res.json({
      message: "Product deactivated"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. PATCH /api/admin/products/:id/restore
 * Restores product by setting isActive = true
 */
async function restoreProduct(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        error: true,
        message: "Product not found"
      });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: true }
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} restored product ${id}`);
    }

    return res.json({
      message: "Product restored"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 7. GET /api/admin/products/stats
 * Returns overall inventory statistics for the admin dashboard
 */
async function getAdminStats(req, res, next) {
  try {
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        category: true,
        priceGHS: true,
        stock: true,
        isActive: true,
        featured: true
      }
    });

    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter((p) => p.isActive).length;
    const inactiveProducts = allProducts.filter((p) => !p.isActive).length;
    const totalStockValueGHS = allProducts.reduce(
      (sum, p) => sum + p.priceGHS * p.stock,
      0
    );
    const outOfStock = allProducts.filter((p) => p.stock === 0).map((p) => p.id);
    const lowStock = allProducts
      .filter((p) => p.stock > 0 && p.stock < 5)
      .map((p) => p.id);
    const featuredCount = allProducts.filter((p) => p.featured).length;

    const byCategory = allProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalStockValueGHS,
      outOfStock,
      lowStock,
      featuredCount,
      byCategory
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. GET /api/admin/products/export
 * Raw CSV export of all hardware inventory items
 */
async function exportProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" }
    });

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = [
      "Product ID",
      "Name",
      "Slug",
      "Category",
      "Model",
      "Price (GHS)",
      "Stock",
      "Condition",
      "Featured",
      "Active",
      "Created At"
    ].join(",");

    const rows = products.map((p) =>
      [
        escapeCsv(p.id),
        escapeCsv(p.name),
        escapeCsv(p.slug),
        escapeCsv(p.category),
        escapeCsv(p.model),
        p.priceGHS,
        p.stock,
        escapeCsv(p.condition),
        p.featured ? "Yes" : "No",
        p.isActive ? "Yes" : "No",
        escapeCsv(new Date(p.createdAt).toISOString())
      ].join(",")
    );

    const csvString = [header, ...rows].join("\n");
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="products-${today}.csv"`
    );

    return res.send(csvString);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
  getAdminStats,
  exportProducts
};
