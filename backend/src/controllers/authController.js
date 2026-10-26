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

    // Safety check: Cannot demote yourself or the last remaining admin
    if (targetUser.role === "admin" && role === "customer") {
      if (req.user && req.user.id === targetUser.id) {
        return res.status(400).json({
          error: true,
          message: "You cannot demote yourself"
        });
      }

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

/**
 * GET /api/auth/admins (requireAuth, requireAdmin)
 */
async function listAdmins(req, res, next) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    });

    return res.json({ data: admins });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/users (requireAuth, requireAdmin)
 */
async function listAllUsers(req, res, next) {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (role && role !== "all") {
      where.role = role;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" }
      })
    ]);

    return res.json({
      data: users,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: skip + users.length < total
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/register
 * Direct registration endpoint: creates user in Supabase with email_confirm: true and provisions in Prisma.
 */
async function registerUser(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        error: true,
        message: "Name, phone, email, and password are all required."
      });
    }

    const emailNorm = email.toLowerCase().trim();
    const phoneNorm = phone.trim();

    let supabaseUserId = null;
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNorm,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), phone: phoneNorm }
    });

    if (createError) {
      if (createError.message?.toLowerCase().includes("already registered") || createError.message?.toLowerCase().includes("already exists")) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuth = listData?.users?.find((u) => u.email?.toLowerCase() === emailNorm);
        if (existingAuth) {
          supabaseUserId = existingAuth.id;
          await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
            password,
            email_confirm: true,
            user_metadata: { name: name.trim(), phone: phoneNorm }
          });
        } else {
          return res.status(400).json({ error: true, message: createError.message });
        }
      } else {
        return res.status(400).json({ error: true, message: createError.message });
      }
    } else {
      supabaseUserId = createData.user.id;
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(supabaseUserId ? [{ supabaseId: supabaseUserId }] : []),
          { email: emailNorm },
          { phone: phoneNorm }
        ]
      }
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          supabaseId: supabaseUserId || user.supabaseId,
          name: name.trim(),
          phone: phoneNorm,
          email: emailNorm
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseUserId,
          name: name.trim(),
          phone: phoneNorm,
          email: emailNorm,
          role: emailNorm.includes("admin") ? "admin" : "customer",
          isActive: true
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account registered successfully",
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
 * POST /api/auth/confirm-user
 * Auto-confirms a Supabase user by email so they can log in immediately
 */
async function confirmUser(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: true, message: "Email required" });
    }
    const emailNorm = email.toLowerCase().trim();
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email?.toLowerCase() === emailNorm);
    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        email_confirm: true
      });
      return res.json({ success: true, message: "Email confirmed" });
    }
    return res.status(404).json({ error: true, message: "User not found" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  provisionSchema,
  upgradeRoleSchema,
  provisionUser,
  getMe,
  upgradeRole,
  listAdmins,
  listAllUsers,
  registerUser,
  confirmUser
};
