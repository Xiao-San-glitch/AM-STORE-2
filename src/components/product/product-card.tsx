import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, discountPercent, formatINR, stockLabel } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const discount = discountPercent(product.price, product.original_price);
  const stock = stockLabel(product.stock_quantity);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden bg-[#F6F1E7]">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {discount > 0 ? (
            <span className="rounded-full bg-gold px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-ink uppercase">
              {discount}% off
            </span>
          ) : null}
          {product.best_seller ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-gold uppercase">
              <Star className="size-2.5 fill-gold" /> Best seller
            </span>
          ) : null}
        </div>
        <img
          src={product.image_url || "/products/basmati-rice.jpg"}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[0.625rem] font-semibold tracking-[0.16em] text-muted uppercase">
          {product.category_name ?? "Grocery"}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[0.9375rem] leading-snug font-semibold">
          <Link href={`/product/${product.slug}`} className="text-ink transition hover:text-gold-deep">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted">
          {product.brand ? `${product.brand} · ` : ""}
          {product.unit}
        </p>

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-lg font-semibold text-ink tabular">{formatINR(product.price)}</span>
            {product.original_price && product.original_price > product.price ? (
              <span className="text-xs text-muted line-through tabular">{formatINR(product.original_price)}</span>
            ) : null}
          </div>
          <p className={cn("mt-0.5 text-[0.6875rem] font-medium", stock.tone)}>{stock.text}</p>

          <AddToCartButton
            compact
            className="mt-3 w-full"
            line={{
              productId: product.id,
              variantId: null,
              name: product.name,
              slug: product.slug,
              image: product.image_url,
              unit: product.unit,
              variantName: null,
              price: product.price,
              originalPrice: product.original_price,
              stock: product.stock_quantity,
            }}
          />
        </div>
      </div>
    </article>
  );
}
