const crypto = require("crypto");
const axios = require("axios");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");
const { formatOrder } = require("../utils/json");

const prisma = new PrismaClient();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const isSimulationEnv =
  !PAYSTACK_SECRET ||
  PAYSTACK_SECRET.includes("placeholder") ||
  PAYSTACK_SECRET.includes("mock");

if (isSimulationEnv) {
  console.warn(
    "[paystack] PAYSTACK_SECRET_KEY not set or contains placeholder — simulation mode active"
  );
}

const PAYSTACK_BASE = "https://api.paystack.co";

const initializePaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required")
});

/**
 * Shared idempotent helper to finalize payment, mark order paid, and decrement stock
 */
async function applyPaymentSuccess(reference, channel) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { paymentReference: reference },
      include: { items: true }
    });

    if (!order) {
      return null;
    }

    // Idempotent guard: if already marked paid, return without double-decrementing stock
    if (order.status === "paid") {
      return order;
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        paymentChannel: channel || "mobile_money"
      },
      include: { items: true }
    });

    // Decrement stock for each item in the order
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.qty
          }
        }
      });
    }

    return updatedOrder;
  });
}

/**
 * Initializes a Paystack transaction for the total amount of a pending order
 */
async function initializePayment(req, res, next) {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      return next(err);
    }

    if (order.userId && order.userId !== userId) {
      const err = new Error("Forbidden: You cannot pay for an order belonging to another user");
      err.status = 403;
      return next(err);
    }

    if (order.status !== "pending") {
      const err = new Error("Order is not payable in its current state");
      err.status = 400;
      return next(err);
    }

    const amount = Math.round(order.totalGHS * 100); // Pesewas (integer)
    const reference = `gha_${order.id}_${Date.now()}`;

    // ─── SIMULATION MODE ───────────────────────────────────────────────────
    if (isSimulationEnv) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentReference: reference }
      });

      const apiUrl = process.env.API_URL || "http://localhost:5001";
      return res.json({
        simulation: true,
        reference,
        authorization_url: `${apiUrl}/api/paystack/simulate/${reference}`,
        access_code: `sim_${reference}`,
        amount
      });
    }

    // ─── REAL PAYSTACK API ────────────────────────────────────────────────
    try {
      const paystackRes = await axios.post(
        `${PAYSTACK_BASE}/transaction/initialize`,
        {
          email: req.user?.email || `order-${order.id}@istore.com.gh`,
          amount,
          currency: "GHS",
          reference,
          channels: ["mobile_money", "card", "bank"],
          metadata: {
            orderId: order.id,
            userId,
            custom_fields: [
              {
                display_name: "Order ID",
                variable_name: "order_id",
                value: order.id
              }
            ]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = paystackRes.data?.data;
      if (!data) {
        const err = new Error("Paystack initialization returned empty response");
        err.status = 502;
        return next(err);
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentReference: reference }
      });

      return res.json({
        simulation: false,
        reference,
        authorization_url: data.authorization_url,
        access_code: data.access_code,
        amount
      });
    } catch (apiErr) {
      const errorMsg =
        apiErr.response?.data?.message || "Failed to initialize transaction with Paystack";
      const err = new Error(errorMsg);
      err.status = apiErr.response?.status || 502;
      return next(err);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Verifies transaction payment reference and marks the order paid on confirmation
 */
async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.params;

    const existingOrder = await prisma.order.findUnique({
      where: { paymentReference: reference },
      include: { items: true }
    });

    if (!existingOrder) {
      const err = new Error("Order with this payment reference was not found");
      err.status = 404;
      return next(err);
    }

    const isSimulatedRef = reference.startsWith("sim_") || isSimulationEnv;

    // ─── SIMULATION MODE ───────────────────────────────────────────────────
    if (isSimulatedRef) {
      const paidOrder = await applyPaymentSuccess(reference, "mobile_money");
      return res.json({
        success: true,
        order: formatOrder(paidOrder)
      });
    }

    // ─── REAL PAYSTACK VERIFICATION ─────────────────────────────────────────
    try {
      const verifyRes = await axios.get(
        `${PAYSTACK_BASE}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`
          }
        }
      );

      const paystackData = verifyRes.data?.data;
      if (paystackData?.status === "success") {
        const paidOrder = await applyPaymentSuccess(
          reference,
          paystackData.channel || "card"
        );
        return res.json({
          success: true,
          order: formatOrder(paidOrder),
          paystackData
        });
      }

      return res.json({
        success: false,
        order: formatOrder(existingOrder),
        paystackData
      });
    } catch (apiErr) {
      const errorMsg =
        apiErr.response?.data?.message || "Paystack verification request failed";
      const err = new Error(errorMsg);
      err.status = apiErr.response?.status || 502;
      return next(err);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Listens for Paystack server webhooks, verifies HMAC signature via rawBody, and processes charge.success
 */
async function handleWebhook(req, res) {
  try {
    if (isSimulationEnv) {
      return res.status(200).json({ received: true, simulation: true });
    }

    const signature = req.headers["x-paystack-signature"];
    const rawBody = req.rawBody || req.body;

    if (!rawBody) {
      return res.status(400).json({
        error: true,
        message: "Missing webhook payload"
      });
    }

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).json({
        error: true,
        message: "Invalid signature"
      });
    }

    let event;
    try {
      event = typeof rawBody === "string" ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
    } catch {
      return res.status(400).json({
        error: true,
        message: "Invalid JSON payload"
      });
    }

    if (event?.event === "charge.success") {
      const reference = event.data?.reference;
      const channel = event.data?.channel;

      if (reference) {
        await applyPaymentSuccess(reference, channel);
      }
    }

    return res.status(200).json({ received: true });
  } catch {
    // Paystack requires 200 to prevent continuous webhook retry floods
    return res.status(200).json({ received: true });
  }
}

module.exports = {
  initializePayment,
  verifyPayment,
  handleWebhook,
  initializePaymentSchema
};
