/**
 * Safe JSON helpers for SQLite string-storage fields
 */

function safeJsonParse(val, fallback = null) {
  if (!val) return fallback;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function safeJsonStringify(val, fallback = "") {
  if (val === undefined || val === null) return fallback;
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return fallback;
  }
}

/**
 * Transforms a raw Prisma Product record into a client-ready object
 */
function formatProduct(product) {
  if (!product) return null;
  return {
    ...product,
    colors: safeJsonParse(product.colors, []),
    specs: safeJsonParse(product.specs, {}),
    tags: product.tags ? product.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    images: product.images ? product.images.map((img) => (typeof img === "string" ? img : img.url)) : []
  };
}

/**
 * Transforms a raw Prisma Order record into a client-ready object
 */
function formatOrder(order) {
  if (!order) return null;
  return {
    ...order,
    shippingAddress: safeJsonParse(order.shippingAddress, {})
  };
}

module.exports = {
  safeJsonParse,
  safeJsonStringify,
  formatProduct,
  formatOrder
};
