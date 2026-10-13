/**
 * Parses and sanitizes query parameters for pagination
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1) {
    limit = 20;
  } else if (limit > 50) {
    limit = 50; // enforce max limit
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

module.exports = {
  parsePagination
};
