const { z } = require("zod");
const prisma = require("../utils/prisma");
const { safeJsonParse } = require("../utils/json");
const { verifyGhanaCard } = require("../services/niaService");
const { adjustUserCreditScore, getCreditTier } = require("../utils/creditScore");
const axios = require("axios");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const isSimulationEnv =
  !PAYSTACK_SECRET ||
  PAYSTACK_SECRET.includes("placeholder") ||
  PAYSTACK_SECRET.includes("mock");

// ─── VALIDATION SCHEMAS ─────────────────────────────────────────────────────

const verifyNiaSchema = z.object({
  nationalId: z.string().trim().min(8, "Ghana Card number is required"),
  fullName: z.string().trim().min(3, "Full name is required"),
  dob: z.string().trim().optional(),
  phone: z.string().trim().optional()
});

const calculateInstallmentSchema = z.object({
  totalAmountGHS: z.number().positive("Total amount must be greater than 0"),
  frequency: z.enum(["weekly", "monthly"]),
  duration: z.number().int().positive().optional() // e.g., 4 weeks or 2 months
});

const applyInstallmentSchema = z.object({
  orderId: z.string().uuid("Valid order ID is required"),
  nationalId: z.string().trim().min(8, "Ghana Card number is required"),
  fullName: z.string().trim().min(3, "Applicant name is required"),
  phone: z.string().trim().min(9, "Phone number is required"),
  email: z.string().trim().email("Valid email required").optional(),
  frequency: z.enum(["weekly", "monthly"]),
  totalInstallments: z.number().int().min(2).max(12).optional(),
  gpsAddress: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  employer: z.string().trim().optional(),
  nextOfKinName: z.string().trim().optional(),
  nextOfKinPhone: z.string().trim().optional()
});

const approveInstallmentSchema = z.object({
  frequency: z.enum(["weekly", "monthly"]),
  totalInstallments: z.number().int().min(2).max(12),
  downPaymentPercent: z.number().min(10).max(80).optional().default(60),
  creditScore: z.number().int().min(300).max(850),
  notes: z.string().trim().max(500).optional()
});

const rejectInstallmentSchema = z.object({
  reason: z.string().trim().min(3).max(500)
});

/**
 * Helper to compute installment breakdown:
 * Exactly 60% initial down-payment, 40% balance split over frequency
 */
function computeBreakdown(totalAmountGHS, frequency = "weekly", totalInstallments, downPaymentPercent = 60.0) {
  const downPaymentGHS = Math.round((totalAmountGHS * (downPaymentPercent / 100)) * 100) / 100;
  const remainingGHS = Math.round((totalAmountGHS - downPaymentGHS) * 100) / 100;

  let installmentsCount = totalInstallments;
  if (!installmentsCount) {
    installmentsCount = frequency === "weekly" ? 4 : 2; // Default 4 weeks or 2 months
  }

  const installmentAmountGHS = Math.round((remainingGHS / installmentsCount) * 100) / 100;

  // Generate schedule of due dates
  const schedule = [];
  const now = new Date();

  for (let i = 1; i <= installmentsCount; i++) {
    const dueDate = new Date(now);
    if (frequency === "weekly") {
      dueDate.setDate(dueDate.getDate() + i * 7);
    } else {
      dueDate.setMonth(dueDate.getMonth() + i);
    }

    schedule.push({
      milestoneIndex: i,
      dueDate: dueDate.toISOString(),
      amountGHS: installmentAmountGHS,
      status: "pending"
    });
  }

  return {
    totalAmountGHS,
    downPaymentPercent,
    downPaymentGHS,
    remainingGHS,
    frequency,
    totalInstallments: installmentsCount,
    installmentAmountGHS,
    schedule
  };
}

// ─── CONTROLLERS ────────────────────────────────────────────────────────────

/**
 * POST /api/installments/verify-nia
 * Live NIA verification endpoint
 */
