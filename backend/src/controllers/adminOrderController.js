const prisma = require("../utils/prisma");
const { safeJsonParse } = require("../utils/json");
const { parsePagination } = require("../utils/pagination");

/**
 * 1. GET /api/admin/orders
 * Paginated list of all orders with status, customer, and operational metrics
 */
async function listAllOrders(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      status = "all",
      search,
      from,
      to,
      sort = "createdAt_desc"
    } = req.query;

    const where = {};

    if (status !== "all") {
      where.status = status;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { id: { startsWith: q } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q } } },
        { shippingAddress: { contains: q, mode: "insensitive" } },
        {
          items: {
            some: {
              OR: [
                { serialNumber: { contains: q, mode: "insensitive" } },
                { imei: { contains: q, mode: "insensitive" } }
              ]
            }
          }
        }
      ];
    }

    let orderBy = [{ createdAt: "desc" }];
    if (sort === "createdAt_asc") {
      orderBy = [{ createdAt: "asc" }];
    } else if (sort === "total_desc") {
      orderBy = [{ totalGHS: "desc" }];
    } else if (sort === "total_asc") {
      orderBy = [{ totalGHS: "asc" }];
    }

    const [total, orders, allOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true }
          },
          _count: {
            select: { items: true }
          }
        }
      }),
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          totalGHS: true,
          createdAt: true
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNext = page < totalPages;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = {
      totalOrders: allOrders.length,
      byStatus: {
        pending: allOrders.filter((o) => o.status === "pending").length,
        paid: allOrders.filter((o) => o.status === "paid").length,
        shipped: allOrders.filter((o) => o.status === "shipped").length,
        delivered: allOrders.filter((o) => o.status === "delivered").length,
        cancelled: allOrders.filter((o) => o.status === "cancelled").length
      },
      totalRevenueGHS: allOrders
        .filter((o) => ["paid", "shipped", "delivered"].includes(o.status))
        .reduce((sum, o) => sum + o.totalGHS, 0),
      todayRevenueGHS: allOrders
        .filter(
          (o) =>
            ["paid", "shipped", "delivered"].includes(o.status) &&
            new Date(o.createdAt) >= today
        )
        .reduce((sum, o) => sum + o.totalGHS, 0),
      todayOrderCount: allOrders.filter(
        (o) => new Date(o.createdAt) >= today
      ).length
    };

    const formattedData = orders.map((o) => ({
      id: o.id,
      user: o.user || { name: "Guest", phone: "", email: null },
      itemCount: o._count.items,
      subtotalGHS: o.subtotalGHS,
      deliveryFeeGHS: o.deliveryFeeGHS,
      totalGHS: o.totalGHS,
      deliveryRegion: o.deliveryRegion,
      shippingAddress: safeJsonParse(o.shippingAddress, {}),
      status: o.status,
      paymentChannel: o.paymentChannel,
      paymentReference: o.paymentReference,
      trackingNumber: o.trackingNumber,
      courier: o.courier,
      adminNote: o.adminNote,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
      shippedAt: o.shippedAt,
      deliveredAt: o.deliveredAt,
      cancelledAt: o.cancelledAt
    }));

    return res.json({
      data: formattedData,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext
      },
      summary
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. GET /api/admin/orders/:id
 * Fetches complete order details, line items, and customer info
 */
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        installmentPlan: {
          include: {
            milestones: {
              orderBy: { milestoneIndex: "asc" }
            },
            kyc: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            creditScore: true,
            creditTier: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: true,
        message: "Order not found"
      });
    }

    return res.json({
      data: {
        ...order,
        shippingAddress: safeJsonParse(order.shippingAddress, {})
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. PATCH /api/admin/orders/:id/status
 * Updates order status with strict lifecycle validation and tracking information
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courier, adminNote } = req.body;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        error: true,
        message: "Order not found"
      });
    }

    const allowedTransitions = {
      pending: ["cancelled"],
      paid: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [],
      cancelled: []
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        error: true,
        message: `Cannot transition order status from '${order.status}' to '${status}'`
      });
    }

    const updateData = { status };
    if (status === "shipped") updateData.shippedAt = new Date();
    if (status === "delivered") updateData.deliveredAt = new Date();
    if (status === "cancelled") updateData.cancelledAt = new Date();

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (courier !== undefined) updateData.courier = courier;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: {
          select: { id: true, name: true, phone: true, email: true }
        }
      }
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} updated order ${id} to ${status}`);
    }

    return res.json({
      message: "Order status updated successfully",
      data: {
        ...updated,
        shippingAddress: safeJsonParse(updated.shippingAddress, {})
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. GET /api/admin/orders/:id/timeline
 * Returns order lifecycle events for UI timeline display
 */
async function getOrderTimeline(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        paidAt: true,
        shippedAt: true,
        deliveredAt: true,
        cancelledAt: true,
        trackingNumber: true,
        courier: true,
        adminNote: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: true,
        message: "Order not found"
      });
    }

    const rawTimeline = [
      { label: "Order Placed", at: order.createdAt, done: true },
      { label: "Payment Confirmed", at: order.paidAt, done: !!order.paidAt },
      {
        label: "Shipped",
        at: order.shippedAt,
        done: !!order.shippedAt,
        trackingNumber: order.trackingNumber || null,
        courier: order.courier || null
      },
      { label: "Delivered", at: order.deliveredAt, done: !!order.deliveredAt }
    ];

    if (order.status === "cancelled" || order.cancelledAt) {
      rawTimeline.push({
        label: "Cancelled",
        at: order.cancelledAt,
        done: !!order.cancelledAt,
        adminNote: order.adminNote || null
      });
    }

    let foundFirstUndone = false;
    const timeline = rawTimeline.filter((event) => {
      if (event.done) return true;
      if (!foundFirstUndone && order.status !== "cancelled") {
        foundFirstUndone = true;
        return true;
      }
      return false;
    });

    return res.json({
      orderId: order.id,
      status: order.status,
      timeline
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. GET /api/admin/orders/stats
 * Aggregates revenue, daily chart values, best sellers, and payment channels
 */
async function getRevenueStats(req, res, next) {
  try {
    const { period = "30d" } = req.query;

    const now = new Date();
    let cutoff = new Date();
    let daysCount = 30;

    if (period === "today") {
      cutoff.setHours(0, 0, 0, 0);
      daysCount = 1;
    } else if (period === "7d") {
      cutoff.setDate(now.getDate() - 7);
      cutoff.setHours(0, 0, 0, 0);
      daysCount = 7;
    } else if (period === "30d") {
      cutoff.setDate(now.getDate() - 30);
      cutoff.setHours(0, 0, 0, 0);
      daysCount = 30;
    } else if (period === "all") {
      cutoff = new Date(0);
      daysCount = 30;
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: cutoff }
      },
      include: {
        items: true
      }
    });

    const revenueOrders = orders.filter((o) =>
      ["paid", "shipped", "delivered"].includes(o.status)
    );

    const revenueGHS = revenueOrders.reduce((sum, o) => sum + o.totalGHS, 0);
    const orderCount = revenueOrders.length;
    const avgOrderValueGHS = orderCount > 0 ? Math.round(revenueGHS / orderCount) : 0;

    // Daily charting aggregation with zero-days included
    const byDayMap = {};
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      byDayMap[dateKey] = { date: dateKey, revenueGHS: 0, orderCount: 0 };
    }

    revenueOrders.forEach((o) => {
      const dateKey = o.createdAt.toISOString().slice(0, 10);
      if (byDayMap[dateKey]) {
        byDayMap[dateKey].revenueGHS += o.totalGHS;
        byDayMap[dateKey].orderCount += 1;
      }
    });

    const byDay = Object.values(byDayMap);

    // Top products aggregation
    const productSalesMap = {};
    revenueOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            productId: item.productId,
            name: item.name,
            unitsSold: 0,
            revenueGHS: 0
          };
        }
        productSalesMap[item.productId].unitsSold += item.qty;
        productSalesMap[item.productId].revenueGHS += item.priceGHS * item.qty;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenueGHS - a.revenueGHS)
      .slice(0, 5);

    // Payment channel breakdown
    const byChannel = {
      mobile_money: { count: 0, revenueGHS: 0 },
      card: { count: 0, revenueGHS: 0 },
      bank: { count: 0, revenueGHS: 0 }
    };

    revenueOrders.forEach((o) => {
      const ch = o.paymentChannel || "mobile_money";
      if (!byChannel[ch]) {
        byChannel[ch] = { count: 0, revenueGHS: 0 };
      }
      byChannel[ch].count += 1;
      byChannel[ch].revenueGHS += o.totalGHS;
    });

    return res.json({
      period,
      revenueGHS,
      orderCount,
      avgOrderValueGHS,
      byDay,
      topProducts,
      byChannel
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. GET /api/admin/orders/pending-count
 * Returns badge counts for active fulfillment stages
 */
async function getPendingCount(req, res, next) {
  try {
    const [pending, paid, shipped] = await Promise.all([
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "paid" } }),
      prisma.order.count({ where: { status: "shipped" } })
    ]);

    return res.json({
      pending,
      paid,
      shipped
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 7. GET /api/admin/orders/export
 * Exports orders in clean CSV format
 */
async function exportOrders(req, res, next) {
  try {
    const { status = "all", from, to } = req.query;

    const where = {};
    if (status !== "all") where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true } },
        _count: { select: { items: true } }
      }
    });

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Phone",
      "City",
      "Region",
      "Items",
      "Subtotal (GHS)",
      "Delivery (GHS)",
      "Total (GHS)",
      "Status",
      "Payment Channel",
      "Reference",
      "Tracking"
    ];

    const rows = orders.map((o) => {
      const addr = safeJsonParse(o.shippingAddress, {});
      const customerName = (o.user?.name || addr.fullName || "Guest").replace(/"/g, '""');
      const phone = (o.user?.phone || addr.phone || "").replace(/"/g, '""');
      const city = (addr.city || "").replace(/"/g, '""');
      const region = (o.deliveryRegion || addr.region || "").replace(/"/g, '""');
      const tracking = (o.trackingNumber || "").replace(/"/g, '""');
      const ref = (o.paymentReference || "").replace(/"/g, '""');

      return [
        `"${o.id}"`,
        `"${o.createdAt.toISOString()}"`,
        `"${customerName}"`,
        `"${phone}"`,
        `"${city}"`,
        `"${region}"`,
        o._count.items,
        o.subtotalGHS,
        o.deliveryFeeGHS,
        o.totalGHS,
        `"${o.status}"`,
        `"${o.paymentChannel || ""}"`,
        `"${ref}"`,
        `"${tracking}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const filenameDate = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orders-${filenameDate}.csv"`
    );

    return res.send(csvContent);
  } catch (err) {
    next(err);
  }
}

/**
 * 8. PATCH /api/admin/orders/:id/items/:itemId/serial
 * Assigns or updates Apple Serial Number & IMEI for any order item
 */
async function updateOrderItemSerial(req, res, next) {
  try {
    const { id: orderId, itemId } = req.params;
    const { serialNumber, imei } = req.body;

    const item = await prisma.orderItem.findFirst({
      where: { id: itemId, orderId }
    });

    if (!item) {
      return res.status(404).json({
        error: true,
        message: "Order item not found"
      });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        serialNumber: serialNumber !== undefined ? (serialNumber ? serialNumber.trim() : null) : undefined,
        imei: imei !== undefined ? (imei ? imei.trim() : null) : undefined
      }
    });

    // If order has an installment plan, sync the serial number and imei to the plan record as well
    if (serialNumber !== undefined || imei !== undefined) {
      await prisma.installmentPlan.updateMany({
        where: { orderId },
        data: {
          ...(serialNumber !== undefined ? { serialNumber: serialNumber ? serialNumber.trim() : null } : {}),
          ...(imei !== undefined ? { imei: imei ? imei.trim() : null } : {})
        }
      });
    }

    return res.json({
      success: true,
      message: "Device Serial Number / IMEI updated successfully",
      data: updatedItem
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderTimeline,
  getRevenueStats,
  getPendingCount,
  exportOrders,
  updateOrderItemSerial
};
