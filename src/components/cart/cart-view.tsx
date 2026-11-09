"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatINR } from "@/lib/utils";

type Props = {
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  deliveryEnabled: boolean;
};

export function CartView({ deliveryCharge, freeDeliveryThreshold, minOrderAmount, deliveryEnabled }: Props) {
  const { lines, subtotal, count, ready, setQuantity, remove, clear } = useCart();

  if (!ready) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/70 px-6 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-sand text-gold-deep">
          <ShoppingBag className="size-6" />
        </span>
        <h2 className="mt-5 text-xl">Your basket is empty</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          Add rice, dal, oil and household essentials, then check out with cash on delivery or store pickup.
        </p>
        <Link href="/shop" className="btn btn-dark mt-6">
          Start shopping <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  const deliveryEstimate = deliveryEnabled
    ? subtotal >= freeDeliveryThreshold
      ? 0
      : deliveryCharge
    : 0;
  const belowMinimum = subtotal < minOrderAmount;
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {count} {count === 1 ? "item" : "items"}
          </p>
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-muted transition hover:text-danger"
          >
            Clear basket
          </button>
        </div>

        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-3 p-3.5 sm:gap-4 sm:p-4">
              <Link
                href={`/product/${line.slug}`}
                className="size-20 shrink-0 overflow-hidden rounded-xl border border-line bg-[#F6F1E7] sm:size-24"
              >
                <img
                  src={line.image || "/products/basmati-rice.jpg"}
                  alt={line.name}
                  className="size-full object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.slug}`}
                      className="line-clamp-2 text-sm font-semibold text-ink transition hover:text-gold-deep"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">{line.variantName ?? line.unit}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.key)}
                    aria-label={`Remove ${line.name}`}
                    className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-rose-50 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2.5">
                  <div className="inline-flex items-center rounded-full border border-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                      aria-label={`Decrease ${line.name}`}
                      className="flex size-8 items-center justify-center rounded-l-full transition hover:bg-sand"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold tabular">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                      disabled={line.quantity >= line.stock}
                      aria-label={`Increase ${line.name}`}
                      className="flex size-8 items-center justify-center rounded-r-full transition hover:bg-sand disabled:opacity-40"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink tabular">
                      {formatINR(line.price * line.quantity)}
                    </p>
                    {line.quantity > 1 ? (
                      <p className="text-[0.6875rem] text-muted tabular">{formatINR(line.price)} each</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/shop"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-charcoal uppercase transition hover:text-gold-deep"
        >
          Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg">Order summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink tabular">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Delivery (estimate)</dt>
              <dd className="font-medium text-ink tabular">
                {deliveryEnabled ? (deliveryEstimate === 0 ? "Free" : formatINR(deliveryEstimate)) : "Pickup only"}
              </dd>
            </div>
            {deliveryEnabled && remainingForFree > 0 ? (
              <p className="rounded-lg bg-gold-soft/70 px-3 py-2 text-[0.6875rem] leading-relaxed text-gold-deep">
                Add {formatINR(remainingForFree)} more for free delivery.
              </p>
            ) : null}
            <div className="flex items-center justify-between border-t border-line pt-3 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-semibold text-ink tabular">{formatINR(subtotal + deliveryEstimate)}</dd>
            </div>
          </dl>

          {belowMinimum ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.6875rem] leading-relaxed text-amber-800">
              Minimum order is {formatINR(minOrderAmount)}. Add {formatINR(minOrderAmount - subtotal)} more to check
              out.
            </p>
          ) : null}

          <Link
            href="/checkout"
            aria-disabled={belowMinimum}
            onClick={(event) => {
              if (belowMinimum) event.preventDefault();
            }}
            className={`btn mt-4 w-full ${belowMinimum ? "pointer-events-none bg-sand text-muted" : "btn-dark"}`}
          >
            Proceed to checkout <ArrowRight className="size-4" />
          </Link>

          <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-muted">
            Cash on delivery or pay at store. No online payment required.
          </p>
        </div>
      </aside>
    </div>
  );
}
