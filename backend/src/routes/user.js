const express = require("express");
const { z } = require("zod");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");
const { safeJsonParse } = require("../utils/json");

const router = express.Router();

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta",
  "Northern", "Upper East", "Upper West", "Bono", "Ahafo", "Bono East",
  "Oti", "Savannah", "North East", "Western North"
];

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+233|0)[0-9]{9}$/, "Invalid Ghanaian phone number"),
  region: z.enum(GHANA_REGIONS),
  city: z.string().trim().min(2).max(60),
  gpsAddress: z.string().trim().max(120).optional(),
  landmark: z.string().trim().max(200).optional(),
  isDefault: z.boolean().optional()
});

// GET /api/user/me - current profile incl. parsed addresses & wishlist ids
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { wishlist: { select: { productId: true } } }
    });

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        addresses: safeJsonParse(user.addresses, []),
        wishlistProductIds: user.wishlist.map((w) => w.productId)
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/addresses - replace saved address book (max 8 entries)
router.put("/addresses", requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ addresses: z.array(addressSchema).max(8) }).parse(req.body);

    const seenDefault = body.addresses.some((a) => a.isDefault);
    const normalized = body.addresses.map((a, idx) => ({
      ...a,
      isDefault: seenDefault ? !!a.isDefault : idx === 0
    }));

    if (normalized.length > 0 && !normalized.some((a) => a.isDefault)) {
      normalized[0].isDefault = true;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { addresses: JSON.stringify(normalized) }
    });

    res.json({ addresses: safeJsonParse(updated.addresses, []) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: err.errors[0]?.message || "Invalid address data" });
    }
    next(err);
  }
});

// GET /api/user/wishlist - saved product ids
router.get("/wishlist", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      select: { productId: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ productIds: items.map((i) => i.productId) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/wishlist - bulk sync the saved list
router.put("/wishlist", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({ productIds: z.array(z.string().uuid()).max(200) })
      .parse(req.body);

    const validProducts = await prisma.product.findMany({
      where: { id: { in: body.productIds }, isActive: true },
      select: { id: true }
    });
    const validIds = validProducts.map((p) => p.id);

    await prisma.wishlistItem.deleteMany({ where: { userId: req.user.id } });
    if (validIds.length > 0) {
      await prisma.wishlistItem.createMany({
        data: validIds.map((productId) => ({ userId: req.user.id, productId })),
        skipDuplicates: true
      });
    }

    res.json({ productIds: validIds });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: "Invalid wishlist payload" });
    }
    next(err);
  }
});

module.exports = router;
