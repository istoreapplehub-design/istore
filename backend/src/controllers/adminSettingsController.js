const { z } = require("zod");
const prisma = require("../utils/prisma");

const resetSchema = z.object({
  confirm: z.literal("DELETE_ALL_DATA", {
    errorMap: () => ({ message: "Must provide confirmation string 'DELETE_ALL_DATA'" })
  })
});

/**
 * DELETE /api/admin/settings/demo-orders
 * Wipes all orders with paymentReference starting with 'gha_demo_'
 */
async function wipeDemoOrders(req, res, next) {
  try {
    const demoOrders = await prisma.order.findMany({
      where: {
        paymentReference: {
          startsWith: "gha_demo_"
        }
      },
      select: { id: true }
    });

    const demoOrderIds = demoOrders.map((o) => o.id);

    if (demoOrderIds.length === 0) {
      return res.json({
        deletedCount: 0,
        message: "No demo orders found to wipe."
      });
    }

    const [deletedItems, deletedOrders] = await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: { orderId: { in: demoOrderIds } }
      }),
      prisma.order.deleteMany({
        where: { id: { in: demoOrderIds } }
      })
    ]);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[admin] ${req.user?.email || "Admin"} wiped ${deletedOrders.count} demo orders`
      );
    }

    return res.json({
      deletedCount: deletedOrders.count,
      deletedItemsCount: deletedItems.count,
      message: `Successfully wiped ${deletedOrders.count} demo orders.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/reset
 * Body: { confirm: "DELETE_ALL_DATA" }
 * Wipes all orders, items, and reviews. Keeps products & users.
 */
async function resetAllData(req, res, next) {
  try {
    const [deletedItems, deletedOrders, deletedReviews] = await prisma.$transaction([
      prisma.orderItem.deleteMany({}),
      prisma.order.deleteMany({}),
      prisma.review.deleteMany({})
    ]);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[admin] ${req.user?.email || "Admin"} executed full data reset: ${deletedOrders.count} orders, ${deletedItems.count} items, ${deletedReviews.count} reviews wiped.`
      );
    }

    return res.json({
      success: true,
      ordersDeleted: deletedOrders.count,
      itemsDeleted: deletedItems.count,
      reviewsDeleted: deletedReviews.count,
      message: "All transactional data reset successfully. Products and user accounts preserved."
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  resetSchema,
  wipeDemoOrders,
  resetAllData
};
