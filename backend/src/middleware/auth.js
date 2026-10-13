const { supabaseAdmin } = require("../utils/supabase");
const prisma = require("../utils/prisma");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: true,
        message: "Authentication required",
      });
    }

    const token = header.slice(7);

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: true,
        message: "Invalid or expired token",
      });
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
    });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "User not provisioned in this system",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: true,
        message: "Account disabled",
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
      supabaseId: user.supabaseId,
    };

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

module.exports = { requireAuth, requireAdmin };
