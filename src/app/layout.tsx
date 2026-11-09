import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "AM STORE — Grocery store in Longleng, Nagaland", template: "%s · AM STORE" },
  description:
    "Shop rice, dal, cooking oils, spices, snacks and household essentials online from AM STORE in Longleng, Nagaland. Cash on delivery or in-store pickup.",
  keywords: ["grocery", "Longleng", "Nagaland", "AM STORE", "rice", "dal", "online grocery"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "AM STORE",
    images: [{ url: "/products/hero-groceries.jpg", width: 1600, height: 1200, alt: "Fresh groceries at AM STORE" }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-warm">{children}</body>
    </html>
  );
}
