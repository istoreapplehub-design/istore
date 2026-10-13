/**
 * STUB AUTH MIDDLEWARE
 * --------------------
 * For development only. Reads the "x-user-id" header and
 * attaches it to req.userId.
 * 
 * TODO: Replace with real JWT / Supabase auth before production.
 * Every route using requireAuth() must be revisited when we
 * switch to real auth.
 */

function attachUser(req, res, next) {
  const headerUserId = req.headers["x-user-id"];
  if (headerUserId && typeof headerUserId === "string") {
    req.userId = headerUserId.trim();
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({
      error: true,
      message: "Authentication required"
    });
  }

  if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
    console.warn("[auth] STUB mode — userId:", req.userId);
  }

  next();
}

module.exports = {
  attachUser,
  requireAuth
};
