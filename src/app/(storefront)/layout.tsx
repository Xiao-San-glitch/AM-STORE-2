import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ToastProvider } from "@/components/ui/toast";
import { WhatsAppSupport } from "@/components/storefront/whatsapp-support";
import { getSettings, listCategories } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";
import { siteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => defaultSettings);
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${settings.store_name} — Grocery store in Longleng, Nagaland`,
      template: `%s · ${settings.store_name}`,
    },
    description: settings.tagline,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: settings.store_name,
      title: `${settings.store_name} — Everyday essentials in Longleng`,
      description: settings.tagline,
      images: [{ url: "/products/hero-groceries.jpg", width: 1600, height: 1200, alt: "Fresh groceries at AM STORE" }],
    },
  };
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getSettings().catch(() => defaultSettings),
    listCategories().catch(() => []),
  ]);

  return (
    <ToastProvider>
      <CartProvider>
        <Header
          settings={{
            logo_url: settings.logo_url,
            announcement: settings.announcement,
            phone: settings.phone,
          }}
          categories={categories.map((category) => ({ name: category.name, slug: category.slug }))}
        />
        <main className="min-h-[50vh]">{children}</main>
        <Footer settings={settings} categories={categories} />
        <WhatsAppSupport settings={settings} />
      </CartProvider>
    </ToastProvider>
  );
}
