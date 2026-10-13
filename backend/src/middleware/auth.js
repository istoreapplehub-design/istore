const { verifyToken } = require("../utils/jwt");

/**
 * attachUser (DEPRECATED - keep for backward dev compatibility only)
 * Reads x-user-id header if present. Remove before production.
 */
function attachUser(req, res, next) {
  const headerUserId = req.headers["x-user-id"];
  if (headerUserId && typeof headerUserId === "string") {
    req.userId = headerUserId.trim();
  }
  next();
}

/**
 * requireAuth middleware
 * Expects Authorization: Bearer <token>
 * Verifies JWT and attaches req.user = { id, role, phone, email }
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // If x-user-id is present in development mode, allow fallback for backward compatibility
    if (process.env.NODE_ENV === "development" && req.userId) {
      req.user = { id: req.userId, role: "customer", phone: "", email: null };
      return next();
    }
    return res.status(401).json({
      error: true,
      message: "Authentication required. Please provide a valid Bearer token."
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role || "customer",
      phone: decoded.phone,
      email: decoded.email
    };
    // Keep req.userId for backward compatibility
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      message: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
    });
  }
}

/**
 * requireAdmin middleware
 * Requires authenticated user with role === "admin"
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: true,
      message: "Admin access required"
    });
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(`[admin] Action authorized for admin: ${req.user.email || req.user.id} (${req.method} ${req.originalUrl})`);
  }

  next();
}

module.exports = {
  attachUser,
  requireAuth,
  requireAdmin
};
