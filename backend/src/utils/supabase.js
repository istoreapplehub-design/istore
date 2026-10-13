const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required in .env");
}
if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in .env");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { supabaseAdmin };
