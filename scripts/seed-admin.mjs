// Creates (or updates) the owner admin account.
// Run after setting SUPABASE_SERVICE_ROLE_KEY in .env.local:
//   node --env-file=.env.local scripts/seed-admin.mjs
// Optional overrides: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = process.env.SEED_ADMIN_EMAIL || "admin@cikgurohani.com";
// No hardcoded default — pass SEED_ADMIN_PASSWORD so a real password is never
// committed (this repo is public).
const password = process.env.SEED_ADMIN_PASSWORD;
if (!password) {
  console.error("Set SEED_ADMIN_PASSWORD (and optionally SEED_ADMIN_EMAIL) before running.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserByEmail(targetEmail) {
  // Paginate through users to find an existing match.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

let userId;
const { data: created, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) {
  const existing = await findUserByEmail(email);
  if (!existing) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }
  userId = existing.id;
  await admin.auth.admin.updateUserById(userId, { password });
  console.log("User already existed — password reset.");
} else {
  userId = created.user.id;
}

const { error: upsertErr } = await admin.from("admin_users").upsert({
  id: userId,
  nama: "Pemilik",
  emel: email,
  role: "Pemilik",
  active: true,
});
if (upsertErr) {
  console.error("Failed to upsert admin_users:", upsertErr.message);
  process.exit(1);
}

console.log(`✅ Admin ready.\n   Email:    ${email}\n   Password: ${password}\n   Role:     Pemilik`);
