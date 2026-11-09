import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, LifeBuoy, MessageCircle, Phone, MapPin, Clock, Store } from "lucide-react";
import { OrderActions } from "@/components/order/order-actions";
import { getOrderByToken, getSettings } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { buildOrderSupportUrl, buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import { cn, formatDate, formatINR, formatPhone, orderStatusTone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function timeline(fulfilment: string): OrderStatus[] {
  return fulfilment === "pickup"
    ? ["pending", "confirmed", "processing", "ready_for_pickup", "delivered"]
    : ["pending", "confirmed", "processing", "out_for_delivery", "delivered"];
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { token } = await params;
  const query = await searchParams;
  const isNew = (Array.isArray(query.new) ? query.new[0] : query.new) === "1";

  const [order, settings] = await Promise.all([
    getOrderByToken(token).catch(() => null),
    getSettings().catch(() => defaultSettings),
  ]);

  if (!order) notFound();

  const whatsappUrl = buildWhatsAppOrderUrl(order, settings);
  const supportUrl = buildOrderSupportUrl(order, settings);
  const steps = timeline(order.fulfilment_method);
  const currentIndex = steps.indexOf(order.order_status);
  const cancelled = order.order_status === "cancelled";

  return (
    <div className="shell py-10 sm:py-14">
      {isNew ? (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Thank you — your order has been received.</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
              The store will confirm availability and delivery timing. Keep this page bookmarked — it is your order
              receipt.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order receipt</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{order.order_number}</h1>
          <p className="mt-2 text-sm text-muted">Placed {formatDate(order.created_at, true)}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold",
            orderStatusTone(order.order_status),
          )}
        >
          {ORDER_STATUS_LABELS[order.order_status]}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white">
            <header className="border-b border-line px-5 py-4">
              <h2 className="text-lg">Items</h2>
            </header>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="size-14 shrink-0 overflow-hidden rounded-xl border border-line bg-[#F6F1E7]">
                    <img
                      src={item.product_image || "/products/basmati-rice.jpg"}
                      alt={item.product_name}
                      className="size-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{item.product_name}</span>
                    <span className="block text-xs text-muted">
                      {item.variant_name ?? item.unit ?? "each"} · Qty {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink tabular">
                    {formatINR(item.total_price)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular">{formatINR(order.subtotal)}</dd>
              </div>
              {order.delivery_charge > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="tabular">{formatINR(order.delivery_charge)}</dd>
                </div>
              ) : (
                <div className="flex justify-between">
                  <dt className="text-muted">
                    {order.fulfilment_method === "pickup" ? "Pickup" : "Delivery"}
                  </dt>
                  <dd className="text-success">Free</dd>
                </div>
              )}
              {order.discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="tabular">−{formatINR(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{formatINR(order.total)}</dd>
              </div>
              <p className="text-xs text-muted">
                Payment:{" "}
                {order.payment_method === "cod"
                  ? "cash on delivery"
                  : order.payment_method === "pickup"
                    ? "pay at store"
                    : "online"}{" "}
                · {order.payment_status === "paid" ? "paid" : "not yet paid"}
              </p>
            </dl>
          </section>

          {!cancelled ? (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-lg">Progress</h2>
              <ol className="mt-4 space-y-0">
                {steps.map((step, index) => {
                  const done = currentIndex >= index;
                  return (
                    <li key={step} className="flex gap-3">
                      <span className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-bold",
                            done ? "border-ink bg-ink text-gold" : "border-line bg-white text-muted",
                          )}
                        >
                          {index + 1}
                        </span>
                        {index < steps.length - 1 ? (
                          <span className={cn("my-1 w-px flex-1", done ? "bg-ink/40" : "bg-line")} />
                        ) : null}
                      </span>
                      <div className={cn("pb-4", index === steps.length - 1 && "pb-0")}>
                        <p className={cn("text-sm font-medium", done ? "text-ink" : "text-muted")}>
                          {ORDER_STATUS_LABELS[step]}
                        </p>
                        <p className="text-[0.6875rem] text-muted">
                          {step === "pending" && "Order received by the store"}
                          {step === "confirmed" && "Stock checked and accepted"}
                          {step === "processing" && "Your items are being packed"}
                          {step === "ready_for_pickup" && "Collect from the store counter"}
                          {step === "out_for_delivery" && "On the way to your address"}
                          {step === "delivered" && "Completed"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-1 text-xs text-muted">
                This page always shows the latest status from the store.
              </p>
            </section>
          ) : (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <h2 className="text-lg text-rose-900">This order was cancelled</h2>
              <p className="mt-1.5 text-sm text-rose-800">
                If this was unexpected, call the store on {formatPhone(settings.phone)} and we will help you reorder.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg">Next step</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Send this order to the store on WhatsApp so they can confirm it straight away.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold mt-3 w-full"
            >
              <MessageCircle className="size-4" /> Send on WhatsApp
            </a>
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="btn btn-outline mt-2 w-full">
              <Phone className="size-4" /> Call the store
            </a>
            <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-2 w-full">
              <LifeBuoy className="size-4" /> Report an issue
            </a>
            <p className="mt-2.5 text-[0.6875rem] leading-relaxed text-muted">
              Item missing, wrong or late? The issue link opens WhatsApp with your order number filled in, so the store
              can check it straight away.
            </p>
            <div className="mt-4">
              <OrderActions token={order.public_token} />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="text-lg">
              {order.fulfilment_method === "pickup" ? "Pickup details" : "Delivery details"}
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs text-charcoal/80">
              <li className="flex gap-2.5">
                {order.fulfilment_method === "pickup" ? (
                  <Store className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                ) : (
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                )}
                <span>
                  {order.fulfilment_method === "pickup"
                    ? `${settings.address}, Longleng — ${settings.pin_code}`
                    : `${order.address}, ${order.locality} — ${order.pin_code}`}
                </span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                <span>
                  {order.customer_name}
                  <br />
                  {formatPhone(order.phone)}
                </span>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                <span>{settings.opening_hours}</span>
              </li>
            </ul>
            {order.notes ? (
              <p className="mt-3 rounded-lg bg-warm px-3 py-2 text-[0.6875rem] leading-relaxed text-charcoal/70">
                Note: {order.notes}
              </p>
            ) : null}
          </div>

          <Link href="/shop" className="btn btn-dark w-full">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
