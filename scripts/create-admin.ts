/**
 * Creates a Supabase Auth admin and adds them to the `admins` allow-list.
 *
 * Usage:
 *   ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='strong-password' \
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run create-admin
 *
 * Requires `supabase/schema.sql` to have been applied first.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

if (existsSync(resolve(process.cwd(), ".env.local"))) {
  process.loadEnvFile(resolve(process.cwd(), ".env.local"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Choose a password of at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  // Reuse the account if it already exists.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = created?.user?.id;

  if (createError) {
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listError) throw new Error(listError.message);
    const existing = list.users.find((user) => user.email?.toLowerCase() === email);
    if (!existing) throw new Error(createError.message);
    userId = existing.id;

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
    if (updateError) throw new Error(updateError.message);
  }

  const { error } = await supabase
    .from("admins")
    .upsert({ user_id: userId, email, role: "admin" }, { onConflict: "email" });

  if (error) throw new Error(error.message);
  console.log(`Admin ready: ${email}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
