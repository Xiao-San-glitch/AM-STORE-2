import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-ink text-gold">
        <ShoppingBag className="size-6" />
      </span>
      <p className="mt-6 text-[0.6875rem] font-semibold tracking-[0.24em] text-gold-deep uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">This shelf is empty</h1>
      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted">
        The page you are looking for has moved, sold out, or never existed. Try the shop — the essentials are all
        still there.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/shop" className="btn btn-dark">
          Browse the shop
        </Link>
        <Link href="/" className="btn btn-outline">
          <ArrowLeft className="size-4" /> Back home
        </Link>
      </div>
    </div>
  );
}
