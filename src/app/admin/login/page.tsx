import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { signIn } from "../actions";
import { getAdminSession } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Admin sign in" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;

  return (
    <div className="flex min-h-screen flex-col justify-center bg-ink px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex justify-center">
          <Logo tone="light" />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white p-6 shadow-[var(--shadow-lift)]">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gold-soft text-gold-deep">
            <Lock className="size-4" />
          </span>
          <h1 className="mt-4 text-2xl">Store sign in</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Administrator access only. Manage products, stock, orders and store settings.
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
              {message}
            </p>
          ) : null}

          <form action={signIn} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="input"
                placeholder="owner@amstore.in"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-dark w-full">
              Sign in
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/50">
          <ArrowLeft className="size-3.5" />
          <Link href="/" className="transition hover:text-gold">
            Back to the store
          </Link>
        </div>
      </div>
    </div>
  );
}
