/**
 * Zod Request Validation Middleware
 * Validates request body, query, and params against Zod schemas.
 * Replaces request objects with typed, sanitized data and standardizes 400 error formatting.
 *
 * Example Usage:
 *   router.post("/", validate({ body: createOrderSchema }), orderController.createOrder);
 *   router.get("/", validateQuery(listQuerySchema), productController.listProducts);
 */

/**
 * Formats Zod path segments into user-friendly dotted/bracket notation (e.g. items[0].qty)
 */
function formatFieldPath(path = []) {
  if (!Array.isArray(path) || path.length === 0) return "root";
  return path.join(".").replace(/\.(\d+)/g, "[$1]");
}

/**
 * Validation factory for request body, query, or params
 * @param {object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    const issues = [];

    // Validate request body
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          issues.push({
            field: formatFieldPath(issue.path),
            message: issue.message
          });
        });
      } else {
        req.body = result.data;
      }
    }

    // Validate request query parameters
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          issues.push({
            field: formatFieldPath(issue.path),
            message: issue.message
          });
        });
      } else {
        // Express 5 query object can be read-only; copy keys safely
        try {
          req.query = result.data;
        } catch {
          Object.keys(req.query).forEach((key) => delete req.query[key]);
          Object.assign(req.query, result.data);
        }
      }
    }

    // Validate route parameters
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          issues.push({
            field: formatFieldPath(issue.path),
            message: issue.message
          });
        });
      } else {
        req.params = result.data;
      }
    }

    if (issues.length > 0) {
      return res.status(400).json({
        error: true,
        message: "Validation failed",
        issues
      });
    }

    next();
  };
}

/**
 * Shorthand helper for validating query parameters on GET list endpoints
 * @param {import('zod').ZodSchema} querySchema
 */
function validateQuery(querySchema) {
  return validate({ query: querySchema });
}

module.exports = {
  validate,
  validateQuery
};
