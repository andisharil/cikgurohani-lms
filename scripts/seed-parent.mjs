// Provision a portal login for an existing parent record (links an auth user
// to parents.auth_user_id). No hardcoded secrets — pass via env:
//   SEED_PARENT_EMAIL=...  SEED_PARENT_PASSWORD=...  [SEED_PARENT_LINK_EMEL=...]
//   node --env-file=.env.local scripts/seed-parent.mjs
// SEED_PARENT_LINK_EMEL defaults to SEED_PARENT_EMAIL (the parent record matched by emel).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_PARENT_EMAIL;
const password = process.env.SEED_PARENT_PASSWORD;
const linkEmel = process.env.SEED_PARENT_LINK_EMEL || email;
if (!url || !key || !email || !password) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_PARENT_EMAIL, SEED_PARENT_PASSWORD");
  process.exit(1);
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: parent } = await db.from("parents").select("id, nama").eq("emel", linkEmel).maybeSingle();
if (!parent) {
  console.error(`No parent record with emel ${linkEmel}`);
  process.exit(1);
}

async function findUserByEmail(target) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const f = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (f) return f;
    if (data.users.length < 200) break;
  }
  return null;
}

let userId;
const { data: created, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  const existing = await findUserByEmail(email);
  if (!existing) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }
  userId = existing.id;
  await db.auth.admin.updateUserById(userId, { password });
} else {
  userId = created.user.id;
}

const { error: linkErr } = await db.from("parents").update({ auth_user_id: userId }).eq("id", parent.id);
if (linkErr) {
  console.error("Failed to link parent:", linkErr.message);
  process.exit(1);
}
console.log(`Parent login ready: ${email} -> ${parent.nama}`);
