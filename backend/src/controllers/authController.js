const { z } = require("zod");
const prisma = require("../utils/prisma");
const { supabaseAdmin } = require("../utils/supabase");
const { safeJsonParse } = require("../utils/json");

const provisionSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().min(9, "Valid phone number is required"),
  email: z.string().trim().email("Valid email address is required")
});

const upgradeRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "customer"], {
    errorMap: () => ({ message: "Role must be 'admin' or 'customer'" })
  })
});

/**
 * POST /api/auth/provision
 * Provisions a Prisma User record for a Supabase-authenticated user
 */
async function provisionUser(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: true,
        message: "Authentication required"
      });
    }

    const token = header.slice(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: true,
        message: "Invalid or expired token"
      });
    }

    const supabaseId = data.user.id;
    const { name, phone, email } = req.body;
    const normalizedEmail = (email || data.user.email || "").toLowerCase().trim();

    // Idempotent check: User already linked by supabaseId
    let user = await prisma.user.findUnique({
      where: { supabaseId }
    });

    if (user) {
      return res.status(200).json({
        user: {
          ...user,
          addresses: safeJsonParse(user.addresses, [])
        }
      });
    }

    // Check if an existing user has the same email or phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: phone.trim() }
        ]
      }
    });

    if (existing) {
      // Link supabaseId to existing record
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          supabaseId,
          name: existing.name || name,
          email: existing.email || normalizedEmail
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          supabaseId,
          name,
          phone: phone.trim(),
          email: normalizedEmail,
          role: "customer",
          isActive: true
        }
      });
    }

    return res.status(201).json({
      user: {
        ...user,
        addresses: safeJsonParse(user.addresses, [])
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me (requireAuth)
 */
async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    return res.json({
      user: {
        ...user,
        addresses: safeJsonParse(user.addresses, [])
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/role/upgrade (requireAuth, requireAdmin)
 */
async function upgradeRole(req, res, next) {
  try {
    const { userId, role } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({
        error: true,
        message: "Target user not found"
      });
    }

    // Safety check: Cannot demote the last remaining admin
    if (targetUser.role === "admin" && role === "customer") {
      const adminCount = await prisma.user.count({
        where: { role: "admin", isActive: true }
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          error: true,
          message: "Cannot demote the last remaining admin"
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        supabaseId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  provisionSchema,
  upgradeRoleSchema,
  provisionUser,
  getMe,
  upgradeRole
};
