import Link from "next/link";
import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/brand/logo";
import { requireAdmin } from "@/lib/auth";
import { dbMode } from "@/lib/db";
import { signOut } from "../actions";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const mode = await dbMode().catch(() => "local" as const);

  return (
    <div className="lg:flex lg:min-h-screen">
      <aside className="bg-ink px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:px-5 lg:py-7">
        <div className="flex items-center justify-between gap-3 lg:block">
          <Logo tone="light" href="/admin" withLocation={false} />
          <div className="hidden lg:mt-6 lg:block">
            <p className="text-[0.625rem] font-semibold tracking-[0.2em] text-gold uppercase">Store admin</p>
            <p className="mt-1 truncate text-xs text-white/60">{admin.email}</p>
          </div>
        </div>

        <div className="mt-5 lg:mt-7">
          <AdminNav />
        </div>

        <form action={signOut} className="mt-5 hidden lg:block">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/65 transition hover:border-gold/50 hover:text-gold"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </form>

        <p className="mt-4 hidden text-[0.625rem] leading-relaxed text-white/30 lg:block">
          {mode === "supabase" ? "Connected to Supabase" : "Local SQLite development database"}
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
          <p className="truncate text-xs text-muted">{admin.email}</p>
          <form action={signOut}>
            <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </form>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>

        <footer className="border-t border-line px-4 py-4 text-center text-[0.6875rem] text-muted lg:text-left">
          <Link href="/" className="transition hover:text-gold-deep">
            AM STORE
          </Link>{" "}
          · Longleng, Nagaland ·{" "}
          {mode === "supabase" ? "Supabase" : "Local database"} mode
        </footer>
      </div>
    </div>
  );
}
