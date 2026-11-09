import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Re‑use the same secret logic as admin (falls back to a random dev secret)
function secret() {
  const value = process.env.CUSTOMER_SESSION_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    console.warn("[customer-auth] CUSTOMER_SESSION_SECRET is not set; using a random secret for this process.");
    return randomBytes(32).toString("hex");
  }
  return "am-store-customer-development-secret";
}

function cookieSecure() {
  const override = process.env.CUSTOMER_COOKIE_SECURE?.trim();
  if (override) return override !== "false";
  return process.env.NODE_ENV === "production";
}

const COOKIE_NAME = "am_customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encodeSession(session: { id: string; email: string; name: string }) {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string | undefined): { id: string; email: string; name: string } | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { id: string; email: string; name: string; exp: number };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return { id: parsed.id, email: parsed.email, name: parsed.name };
  } catch {
    return null;
  }
}

/** Get the currently signed‑in customer (if any). */
export async function getCustomerSession() {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

/** Require a signed‑in customer – otherwise redirect to the storefront login page. */
export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session) redirect("/login");
  return session;
}

/** Sign in a customer after verifying the password.
 *  Returns `{ ok: true }` on success, otherwise `{ ok: false, error: string }`.
 */
export async function signInCustomer(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) return { ok: false, error: "Enter e‑mail and password." };

  // Verify credentials against the DB layer.
  const { getCustomerAccountByEmail } = await import("@/lib/db");
  const account = await getCustomerAccountByEmail(cleanEmail);
  if (!account) return { ok: false, error: "Invalid e‑mail or password." };

  // Use the same password scheme as the rest of the app (scrypt$salt$hash)
  const { verifyPassword } = await import("@/lib/db/local/client");
  if (!verifyPassword(password, account.password_hash)) {
    return { ok: false, error: "Invalid e‑mail or password." };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession({ id: account.id, email: account.email, name: account.name }), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return { ok: true };
}

/** Sign out the current customer. */
export async function signOutCustomer() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
