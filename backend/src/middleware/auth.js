const { supabaseAdmin } = require("../utils/supabase");
const prisma = require("../utils/prisma");

/**
 * Extracts a Supabase access token from the request.
 * Accepts an "Authorization: Bearer <token>" header first, then a ?token= query fallback.
 * @returns {string|null} the raw token, or null when the caller presents no credentials
 */
function extractToken(req) {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

/**
 * Shared token-resolution pipeline used by both requireAuth and optionalAuth.
 * Never sends responses itself — the caller decides how an anonymous or invalid
 * caller should be handled.
 *
 * @returns {Promise<{anonymous: true}|{status: number, message: string}|{user: object}>}
 */
async function resolveCaller(req) {
  const token = extractToken(req);

  if (!token) {
    return { anonymous: true };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return { status: 401, message: "Invalid or expired token" };
  }

  let user = await prisma.user.findUnique({
    where: { supabaseId: data.user.id }
  });

  if (!user) {
    const emailNorm = (data.user.email || "").toLowerCase().trim();
    const phoneNorm = (data.user.user_metadata?.phone || "").trim();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(emailNorm ? [{ email: emailNorm }] : []),
          ...(phoneNorm ? [{ phone: phoneNorm }] : [])
        ]
      }
    });

    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          supabaseId: data.user.id,
          name: existing.name || data.user.user_metadata?.name || "Customer",
          email: existing.email || emailNorm
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          supabaseId: data.user.id,
          name: data.user.user_metadata?.name || emailNorm.split("@")[0] || "Customer",
          phone: phoneNorm || "0242826590",
          email: emailNorm || null,
          role: emailNorm.includes("admin") ? "admin" : "customer",
          isActive: true
        }
      });
    }
  }

  if (!user.isActive) {
    return { status: 403, message: "Account disabled" };
  }

  return {
    user: {
      id: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
      supabaseId: user.supabaseId
    }
  };
}

async function requireAuth(req, res, next) {
  try {
    const result = await resolveCaller(req);

    if (result.anonymous) {
      return res.status(401).json({
        error: true,
        message: "Authentication required"
      });
    }

    if (result.status) {
      return res.status(result.status).json({
        error: true,
        message: result.message
      });
    }

    req.user = result.user;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication for guest-capable endpoints.
 * - No credentials at all → proceeds as a guest with req.user left undefined.
 * - A token IS presented → validated exactly like requireAuth; an invalid,
 *   expired, unprovisioned, or disabled caller gets the same 401/403 response
 *   instead of being silently downgraded to a guest.
 */
async function optionalAuth(req, res, next) {
  try {
    const result = await resolveCaller(req);

    if (result.anonymous) {
      return next();
    }

    if (result.status) {
      return res.status(result.status).json({
        error: true,
        message: result.message
      });
    }

    req.user = result.user;

    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: "Authentication required",
    });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: true,
      message: "Admin access required",
    });
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`[admin] ${req.user.email} → ${req.method} ${req.originalUrl}`);
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
