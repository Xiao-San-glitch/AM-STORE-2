import Link from "next/link";
import { Instagram, Facebook, MessageCircle, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Category, StoreSettings } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const year = new Date().getFullYear();
  const socials = [
    { href: settings.social_instagram, Icon: Instagram, label: "Instagram" },
    { href: settings.social_facebook, Icon: Facebook, label: "Facebook" },
    {
      href: settings.social_whatsapp ? `https://wa.me/${settings.social_whatsapp.replace(/\D/g, "")}` : null,
      Icon: MessageCircle,
      label: "WhatsApp",
    },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="mt-20 bg-ink text-white/70">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <Logo logoUrl={settings.logo_url} tone="light" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
            A neighbourhood grocery store serving Longleng with rice, dals, oils, spices, snacks and household
            essentials — delivered to your door or ready for pickup.
          </p>
          {socials.length > 0 ? (
            <div className="mt-5 flex items-center gap-2">
              {socials.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-gold hover:text-gold"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="text-[0.6875rem] font-semibold tracking-[0.22em] text-gold uppercase">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/shop" className="transition hover:text-gold">
                All products
              </Link>
            </li>
            {categories.slice(0, 5).map((category) => (
              <li key={category.id}>
                <Link href={`/category/${category.slug}`} className="transition hover:text-gold">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/categories" className="transition hover:text-gold">
                Browse all categories
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[0.6875rem] font-semibold tracking-[0.22em] text-gold uppercase">Store</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/about" className="transition hover:text-gold">
                About AM STORE
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-gold">
                Contact us
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition hover:text-gold">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-gold">
                Terms &amp; conditions
              </Link>
            </li>
            <li>
              <Link href="/admin" className="transition hover:text-gold">
                Store admin
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[0.6875rem] font-semibold tracking-[0.22em] text-gold uppercase">Visit us</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>
                {settings.address}
                <br />
                Longleng, Nagaland — {settings.pin_code}
              </span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="transition hover:text-gold">
                {formatPhone(settings.phone)}
              </a>
            </li>
            {settings.email ? (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" />
                <a href={`mailto:${settings.email}`} className="break-all transition hover:text-gold">
                  {settings.email}
                </a>
              </li>
            ) : null}
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>{settings.opening_hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-2 py-5 text-center text-xs text-white/45 sm:flex-row sm:text-left">
          <p>
            © {year} {settings.store_name}. All rights reserved.
          </p>
          <p>Grocery retail · Longleng, Nagaland, India</p>
        </div>
      </div>
    </footer>
  );
}
