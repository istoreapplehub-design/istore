const { PrismaClient } = require("@prisma/client");

// Supabase's session-mode pooler caps each connection string at 15 clients.
// Without an explicit cap Prisma opens a pool per concurrent query and the
// database rejects the rest, surfacing as 500s on parallel dashboard calls.
function pooledUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || /[?&]connection_limit=/i.test(url)) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=${process.env.PRISMA_CONNECTION_LIMIT || 5}&pool_timeout=30`;
}

const prisma = new PrismaClient({ datasources: { db: { url: pooledUrl() } } });

module.exports = prisma;
