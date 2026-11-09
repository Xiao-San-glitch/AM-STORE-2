"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2, Store, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { cn, formatINR } from "@/lib/utils";

type Props = {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  storeAddress: string;
  storePin: string;
};

type Field =
  | "customer_name"
  | "phone"
  | "email"
  | "address"
  | "locality"
  | "pin_code"
  | "notes";

export function CheckoutForm({
  deliveryEnabled,
  pickupEnabled,
  deliveryCharge,
  freeDeliveryThreshold,
  minOrderAmount,
  storeAddress,
  storePin,
}: Props) {
  const router = useRouter();
  const { lines, subtotal, count, ready, clear } = useCart();
  const idempotencyKey = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );

  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">(
    deliveryEnabled ? "delivery" : "pickup",
  );
  const [fields, setFields] = useState<Record<Field, string>>({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    locality: "",
    pin_code: deliveryEnabled ? "" : storePin,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const delivery = fulfilment === "delivery" ? (subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge) : 0;
  const total = subtotal + delivery;
  const belowMinimum = subtotal < minOrderAmount;
  const payment = fulfilment === "pickup" ? "pickup" : "cod";

  const set = (key: Field) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((current) => ({ ...current, [key]: event.target.value }));
  };

  const canSubmit = useMemo(
    () =>
      ready &&
      !submitting &&
      !belowMinimum &&
      lines.length > 0 &&
      fields.customer_name.trim().length >= 2 &&
      fields.phone.trim().length >= 10 &&
      (fulfilment === "pickup" ||
        (fields.address.trim().length >= 6 &&
          fields.locality.trim().length >= 2 &&
          /^\d{6}$/.test(fields.pin_code.trim()))),
    [ready, submitting, belowMinimum, lines.length, fields, fulfilment],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError(
        fulfilment === "delivery"
          ? "Please complete your name, mobile number and delivery address."
          : "Please complete your name and mobile number.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: fields.customer_name.trim(),
          phone: fields.phone.trim(),
          email: fields.email.trim() || null,
          address: fields.address.trim(),
          locality: fields.locality.trim(),
          pin_code: fields.pin_code.trim(),
          notes: fields.notes.trim() || null,
          fulfilment_method: fulfilment,
          payment_method: payment,
          idempotency_key: idempotencyKey.current,
          items: lines.map((line) => ({
            product_id: line.productId,
            variant_id: line.variantId,
            quantity: line.quantity,
          })),
        }),
      });

      const data = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !data.token) {
        setError(data.error ?? "We could not place your order. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      router.push(`/order/${data.token}?new=1`);
    } catch {
      setError("Network problem — your order was not placed. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (ready && lines.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <h2 className="text-xl">There is nothing to check out</h2>
        <p className="mt-1.5 text-sm text-muted">Add a few products to your basket first.</p>
        <Link href="/shop" className="btn btn-dark mt-5">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg">How would you like to receive it?</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              disabled={!deliveryEnabled}
              onClick={() => setFulfilment("delivery")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 text-left transition",
                fulfilment === "delivery" ? "border-ink bg-warm" : "border-line hover:border-gold",
                !deliveryEnabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Truck className="mt-0.5 size-4 shrink-0 text-gold-deep" />
              <span>
                <span className="block text-sm font-semibold text-ink">Home delivery</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {deliveryCharge === 0 ? "Free delivery" : `${formatINR(deliveryCharge)} · free over ${formatINR(freeDeliveryThreshold)}`}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={!pickupEnabled}
              onClick={() => setFulfilment("pickup")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 text-left transition",
                fulfilment === "pickup" ? "border-ink bg-warm" : "border-line hover:border-gold",
                !pickupEnabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Store className="mt-0.5 size-4 shrink-0 text-gold-deep" />
              <span>
                <span className="block text-sm font-semibold text-ink">Store pickup</span>
                <span className="mt-0.5 block text-xs text-muted">Pay at the counter when you collect</span>
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg">Your details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customer_name" className="label">
                Full name *
              </label>
              <input
                id="customer_name"
                name="customer_name"
                value={fields.customer_name}
                onChange={set("customer_name")}
                autoComplete="name"
                required
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Mobile number *
              </label>
              <input
                id="phone"
                name="phone"
                value={fields.phone}
                onChange={set("phone")}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                className="input"
                placeholder="10-digit mobile"
              />
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-muted">
                We send order updates and receipts to this number on WhatsApp. Message us there any time about a
                purchase or a problem with an order.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="label">
                Email (optional)
              </label>
              <input
                id="email"
                name="email"
                value={fields.email}
                onChange={set("email")}
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
              />
            </div>
          </div>
        </section>

        {fulfilment === "delivery" ? (
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg">Delivery address</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <label htmlFor="address" className="label">
                  House / street / landmark *
                </label>
                <input
                  id="address"
                  name="address"
                  value={fields.address}
                  onChange={set("address")}
                  autoComplete="street-address"
                  required
                  className="input"
                  placeholder="House number, street, landmark"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="locality" className="label">
                    Locality / ward *
                  </label>
                  <input
                    id="locality"
                    name="locality"
                    value={fields.locality}
                    onChange={set("locality")}
                    className="input"
                    placeholder="e.g. Longleng town"
                  />
                </div>
                <div>
                  <label htmlFor="pin_code" className="label">
                    PIN code *
                  </label>
                  <input
                    id="pin_code"
                    name="pin_code"
                    value={fields.pin_code}
                    onChange={set("pin_code")}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    required
                    className="input"
                    placeholder="789625"
                  />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg">Pickup point</h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal/75">
              {storeAddress}
              <br />
              Longleng, Nagaland — {storePin}
            </p>
            <p className="mt-2 text-xs text-muted">
              We will call or message you when your order is ready. Pay at the counter on collection.
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg">Order notes (optional)</h2>
          <textarea
            id="notes"
            name="notes"
            value={fields.notes}
            onChange={set("notes")}
            rows={3}
            maxLength={500}
            className="textarea mt-3"
            placeholder="Anything the store should know — packing preference, delivery timing, substitutes…"
          />
        </section>

        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-lg">Order summary</h2>
          <p className="mt-1 text-xs text-muted">
            {count} {count === 1 ? "item" : "items"}
          </p>

          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-2.5">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line bg-[#F6F1E7]">
                  <img src={line.image || "/products/basmati-rice.jpg"} alt="" className="size-full object-cover" />
                  <span className="absolute right-0 bottom-0 rounded-tl bg-ink px-1 text-[0.5625rem] font-bold text-white">
                    ×{line.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">{line.name}</span>
                  <span className="block text-[0.6875rem] text-muted">{line.variantName ?? line.unit}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-ink tabular">
                  {formatINR(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{fulfilment === "pickup" ? "Pickup" : "Delivery"}</dt>
              <dd className="tabular">{delivery === 0 ? "Free" : formatINR(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular">{formatINR(total)}</dd>
            </div>
          </dl>

          <p className="mt-3 rounded-lg bg-warm px-3 py-2 text-[0.6875rem] leading-relaxed text-charcoal/70">
            Payment: {payment === "cod" ? "cash on delivery" : "pay at store"}. Your order is sent to the store
            immediately and only confirmed once they accept it.
          </p>

          {belowMinimum ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[0.6875rem] text-amber-800">
              Minimum order is {formatINR(minOrderAmount)}.
            </p>
          ) : null}

          <button type="submit" disabled={!canSubmit} className="btn btn-dark mt-4 w-full">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Placing order…
              </>
            ) : (
              <>
                Place order · {formatINR(total)} <ArrowRight className="size-4" />
              </>
            )}
          </button>
          <Link href="/cart" className="mt-3 block text-center text-xs text-muted underline transition hover:text-gold-deep">
            Back to basket
          </Link>
        </div>
      </aside>
    </form>
  );
}
