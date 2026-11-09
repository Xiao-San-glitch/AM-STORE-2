import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { customerSignIn } from "../account/actions";

export const metadata: Metadata = {
  title: "Sign In – AM STORE",
  description: "Access your AM STORE account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <section className="shell flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        {error && (
          <p
            role="alert"
            className="flex items-center gap-2 bg-rose-50 text-rose-800 p-3 rounded mb-4"
          >
            <AlertCircle className="size-4 shrink-0" />
            {decodeURIComponent(error)}
          </p>
        )}
        <form action={customerSignIn} className="grid gap-4">
          <label className="label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            className="input"
            placeholder="you@example.com"
          />
          <label className="label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            className="input"
            placeholder="••••••••"
          />
          <button type="submit" className="btn btn-dark w-full mt-4">
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="text-gold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
