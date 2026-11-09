import Link from "next/link";
import { ArrowRight, Truck, Store, ShieldCheck } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function Hero({ settings }: { settings: StoreSettings }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-warm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-[26rem] rounded-full border border-gold/25 sm:size-[34rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-[18rem] rounded-full bg-gold/10 blur-2xl sm:size-[24rem]"
      />

      <div className="shell relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
        <div className="animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gold" />
            <p className="text-[0.6875rem] font-semibold tracking-[0.24em] text-gold-deep uppercase">
              Longleng · Nagaland 789625
            </p>
          </div>

          <h1 className="mt-5 max-w-xl text-[2.5rem] leading-[1.05] font-medium sm:text-[3.25rem] lg:text-[3.75rem]">
            {settings.hero_heading}
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal/70 sm:text-[1.0625rem]">
            {settings.hero_subheading}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-gold sm:px-7">
              Shop now
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/categories" className="btn btn-outline sm:px-7">
              Explore categories
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-line pt-6">
            <div>
              <dt className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-muted uppercase">
                <Truck className="size-3.5 text-gold-deep" /> Delivery
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">
                Free over {formatINR(settings.free_delivery_threshold)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-muted uppercase">
                <Store className="size-3.5 text-gold-deep" /> Pickup
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">Ready in 2 hours</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-muted uppercase">
                <ShieldCheck className="size-3.5 text-gold-deep" /> Payment
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">Cash on delivery</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-[#F1E9D8] shadow-[var(--shadow-lift)]">
            <img
              src={settings.hero_image || "/products/hero-groceries.jpg"}
              alt="Rice, cooking oil, spices and household essentials available at AM STORE"
              className="aspect-[5/4] w-full object-cover sm:aspect-[6/5]"
              fetchPriority="high"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
            <p className="absolute bottom-4 left-4 text-[0.625rem] font-semibold tracking-[0.22em] text-white uppercase">
              Fresh stock · Everyday essentials
            </p>
          </div>

          <div className="absolute -bottom-5 -left-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[var(--shadow-soft)] sm:-left-6">
            <p className="text-[0.5625rem] font-semibold tracking-[0.18em] text-muted uppercase">Opening hours</p>
            <p className="mt-1 text-xs font-medium text-ink">{settings.opening_hours}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
