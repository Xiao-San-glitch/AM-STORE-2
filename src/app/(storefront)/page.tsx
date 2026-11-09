import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, MapPin, MessageCircle, ShoppingBasket, Sparkles, Truck } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { CategoryCard } from "@/components/home/category-card";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSettings, listCategories, listProducts } from "@/lib/db";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { defaultSettings } from "@/lib/seed-data";

export default async function HomePage() {
  const [settings, categories, bestSellers, newArrivals, featured] = await Promise.all([
    getSettings().catch(() => defaultSettings),
    listCategories().catch(() => []),
    listProducts({ bestSeller: true, perPage: 8 }).catch(() => ({ products: [] as never[], total: 0, page: 1, perPage: 8 })),
    listProducts({ sort: "newest", perPage: 8 }).catch(() => ({ products: [] as never[], total: 0, page: 1, perPage: 8 })),
    listProducts({ featured: true, perPage: 4 }).catch(() => ({ products: [] as never[], total: 0, page: 1, perPage: 4 })),
  ]);

  const whatsappUrl = buildWhatsAppContactUrl(
    settings,
    "Hello AM STORE, I would like to place a grocery order.",
  );

  const reasons = [
    {
      icon: BadgeCheck,
      title: "Quality products",
      body: "Stock checked for freshness and sealed packs, sourced from trusted suppliers.",
    },
    {
      icon: ShoppingBasket,
      title: "Everyday essentials",
      body: "Rice, dals, oils, spices, snacks and cleaning supplies — all under one roof.",
    },
    {
      icon: Truck,
      title: "Convenient shopping",
      body: "Order online and choose home delivery in Longleng or free store pickup.",
    },
    {
      icon: MapPin,
      title: "Local store in Longleng",
      body: "A neighbourhood shop you can call, message and visit — not a distant warehouse.",
    },
  ];

  return (
    <>
      <Hero settings={settings} />

      <section className="shell py-14 sm:py-16">
        <SectionHeading
          eyebrow="Shop by category"
          title="Everything for your kitchen and home"
          description="Six carefully stocked categories, with pack sizes to match the way your family shops."
          href="/categories"
          linkLabel="All categories"
        />
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white/70">
        <div className="shell py-14 sm:py-16">
          <SectionHeading
            eyebrow="Loved by the neighbourhood"
            title="Best sellers this week"
            description="The staples our customers reorder again and again."
            href="/shop?best=1"
            linkLabel="Shop best sellers"
          />
          <ProductGrid className="mt-7" products={bestSellers.products} />
        </div>
      </section>

      <section className="shell py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow">Why choose AM STORE</p>
            <h2 className="mt-2 text-2xl leading-tight sm:text-3xl lg:text-[2.125rem]">
              A grocery store that knows your street
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              We keep the shelves simple: the brands you trust, honest pack sizes and prices you can check
              before you order. Pay when your groceries arrive.
            </p>

            <div className="mt-6 rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand text-gold-deep">
                  <Clock className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Store hours</p>
                  <p className="mt-0.5 text-sm text-muted">{settings.opening_hours}</p>
                  <p className="mt-2 text-xs text-muted">
                    {settings.address}, Longleng — {settings.pin_code}
                  </p>
                </div>
              </div>
              <Link href="/contact" className="btn btn-outline btn-sm mt-4 w-full">
                Get directions &amp; contact
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {reasons.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-line bg-white p-5 transition hover:border-gold/50 hover:shadow-[var(--shadow-soft)]"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-ink text-gold">
                  <Icon className="size-[18px]" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-[#F7F2E6]">
        <div className="shell py-14 sm:py-16">
          <SectionHeading
            eyebrow="New in store"
            title="Fresh arrivals on the shelf"
            description="Recently added packs and seasonal essentials."
            href="/shop?sort=newest"
            linkLabel="See what's new"
          />
          <ProductGrid className="mt-7" products={newArrivals.products} />
        </div>
      </section>

      {featured.products.length > 0 ? (
        <section className="shell py-14 sm:py-16">
          <SectionHeading
            eyebrow="Recommended"
            title="Handpicked for the week"
            description="A short list of good-value packs worth adding to your basket."
            href="/shop"
            linkLabel="Shop all"
          />
          <ProductGrid className="mt-7" products={featured.products} />
        </section>
      ) : null}

      <section className="shell pb-16">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-ink px-6 py-10 text-white sm:px-10 sm:py-12">
          <div aria-hidden className="absolute -top-16 -right-10 size-64 rounded-full border border-gold/25" />
          <div aria-hidden className="absolute -bottom-24 right-24 size-56 rounded-full bg-gold/10 blur-2xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.24em] text-gold uppercase">
                <Sparkles className="size-3.5" /> Order help
              </p>
              <h2 className="mt-3 max-w-lg text-2xl leading-tight text-white sm:text-3xl">
                Prefer to message your list? We will pack it for you.
              </h2>
              <p className="mt-2.5 max-w-md text-sm leading-relaxed text-white/65">
                Send us your grocery list on WhatsApp and we will confirm availability, pack sizes and delivery
                timing before you pay.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                <MessageCircle className="size-4" /> Chat on WhatsApp
              </a>
              <Link href="/shop" className="btn border border-white/25 text-white hover:bg-white/10">
                Browse the shop <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
