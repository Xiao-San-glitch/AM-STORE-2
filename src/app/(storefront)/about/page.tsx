import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, HeartHandshake, MapPin, Truck } from "lucide-react";
import { getSettings } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";

export const metadata: Metadata = {
  title: "About the store",
  description:
    "AM STORE is a family-run grocery store in Longleng, Nagaland, offering rice, dal, oils, spices, snacks and household essentials with local delivery.",
};

const VALUES = [
  {
    icon: BadgeCheck,
    title: "Checked stock",
    body: "Every pack is inspected for seals, weight and expiry before it goes on the shelf or into your order.",
  },
  {
    icon: HeartHandshake,
    title: "Neighbourhood service",
    body: "We are a local store, not a marketplace. The person packing your bag is the person you can call.",
  },
  {
    icon: Truck,
    title: "Simple delivery",
    body: "Order online or on WhatsApp, pay cash when it arrives, and we will deliver across Longleng town.",
  },
];

export default async function AboutPage() {
  const settings = await getSettings().catch(() => defaultSettings);

  return (
    <div>
      <section className="border-b border-line bg-sand/50">
        <div className="shell py-12 sm:py-16">
          <p className="eyebrow">Our story</p>
          <h1 className="mt-2 max-w-2xl text-3xl leading-tight sm:text-4xl">
            A neighbourhood grocery store, built for Longleng households.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-charcoal/75 sm:text-base">
            {settings.store_name} opened its shutters to make everyday shopping simpler: the same trusted brands,
            honest weights, and a shelf that is actually stocked when you need it. Today you can shop the same aisles
            online — with cash on delivery or pickup at the counter.
          </p>
        </div>
      </section>

      <section className="shell grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-2xl sm:text-3xl">What we keep on the shelf</h2>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/75">
            Our range is deliberately practical. Staples first — rice, dal and pulses, cooking oils — then the spices
            and masalas that make a meal taste like home, snacks for the shop counter or the classroom, and the
            household basics that always seem to run out: detergent, dishwash, soap, cleaner and tissue.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/75">
            Pack sizes are chosen for real households, from a single 1 kg pouch to a 25 kg rice bag. If you cannot find
            something, ask us — we restock weekly and can often source it.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-2xl border border-line bg-white p-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-gold-deep">
                  <value.icon className="size-4" />
                </span>
                <h3 className="mt-3 text-base">{value.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{value.body}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg">Visit the store</h2>
            <p className="mt-3 flex gap-2.5 text-sm text-charcoal/80">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" />
              <span>
                {settings.address}
                <br />
                Longleng, Nagaland — {settings.pin_code}
              </span>
            </p>
            <p className="mt-2.5 text-xs text-muted">{settings.opening_hours}</p>
            <Link href="/contact" className="btn btn-dark mt-4 w-full">
              Get in touch
            </Link>
            <Link href="/shop" className="btn btn-outline mt-2 w-full">
              Shop the aisles
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
