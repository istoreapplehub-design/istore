/**
 * Central Error Handler Middleware
 * Catches unmatched routes and normalizes application, database, and validation errors.
 * Ensures production error responses never leak stack traces.
 *
 * // Will be mounted in app.js later:
 * //   app.use(notFound)            (after routes)
 * //   app.use(errorHandler)        (last)
 */

function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let issues;

  // Handle Prisma unique constraint violation (P2002)
  if (err.code === "P2002") {
    statusCode = 409;
    const targets = Array.isArray(err.meta?.target)
      ? err.meta.target.join(", ")
      : err.meta?.target || "field";
    message = `Duplicate record: A resource with this ${targets} already exists.`;
  }

  // Handle Prisma record not found (P2025)
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  // Handle Zod validation error
  if (err.name === "ZodError" && Array.isArray(err.issues)) {
    statusCode = 400;
    message = "Validation failed";
    issues = err.issues.map((i) => ({
      field: i.path.join(".").replace(/\.(\d+)/g, "[$1]"),
      message: i.message
    }));
  }

  // Server-side logging
  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Error ${statusCode}: ${message}`
  );
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  const response = {
    error: true,
    message,
    ...(issues && { issues }),
    ...(isDev && {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    })
  };

  res.status(statusCode).json(response);
}

module.exports = {
  notFound,
  errorHandler
};
