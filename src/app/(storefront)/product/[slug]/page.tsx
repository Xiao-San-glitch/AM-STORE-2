import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProductBySlug, getSettings, relatedProducts } from "@/lib/db";
import { buildProductEnquiryUrl } from "@/lib/whatsapp";
import { defaultSettings } from "@/lib/seed-data";
import { formatINR } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description:
      product.description ??
      `Buy ${product.name} (${product.unit}) at ${formatINR(product.price)} from AM STORE, Longleng, Nagaland.`,
    openGraph: {
      title: product.name,
      description: product.description ?? `${product.name} — ${product.unit}`,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const [settings, related] = await Promise.all([
    getSettings().catch(() => defaultSettings),
    relatedProducts(product.category_id, product.id, 4).catch(() => []),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.image_url ? [product.image_url] : undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: product.sku ?? undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability:
        product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="shell py-6 sm:py-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="transition hover:text-gold-deep">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/shop" className="transition hover:text-gold-deep">
            Shop
          </Link>
          {product.category_slug ? (
            <>
              <ChevronRight className="size-3" />
              <Link href={`/category/${product.category_slug}`} className="transition hover:text-gold-deep">
                {product.category_name}
              </Link>
            </>
          ) : null}
          <ChevronRight className="size-3" />
          <span className="text-charcoal">{product.name}</span>
        </nav>

        <div className="mt-6">
          <ProductDetail
            product={product}
            freeDeliveryThreshold={settings.free_delivery_threshold}
            deliveryCharge={settings.delivery_charge}
            pickupEnabled={settings.pickup_enabled}
            enquiryUrl={buildProductEnquiryUrl(settings, product.name)}
          />
        </div>
      </div>

      {related.length > 0 ? (
        <section className="shell border-t border-line py-12">
          <SectionHeading
            eyebrow="You may also like"
            title="More from this aisle"
            href={product.category_slug ? `/category/${product.category_slug}` : "/shop"}
            linkLabel={`All ${product.category_name ?? "products"}`}
          />
          <ProductGrid className="mt-7" products={related} />
        </section>
      ) : null}
    </div>
  );
}
