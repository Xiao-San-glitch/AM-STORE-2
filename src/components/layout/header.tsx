"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, ShoppingBag, X, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SearchBar } from "./search-bar";
import { useCart } from "@/components/cart/cart-provider";
import { cn, formatPhone } from "@/lib/utils";

type HeaderSettings = {
  logo_url: string | null;
  announcement: string;
  phone: string;
};

type NavCategory = { name: string; slug: string };

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header({ settings, categories }: { settings: HeaderSettings; categories: NavCategory[] }) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setCategoriesOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink text-white">
        <div className="shell flex h-9 items-center justify-center gap-2 text-center">
          <span className="size-1 rounded-full bg-gold" aria-hidden />
          <p className="truncate text-[0.6875rem] font-medium tracking-[0.12em] text-white/80 uppercase sm:tracking-[0.18em]">
            {settings.announcement}
          </p>
        </div>
      </div>

      <div className="border-b border-line bg-warm/95 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between gap-3 lg:h-20 lg:gap-6">
          <div className="flex items-center gap-2 lg:gap-0">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-sand lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Logo logoUrl={settings.logo_url} />
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {NAV.slice(0, 2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2 text-sm font-medium tracking-wide transition-colors",
                  isActive(item.href) ? "text-ink" : "text-charcoal/70 hover:text-ink",
                )}
              >
                {item.label}
                {isActive(item.href) ? (
                  <span className="absolute -bottom-0.5 left-0 h-px w-full bg-gold" />
                ) : null}
              </Link>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                aria-expanded={categoriesOpen}
                className={cn(
                  "inline-flex items-center gap-1 py-2 text-sm font-medium tracking-wide transition-colors",
                  pathname.startsWith("/category") || pathname === "/categories"
                    ? "text-ink"
                    : "text-charcoal/70 hover:text-ink",
                )}
              >
                Categories
                <ChevronDown className={cn("size-3.5 transition-transform", categoriesOpen && "rotate-180")} />
              </button>
              {categoriesOpen ? (
                <div className="absolute top-full left-1/2 w-64 -translate-x-1/2 pt-2">
                  <div className="overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-lift)]">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        className="block rounded-xl px-3 py-2 text-sm text-charcoal transition hover:bg-sand/70 hover:text-ink"
                      >
                        {category.name}
                      </Link>
                    ))}
                    <Link
                      href="/categories"
                      className="mt-1 block rounded-xl border-t border-line px-3 py-2 text-xs font-semibold tracking-[0.14em] text-gold-deep uppercase"
                    >
                      All categories
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {NAV.slice(2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "py-2 text-sm font-medium tracking-wide transition-colors",
                  isActive(item.href) ? "text-ink" : "text-charcoal/70 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <SearchBar className="hidden w-56 md:block xl:w-72" />
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="hidden items-center gap-2 rounded-full border border-line px-3 py-2 text-xs font-medium text-charcoal transition hover:border-gold lg:inline-flex"
            >
              <Phone className="size-3.5 text-gold-deep" />
              {formatPhone(settings.phone)}
            </a>
            <Link
              href="/cart"
              className="relative inline-flex size-10 items-center justify-center rounded-full bg-ink text-white transition hover:bg-charcoal"
              aria-label={`Shopping cart with ${ready ? count : 0} items`}
            >
              <ShoppingBag className="size-[18px]" />
              {ready && count > 0 ? (
                <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[0.625rem] font-bold text-ink">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div className="shell pb-3 md:hidden">
          <SearchBar />
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-x-0 top-[6.25rem] bottom-0 z-40 overflow-y-auto bg-warm lg:hidden">
          <div className="shell py-6">
            <nav aria-label="Mobile" className="flex flex-col">
              <Link href="/" className="border-b border-line py-3.5 text-base font-medium text-ink">
                Home
              </Link>
              <Link href="/shop" className="border-b border-line py-3.5 text-base font-medium text-ink">
                Shop all products
              </Link>
              <p className="pt-6 pb-2 text-[0.625rem] font-semibold tracking-[0.22em] text-muted uppercase">
                Shop by category
              </p>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="border-b border-line py-3 text-sm text-charcoal"
                >
                  {category.name}
                </Link>
              ))}
              <Link href="/about" className="border-b border-line py-3.5 text-base font-medium text-ink">
                About us
              </Link>
              <Link href="/contact" className="border-b border-line py-3.5 text-base font-medium text-ink">
                Contact
              </Link>
            </nav>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="btn btn-gold mt-6 w-full"
            >
              <Phone className="size-4" />
              Call the store
            </a>
            <p className="mt-4 text-center text-xs text-muted">
              Longleng, Nagaland 789625 · Mon–Sat, 8 AM – 8 PM
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
