"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShieldCheck, Truck, Store } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";
import type { Product } from "@/lib/types";
import { cn, discountPercent, formatINR, stockLabel } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-provider";

type Props = {
  product: Product;
  freeDeliveryThreshold: number;
  deliveryCharge: number;
  pickupEnabled: boolean;
  enquiryUrl: string;
};

export function ProductDetail({ product, freeDeliveryThreshold, deliveryCharge, pickupEnabled, enquiryUrl }: Props) {
  const router = useRouter();
  const { add } = useCart();
  const gallery = useMemo(
    () => [product.image_url, ...product.additional_images].filter(Boolean) as string[],
    [product.image_url, product.additional_images],
  );
  const [activeImage, setActiveImage] = useState(gallery[0] ?? "/products/basmati-rice.jpg");
  const [variantId, setVariantId] = useState<string | null>(
    product.variants.find((variant) => variant.stock_quantity > 0)?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants.find((item) => item.id === variantId) ?? null;
  const price = variant ? variant.price : product.price;
  const originalPrice = variant ? variant.original_price : product.original_price;
  const stock = variant ? variant.stock_quantity : product.stock_quantity;
  const unit = variant ? variant.variant_name : product.unit;
  const discount = discountPercent(price, originalPrice);
  const availability = stockLabel(stock);

  const line = {
    productId: product.id,
    variantId,
    name: product.name,
    slug: product.slug,
    image: product.image_url,
    unit: product.unit,
    variantName: variant?.variant_name ?? null,
    price,
    originalPrice,
    stock,
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        <div className="overflow-hidden rounded-2xl border border-line bg-[#F6F1E7]">
          <img src={activeImage} alt={product.name} className="aspect-square w-full object-cover" />
        </div>
        {gallery.length > 1 ? (
          <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar">
            {gallery.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                aria-label="View product image"
                className={cn(
                  "size-16 shrink-0 overflow-hidden rounded-xl border bg-[#F6F1E7] transition sm:size-20",
                  activeImage === image ? "border-gold ring-2 ring-gold/30" : "border-line hover:border-gold/60",
                )}
              >
                <img src={image} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-[0.625rem] font-semibold tracking-[0.2em] text-muted uppercase">
          {product.category_name ?? "Grocery"}
          {product.brand ? ` · ${product.brand}` : ""}
        </p>
        <h1 className="mt-2 text-2xl leading-tight sm:text-[2rem]">{product.name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="text-2xl font-semibold text-ink tabular">{formatINR(price)}</span>
          {originalPrice && originalPrice > price ? (
            <>
              <span className="text-sm text-muted line-through tabular">{formatINR(originalPrice)}</span>
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold-deep">
                Save {formatINR(originalPrice - price)}
              </span>
            </>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted">
          {unit}
          {discount > 0 ? ` · ${discount}% off` : ""}
        </p>
        <p className={cn("mt-2 inline-flex items-center gap-1.5 text-xs font-semibold", availability.tone)}>
          <span className="size-1.5 rounded-full bg-current" /> {availability.text}
        </p>

        {product.description ? (
          <p className="mt-4 text-sm leading-relaxed text-charcoal/75">{product.description}</p>
        ) : null}

        {product.variants.length > 0 ? (
          <div className="mt-6">
            <p className="label">Choose a pack size</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((option) => {
                const disabled = option.stock_quantity <= 0;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setVariantId(option.id);
                      setQuantity(1);
                    }}
                    className={cn(
                      "rounded-xl border px-3.5 py-2 text-left text-xs transition",
                      option.id === variantId
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white text-charcoal hover:border-gold",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span className="block font-semibold">{option.variant_name}</span>
                    <span className={cn("tabular", option.id === variantId ? "text-gold" : "text-muted")}>
                      {formatINR(option.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-line bg-white">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex size-10 items-center justify-center rounded-l-full text-charcoal transition hover:bg-sand disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-9 text-center text-sm font-semibold tabular">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(stock, 99, value + 1))}
              disabled={quantity >= Math.min(stock, 99)}
              aria-label="Increase quantity"
              className="flex size-10 items-center justify-center rounded-r-full text-charcoal transition hover:bg-sand disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <AddToCartButton className="min-w-44 flex-1 sm:flex-none" line={line} quantity={quantity} />

          <button
            type="button"
            disabled={stock <= 0}
            onClick={() => {
              add(line, quantity);
              router.push("/cart");
            }}
            className="btn btn-gold min-w-36 disabled:cursor-not-allowed"
          >
            Buy now
          </button>
        </div>

        <p className="mt-3 text-xs text-muted">
          Not sure about size, brand or availability?{" "}
          <a
            href={enquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold-deep underline underline-offset-2 hover:text-ink"
          >
            Ask us on WhatsApp
          </a>
          .
        </p>

        <dl className="mt-7 grid gap-3 rounded-2xl border border-line bg-white p-4 text-xs sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <Truck className="mt-0.5 size-4 shrink-0 text-gold-deep" />
            <div>
              <dt className="font-semibold text-ink">Home delivery</dt>
              <dd className="mt-0.5 text-muted">
                {formatINR(deliveryCharge)} fee · free over {formatINR(freeDeliveryThreshold)}
              </dd>
            </div>
          </div>
          {pickupEnabled ? (
            <div className="flex items-start gap-2.5">
              <Store className="mt-0.5 size-4 shrink-0 text-gold-deep" />
              <div>
                <dt className="font-semibold text-ink">Store pickup</dt>
                <dd className="mt-0.5 text-muted">Collect from Longleng main road</dd>
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-deep" />
            <div>
              <dt className="font-semibold text-ink">Pay on delivery</dt>
              <dd className="mt-0.5 text-muted">Cash accepted when your order arrives</dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-gold-deep" />
            <div>
              <dt className="font-semibold text-ink">Checked before packing</dt>
              <dd className="mt-0.5 text-muted">Expiry and seals verified by the store</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
