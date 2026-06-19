import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Privileged server-only Supabase client using the service_role key.
 * BYPASSES Row Level Security — never import this into client code.
 *
 * Use ONLY for trusted server operations after the caller's permission has
 * been verified server-side: webhooks (BayarCash/WABA), cron jobs, the
 * student-OTP issue/verify flow, and admin actions that legitimately need
 * to act across rows (e.g. Parent-ID migration).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for privileged server operations.",
    );
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
