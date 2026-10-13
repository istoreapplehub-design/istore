const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");
const { safeJsonStringify, formatOrder } = require("../utils/json");
const { VALID_GHANA_REGIONS, getDeliveryFee } = require("../utils/delivery");
const { parsePagination } = require("../utils/pagination");

const prisma = new PrismaClient();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        qty: z.number().int().min(1, "Qty must be at least 1").max(10, "Qty cannot exceed 10"),
        color: z.string().optional(),
        storage: z.string().optional()
      })
    )
    .min(1, "Order must contain at least 1 item")
    .max(20, "Order cannot exceed 20 items"),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
    phone: z.string().trim().regex(/^(\+233|0)[0-9]{9}$/, "Invalid Ghana phone number (e.g. +233240000000 or 0240000000)"),
    region: z.enum(VALID_GHANA_REGIONS, {
      errorMap: () => ({ message: "Region must be one of the 16 valid Ghanaian administrative regions" })
    }),
    city: z.string().trim().min(2, "City must be at least 2 characters").max(50),
    gpsAddress: z.string().trim().optional(),
    landmark: z.string().trim().optional()
  }),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional()
});

const updateStatusSchema = z.object({
  status: z.enum(["shipped", "delivered", "cancelled"], {
    errorMap: () => ({ message: "Status must be 'shipped', 'delivered', or 'cancelled'" })
  })
});

/**
 * Creates an order in pending status, snapshots item details, and calculates regional delivery
 */
async function createOrder(req, res, next) {
  try {
    const { items, shippingAddress, notes } = req.body;
    const userId = req.user?.id || req.userId;

    const createdOrder = await prisma.$transaction(async (tx) => {
      const productIds = items.map((i) => i.productId);

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true
        },
        include: {
          images: {
            orderBy: { displayOrder: "asc" },
            take: 1
          }
        }
      });

      const productMap = new Map();
      products.forEach((p) => productMap.set(p.id, p));

      // 1. Verify all products exist and are active
      for (const item of items) {
        if (!productMap.has(item.productId)) {
          const err = new Error(`Product not found or currently unavailable: ${item.productId}`);
          err.status = 400;
          throw err;
        }
      }

      // 2. Verify stock availability
      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (prod.stock < item.qty) {
          const err = new Error(`Insufficient stock for ${prod.name}. Available: ${prod.stock}`);
          err.status = 400;
          throw err;
        }
      }

      // 3. Create snapshots and calculate totals
      let subtotalGHS = 0;
      const orderItemsData = items.map((item) => {
        const prod = productMap.get(item.productId);
        const itemTotal = prod.priceGHS * item.qty;
        subtotalGHS += itemTotal;

        return {
          productId: prod.id,
          name: prod.name,
          priceGHS: prod.priceGHS,
          qty: item.qty,
          color: item.color || null,
          storage: item.storage || prod.storage || null,
          image: prod.images[0]?.url || `https://placehold.co/800x800?text=${encodeURIComponent(prod.name)}`
        };
      });

      const deliveryFeeGHS = getDeliveryFee(shippingAddress.region);
      const totalGHS = subtotalGHS + deliveryFeeGHS;

      // 4. Create Order and nested OrderItems
      const newOrder = await tx.order.create({
        data: {
          userId,
          subtotalGHS,
          deliveryFeeGHS,
          totalGHS,
          deliveryRegion: shippingAddress.region,
          shippingAddress: safeJsonStringify(shippingAddress),
          status: "pending",
          notes: notes || null,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });

      return newOrder;
    });

    res.status(201).json(formatOrder(createdOrder));
  } catch (err) {
    next(err);
  }
}

/**
 * Returns a paginated list of orders placed by the authenticated user
 */
async function listMyOrders(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const userId = req.user?.id || req.userId;

    const where = { userId };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: true
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNext = page < totalPages;

    res.json({
      data: orders.map(formatOrder),
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
 * Retrieves a single order by ID for the authorized owner
 */
async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.userId;
    const isAdmin = req.user?.role === "admin";

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      return next(err);
    }

    if (order.userId && order.userId !== userId && !isAdmin) {
      const err = new Error("Forbidden: You cannot access this order");
      err.status = 403;
      return next(err);
    }

    res.json(formatOrder(order));
  } catch (err) {
    next(err);
  }
}

/**
 * Updates order delivery status following strict lifecycle transition rules
 */
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      const err = new Error("Order not found");
      err.status = 404;
      return next(err);
    }

    const current = existingOrder.status;
    const isValidTransition =
      (current === "pending" && status === "cancelled") ||
      (current === "paid" && (status === "shipped" || status === "cancelled")) ||
      (current === "shipped" && status === "delivered");

    if (!isValidTransition) {
      const err = new Error(`Invalid status transition from ${current} to ${status}`);
      err.status = 400;
      return next(err);
    }

    const updateData = { status };
    const now = new Date();

    if (status === "shipped") updateData.shippedAt = now;
    if (status === "delivered") updateData.deliveredAt = now;
    if (status === "cancelled") updateData.cancelledAt = now;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true
      }
    });

    res.json(formatOrder(updated));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  listMyOrders,
  getOrder,
  updateStatus,
  createOrderSchema,
  updateStatusSchema
};
