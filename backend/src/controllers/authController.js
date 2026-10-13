const { z } = require("zod");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { signToken } = require("../utils/jwt");
const { safeJsonParse } = require("../utils/json");

const prisma = new PrismaClient();

function normalizePhone(phone) {
  if (!phone) return "";
  const cleaned = phone.trim().replace(/[\s-]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+233" + cleaned.slice(1);
  }
  return cleaned;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().regex(/^(\+233|0)[0-9]{9}$/, "Invalid Ghana phone number (e.g. +233240000000 or 0240000000)"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier (email or phone) is required"),
  password: z.string().min(1, "Password is required")
});

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { email: normalizedEmail }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({
        error: true,
        message: "An account with this phone number or email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        email: normalizedEmail,
        passwordHash,
        role: "customer",
        isActive: true
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    const token = signToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email
    });

    return res.status(201).json({
      token,
      user
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    const trimmedId = identifier.trim();
    const normalizedEmail = trimmedId.toLowerCase();
    const normalizedPhone = normalizePhone(trimmedId);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: trimmedId },
          { phone: normalizedPhone }
        ]
      }
    });

    if (!user || !user.passwordHash || !user.isActive) {
      return res.status(401).json({
        error: true,
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: "Invalid credentials"
      });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    };

    return res.json({
      token,
      user: safeUser
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
    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({
        error: true,
        message: "Authentication required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        addresses: true,
        createdAt: true,
        updatedAt: true
      }
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

module.exports = {
  registerSchema,
  loginSchema,
  register,
  login,
  getMe
};