async function verifyNia(req, res, next) {
  try {
    const { nationalId, fullName, dob, phone } = req.body;
    const userId = req.user?.id;

    const result = await verifyGhanaCard({ nationalId, fullName, dob, phone });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Upsert or record KYC verification
    const kyc = await prisma.kycVerification.create({
      data: {
        userId: userId || null,
        nationalId: result.nationalId,
        fullName: result.fullName,
        dob: result.dob,
        gender: result.gender,
        phone: phone || null,
        provider: result.provider,
        status: "verified",
        photoUrl: result.photoUrl,
        rawResponse: result.rawResponse
      }
    });

    res.json({
      success: true,
      message: "Ghana Card verified successfully with National Identification Authority",
      data: {
        kycId: kyc.id,
        nationalId: kyc.nationalId,
        fullName: kyc.fullName,
        dob: kyc.dob,
        gender: kyc.gender,
        photoUrl: kyc.photoUrl,
        verifiedAt: kyc.verifiedAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/installments/calculate
 * Quick simulation / calculation of 60% upfront + weekly/monthly plan
 */
async function calculateInstallment(req, res, next) {
  try {
    const { totalAmountGHS, frequency, duration } = req.body;
    const breakdown = computeBreakdown(totalAmountGHS, frequency, duration);
    res.json({ success: true, data: breakdown });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/installments/apply
 * Applies for an installment plan for an order after NIA verification
 */
async function applyInstallmentPlan(req, res, next) {
  try {
    const {
      orderId,
      nationalId,
      fullName,
      phone,
      email,
      frequency,
      totalInstallments,
      gpsAddress,
      occupation,
      employer,
      nextOfKinName,
      nextOfKinPhone
    } = req.body;

    const userId = req.user?.id;

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // All installment orders are store-pickup only for now
    const ship = safeJsonParse(order.shippingAddress, {});
    const isPickupOrder =
      typeof ship.landmark === "string" && ship.landmark.startsWith("Store Pickup");
    if (!isPickupOrder) {
      return res.status(400).json({
        success: false,
        error: "Installment orders must be collected from the store. Please place the order again with Store Pickup selected."
      });
    }

    // Block re-applying while a plan is in progress; rejected/paid-out history is allowed
    const existingPlan = await prisma.installmentPlan.findUnique({
      where: { orderId },
      select: { id: true, status: true }
    });
    if (existingPlan && ["pending_review", "pending_downpayment", "active"].includes(existingPlan.status)) {
      return res.status(409).json({
        success: false,
        error:
          existingPlan.status === "pending_review"
            ? "Your application is already under review by our credit team."
            : "This order already has an approved installment plan."
      });
    }

    // Verify KYC verification exists or verify on the fly
    let kyc = await prisma.kycVerification.findFirst({
      where: { nationalId: nationalId.trim().toUpperCase(), status: "verified" },
      orderBy: { createdAt: "desc" }
    });

    if (!kyc) {
      const liveCheck = await verifyGhanaCard({ nationalId, fullName, phone });
      if (!liveCheck.success) {
        return res.status(400).json({
          success: false,
          error: "Ghana Card verification required before creating installment plan: " + liveCheck.error
        });
      }
      kyc = await prisma.kycVerification.create({
        data: {
          userId: userId || null,
          nationalId: liveCheck.nationalId,
          fullName: liveCheck.fullName,
          phone,
          provider: liveCheck.provider,
          status: "verified",
          photoUrl: liveCheck.photoUrl,
          rawResponse: liveCheck.rawResponse
        }
      });
    }

    const breakdown = computeBreakdown(order.totalGHS, frequency, totalInstallments);

    // Create plan + milestones in transaction
    const plan = await prisma.$transaction(async (tx) => {
      // Mark order as installment
      await tx.order.update({
        where: { id: orderId },
        data: { isInstallment: true }
      });

      // Clear a previously rejected application for this order before re-applying
      await tx.installmentPlan.deleteMany({
        where: { orderId, status: "rejected" }
      });

      const newPlan = await tx.installmentPlan.create({
        data: {
          orderId,
          userId: userId || order.userId || null,
          kycId: kyc.id,
          totalAmountGHS: breakdown.totalAmountGHS,
          downPaymentPercent: breakdown.downPaymentPercent,
          downPaymentGHS: breakdown.downPaymentGHS,
          remainingGHS: breakdown.remainingGHS,
          frequency: breakdown.frequency,
          totalInstallments: breakdown.totalInstallments,
          installmentAmountGHS: breakdown.installmentAmountGHS,
          applicantName: fullName,
          applicantPhone: phone,
          applicantEmail: email || null,
          ghanaCardNumber: kyc.nationalId,
          gpsAddress: gpsAddress || null,
          occupation: occupation || null,
          employer: employer || null,
          nextOfKinName: nextOfKinName || null,
          nextOfKinPhone: nextOfKinPhone || null,
          status: "pending_review"
        },
        include: {
          kyc: true
        }
      });

      return newPlan;
    });

    res.json({
      success: true,
      message: "Application submitted. Our credit team will review it and set your approved payment schedule. You will collect the device in-store once approved.",
      data: {
        ...plan,
        estimatedSchedule: breakdown.schedule
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/installments/initialize-downpayment
 * Initializes Paystack checkout specifically for the 60% down payment
 */
async function initializeDownPayment(req, res, next) {
  try {
    const { planId, email } = req.body;

    const plan = await prisma.installmentPlan.findUnique({
      where: { id: planId },
      include: { order: true }
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: "Installment plan not found" });
    }

    if (plan.status === "pending_review") {
      return res.status(400).json({ success: false, error: "Your application is still under review. The down payment can be paid once an admin approves your plan." });
    }
    if (plan.status === "rejected") {
      return res.status(400).json({ success: false, error: "This application was rejected. Please submit a new application." });
    }
    if (plan.status !== "pending_downpayment") {
      return res.status(400).json({ success: false, error: "This plan is not awaiting a down payment." });
    }

    if (plan.downPaymentPaid) {
      return res.status(400).json({ success: false, error: "Down payment has already been paid for this plan." });
    }

    const payerEmail = email || plan.applicantEmail || "customer@idynamic.com";
    const amountInPesewas = Math.round(plan.downPaymentGHS * 100);
    const reference = `INST-DOWN-${plan.id.slice(0, 8)}-${Date.now()}`;

    if (isSimulationEnv) {
      return res.json({
        success: true,
        data: {
          authorization_url: `https://checkout.paystack.com/simulate/${reference}`,
          access_code: `sim_${reference}`,
          reference,
          amountGHS: plan.downPaymentGHS,
          isSimulation: true
        }
      });
    }

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: payerEmail,
        amount: amountInPesewas,
        currency: "GHS",
        reference,
        channels: ["mobile_money", "card", "bank"],
        metadata: {
          type: "installment_downpayment",
          planId: plan.id,
          orderId: plan.orderId,
          downPaymentGHS: plan.downPaymentGHS,
          custom_fields: [
            { display_name: "Plan Type", variable_name: "plan_type", value: "60% Down Payment" },
            { display_name: "Ghana Card", variable_name: "ghana_card", value: plan.ghanaCardNumber }
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

    res.json({
      success: true,
      data: {
        authorization_url: paystackRes.data.data.authorization_url,
        access_code: paystackRes.data.data.access_code,
        reference,
        amountGHS: plan.downPaymentGHS
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/installments/verify-downpayment
 * Verifies and confirms the 60% down-payment, activating the plan and milestones
 */
async function verifyDownPayment(req, res, next) {
  try {
    const { reference, planId } = req.body;

    let isSuccess = false;
    let paymentChannel = "mobile_money";

    if (isSimulationEnv || reference.startsWith("sim_")) {
      isSuccess = true;
    } else {
      const verifyRes = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`
          }
        }
      );
      if (verifyRes.data?.data?.status === "success") {
        isSuccess = true;
        paymentChannel = verifyRes.data.data.channel || "mobile_money";
      }
    }

    if (!isSuccess) {
      return res.status(400).json({ success: false, error: "Down payment verification failed or is incomplete." });
    }

    const currentPlan = await prisma.installmentPlan.findUnique({
      where: { id: planId },
      select: { status: true }
    });
    if (!currentPlan) {
      return res.status(404).json({ success: false, error: "Installment plan not found" });
    }
    if (currentPlan.status === "pending_review") {
      return res.status(400).json({ success: false, error: "Your application is still under review. Pay the down payment once it is approved." });
    }
    if (currentPlan.status !== "pending_downpayment") {
      return res.status(400).json({ success: false, error: "This plan is not awaiting a down payment." });
    }

    const updatedPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.installmentPlan.update({
        where: { id: planId },
        data: {
          downPaymentPaid: true,
          downPaymentRef: reference,
          status: "active"
        },
        include: {
          order: true,
          milestones: { orderBy: { milestoneIndex: "asc" } }
        }
      });

      // Update parent order
      await tx.order.update({
        where: { id: plan.orderId },
        data: {
          status: "paid", // Initial order obligation cleared for delivery
          paidAt: new Date(),
          paymentReference: reference,
          paymentChannel
        }
      });

      return plan;
    });

    res.json({
      success: true,
      message: "60% Down payment received! Your installment plan is now active.",
      data: updatedPlan
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/installments/my-plans
 * Customer endpoint to list their active and past installment plans + credit rating & remaining balance
 */
async function getMyPlans(req, res, next) {
  try {
    const userId = req.user?.id;
    const phone = req.user?.phone;

    if (!userId && !phone) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    let userRecord = null;
    if (userId) {
      userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, creditScore: true, creditTier: true }
      });
    }

    const plans = await prisma.installmentPlan.findMany({
      where: {
        OR: [
          userId ? { userId } : null,
          phone ? { applicantPhone: phone } : null
        ].filter(Boolean)
      },
      include: {
        order: {
          include: { items: true }
        },
        milestones: {
          orderBy: { milestoneIndex: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const creditScore = userRecord?.creditScore ?? null;
    const creditTier = creditScore === null ? "Unrated" : userRecord?.creditTier || getCreditTier(creditScore);

    // Calculate aggregate balances
    let totalRemainingBalanceGHS = 0;
    let totalPaidSoFarGHS = 0;
    let activePlansCount = 0;
    let upcomingMilestones = [];

    for (const plan of plans) {
      if (plan.downPaymentPaid) {
        totalPaidSoFarGHS += plan.downPaymentGHS;
      }
      if (plan.status === "active") {
        activePlansCount++;
      }

      for (const m of plan.milestones || []) {
        if (m.status === "paid") {
          totalPaidSoFarGHS += m.amountGHS;
        } else if (plan.status === "active") {
          totalRemainingBalanceGHS += m.amountGHS;
          upcomingMilestones.push({
            milestoneId: m.id,
            planId: plan.id,
            deviceName: plan.order?.items?.[0]?.name || "Apple Device",
            milestoneIndex: m.milestoneIndex,
            dueDate: m.dueDate,
            amountGHS: m.amountGHS
          });
        }
      }
    }

    // Sort upcoming milestones by dueDate ascending
    upcomingMilestones.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const nextPayment = upcomingMilestones[0] || null;

    res.json({
      success: true,
      data: plans,
      creditScore,
      creditTier,
      summary: {
        creditScore,
        creditTier,
        totalRemainingBalanceGHS: Math.round(totalRemainingBalanceGHS * 100) / 100,
        totalPaidSoFarGHS: Math.round(totalPaidSoFarGHS * 100) / 100,
        activePlansCount,
        nextPayment
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/installments/plan/:id
 * Retrieve details of a specific installment plan
 */
async function getPlanDetails(req, res, next) {
  try {
    const { id } = req.params;
    const plan = await prisma.installmentPlan.findUnique({
      where: { id },
      include: {
        order: {
          include: { items: true }
        },
        milestones: {
          orderBy: { milestoneIndex: "asc" }
        },
        kyc: true
      }
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/installments/pay-milestone
 * Pay a single scheduled weekly/monthly milestone
 */
async function payMilestone(req, res, next) {
  try {
    const { milestoneId, email } = req.body;

    const milestone = await prisma.installmentMilestone.findUnique({
      where: { id: milestoneId },
      include: { plan: true }
    });

    if (!milestone) {
      return res.status(404).json({ success: false, error: "Installment milestone not found" });
    }

    if (milestone.status === "paid") {
      return res.status(400).json({ success: false, error: "This milestone is already paid." });
    }

    if (milestone.plan.status !== "active") {
      return res.status(400).json({ success: false, error: "Milestones can only be paid while the installment plan is active." });
    }

    const reference = `INST-MS-${milestone.id.slice(0, 8)}-${Date.now()}`;
    const payerEmail = email || milestone.plan.applicantEmail || "customer@idynamic.com";
    const amountInPesewas = Math.round(milestone.amountGHS * 100);

    if (isSimulationEnv) {
      return res.json({
        success: true,
        data: {
          authorization_url: `https://checkout.paystack.com/simulate/${reference}`,
          access_code: `sim_${reference}`,
          reference,
          amountGHS: milestone.amountGHS,
          isSimulation: true
        }
      });
    }

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: payerEmail,
        amount: amountInPesewas,
        currency: "GHS",
        reference,
        channels: ["mobile_money", "card", "bank"],
        metadata: {
          type: "installment_milestone",
          milestoneId: milestone.id,
          planId: milestone.planId,
          amountGHS: milestone.amountGHS
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      data: {
        authorization_url: paystackRes.data.data.authorization_url,
        access_code: paystackRes.data.data.access_code,
        reference,
        amountGHS: milestone.amountGHS
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/installments/confirm-milestone
 * Confirm payment for a scheduled milestone
 */
async function confirmMilestone(req, res, next) {
  try {
    const { milestoneId, reference } = req.body;

    const milestone = await prisma.installmentMilestone.findUnique({
      where: { id: milestoneId },
      include: { plan: { include: { milestones: true } } }
    });

    if (!milestone) {
      return res.status(404).json({ success: false, error: "Milestone not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.installmentMilestone.update({
        where: { id: milestoneId },
        data: {
          status: "paid",
          paidAt: new Date(),
          paymentReference: reference
        }
      });

      // Check if all milestones are now paid
      const remainingMilestones = await tx.installmentMilestone.count({
        where: {
          planId: milestone.planId,
          status: { not: "paid" }
        }
      });

      if (remainingMilestones === 0) {
        await tx.installmentPlan.update({
          where: { id: milestone.planId },
          data: { status: "completed" }
        });
      }
    });

    // Credit score rewards for on-time installment repayment
    if (milestone.plan.userId) {
      await adjustUserCreditScore(milestone.plan.userId, 20, `Installment milestone #${milestone.milestoneIndex} paid`);
    }

    res.json({
      success: true,
      message: "Installment payment confirmed successfully."
    });
  } catch (err) {
    next(err);
  }
}

// ─── ADMIN CONTROLLERS ──────────────────────────────────────────────────────

/**
 * PATCH /api/admin/installments/:id/serial
 * Admin endpoint to assign Apple Serial Number and IMEI to an installment plan and its device
 */
async function updateAdminInstallmentSerial(req, res, next) {
  try {
    const { id } = req.params;
    const { serialNumber, imei } = req.body;

    const plan = await prisma.installmentPlan.findUnique({
      where: { id },
      include: {
        order: {
          include: { items: true }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: "Installment plan not found" });
    }

    const updatedPlan = await prisma.installmentPlan.update({
      where: { id },
      data: {
        ...(serialNumber !== undefined ? { serialNumber: serialNumber ? serialNumber.trim() : null } : {}),
        ...(imei !== undefined ? { imei: imei ? imei.trim() : null } : {})
      }
    });

    // Also sync to order item if linked
    if (plan.order?.items?.[0]) {
      await prisma.orderItem.update({
        where: { id: plan.order.items[0].id },
        data: {
          ...(serialNumber !== undefined ? { serialNumber: serialNumber ? serialNumber.trim() : null } : {}),
          ...(imei !== undefined ? { imei: imei ? imei.trim() : null } : {})
        }
      });
    }

    res.json({
      success: true,
      message: "Serial number & IMEI saved to installment plan and order device",
      data: updatedPlan
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/installments
 * Admin endpoint to list all plans with search & filter
 */
async function getAdminInstallmentPlans(req, res, next) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { applicantName: { contains: search, mode: "insensitive" } },
        { applicantPhone: { contains: search } },
        { ghanaCardNumber: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
        { imei: { contains: search, mode: "insensitive" } }
      ];
    }

    const [total, plans, stats] = await Promise.all([
      prisma.installmentPlan.count({ where }),
      prisma.installmentPlan.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          order: {
            include: { items: true }
          },
          milestones: {
            orderBy: { milestoneIndex: "asc" }
          },
          kyc: true,
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
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.installmentPlan.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { totalAmountGHS: true, remainingGHS: true }
      })
    ]);

    res.json({
      success: true,
      data: plans,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      stats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/installments/admin/:id/approve
 * Admin reviews a pending application: sets the payment schedule, generates
 * milestones, grants the credit rating, and unlocks the down-payment step.
 */
async function approveInstallmentPlan(req, res, next) {
  try {
    const { id } = req.params;
    const { frequency, totalInstallments, downPaymentPercent, creditScore, notes } = req.body;

    const plan = await prisma.installmentPlan.findUnique({ where: { id } });
    if (!plan) {
      return res.status(404).json({ success: false, error: "Installment plan not found" });
    }
    if (plan.status !== "pending_review") {
      return res.status(400).json({ success: false, error: `Only applications pending review can be approved (current status: ${plan.status}).` });
    }

    const breakdown = computeBreakdown(plan.totalAmountGHS, frequency, totalInstallments, downPaymentPercent);

    const approved = await prisma.$transaction(async (tx) => {
      const updated = await tx.installmentPlan.update({
        where: { id },
        data: {
          downPaymentPercent: breakdown.downPaymentPercent,
          downPaymentGHS: breakdown.downPaymentGHS,
          remainingGHS: breakdown.remainingGHS,
          frequency: breakdown.frequency,
          totalInstallments: breakdown.totalInstallments,
          installmentAmountGHS: breakdown.installmentAmountGHS,
          status: "pending_downpayment",
          creditScoreAtApproval: creditScore,
          reviewNotes: notes || null,
          reviewedAt: new Date(),
          milestones: {
            create: breakdown.schedule.map((s) => ({
              milestoneIndex: s.milestoneIndex,
              dueDate: new Date(s.dueDate),
              amountGHS: s.amountGHS,
              status: "pending"
            }))
          }
        },
        include: {
          milestones: { orderBy: { milestoneIndex: "asc" } },
          order: { include: { items: true } },
          kyc: true
        }
      });

      if (plan.userId) {
        await tx.user.update({
          where: { id: plan.userId },
          data: { creditScore, creditTier: getCreditTier(creditScore) }
        });
      }

      return updated;
    });

    res.json({
      success: true,
      message: "Application approved. Payment schedule generated and credit rating granted.",
      data: approved
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/installments/admin/:id/reject
 * Admin rejects a pending application with a reason the applicant can see.
 */
async function rejectInstallmentPlan(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const plan = await prisma.installmentPlan.findUnique({ where: { id } });
    if (!plan) {
      return res.status(404).json({ success: false, error: "Installment plan not found" });
    }
    if (plan.status !== "pending_review") {
      return res.status(400).json({ success: false, error: `Only applications pending review can be rejected (current status: ${plan.status}).` });
    }

    const rejected = await prisma.$transaction(async (tx) => {
      const updated = await tx.installmentPlan.update({
        where: { id },
        data: {
          status: "rejected",
          reviewNotes: reason,
          reviewedAt: new Date()
        }
      });

      await tx.order.update({
        where: { id: plan.orderId },
        data: { isInstallment: false }
      });

      return updated;
    });

    res.json({
      success: true,
      message: "Application rejected.",
      data: rejected
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  verifyNiaSchema,
  calculateInstallmentSchema,
  applyInstallmentSchema,
  verifyNia,
  calculateInstallment,
  applyInstallmentPlan,
  initializeDownPayment,
  verifyDownPayment,
  getMyPlans,
  getPlanDetails,
  payMilestone,
  confirmMilestone,
  getAdminInstallmentPlans,
  updateAdminInstallmentSerial,
  approveInstallmentPlan,
  rejectInstallmentPlan,
  approveInstallmentSchema,
  rejectInstallmentSchema
};
