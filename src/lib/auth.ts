import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./db";
import { verifyAdmin } from "./db";
import { createSupabaseServerClient } from "./supabase/server";

const COOKIE_NAME = "am_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type AdminSession = { email: string; role: string };

let fallbackSecret: string | null = null;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    // Never reuse a public constant in production: fall back to a random secret
    // so sessions are still signed, but warn because admins are signed out on restart.
    if (!fallbackSecret) {
      fallbackSecret = randomBytes(32).toString("hex");
      console.warn("[auth] ADMIN_SESSION_SECRET is not set; using a random secret for this process.");
    }
    return fallbackSecret;
  }
  return "am-store-development-session-secret";
}

/**
 * Admin cookies are HTTPS-only in production. Set ADMIN_COOKIE_SECURE=false
 * only when deliberately testing a production build over plain HTTP.
 */
function cookieSecure() {
  const override = process.env.ADMIN_COOKIE_SECURE?.trim();
  if (override) return override !== "false";
  return process.env.NODE_ENV === "production";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encodeSession(session: AdminSession) {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + MAX_AGE_SECONDS * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string | undefined): AdminSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession & { exp: number };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return { email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .ilike("email", user.email)
      .maybeSingle();
    if (!admin) return null;
    return { email: user.email, role: (admin as { role: string }).role };
  }

  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Throws instead of redirecting — used inside server actions. */
export async function assertAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("You must be signed in as an administrator.");
  return session;
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) return { ok: false, error: "Enter your email and password." };

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user?.email) {
      return { ok: false, error: "Invalid email or password." };
    }
    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .ilike("email", data.user.email)
      .maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      return { ok: false, error: "This account does not have administrator access." };
    }
    return { ok: true };
  }

  const admin = await verifyAdmin(cleanEmail, password);
  if (!admin) return { ok: false, error: "Invalid email or password." };

  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(admin), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return { ok: true };
}

export async function signOutAdmin() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
