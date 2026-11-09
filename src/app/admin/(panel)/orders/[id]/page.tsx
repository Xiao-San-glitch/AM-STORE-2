import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, MessageCircle, Phone } from "lucide-react";
import { setOrderStatus } from "@/app/admin/actions";
import { getOrderById, getSettings } from "@/lib/db";
import { defaultSettings } from "@/lib/seed-data";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/types";
import { buildCustomerWhatsAppUrl, buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import { cn, formatDate, formatINR, formatPhone, orderStatusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

export default async function AdminOrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const updated = (Array.isArray(query.updated) ? query.updated[0] : query.updated) === "1";

  const [order, settings] = await Promise.all([
    getOrderById(id).catch(() => null),
    getSettings().catch(() => defaultSettings),
  ]);
  if (!order) notFound();

  const whatsappUrl = buildWhatsAppOrderUrl(order, settings);
  const customerWhatsAppUrl = buildCustomerWhatsAppUrl(order, settings);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-charcoal uppercase transition hover:text-gold-deep"
      >
        <ArrowLeft className="size-3.5" /> Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl">{order.order_number}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.created_at, true)}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            orderStatusTone(order.order_status),
          )}
        >
          {ORDER_STATUS_LABELS[order.order_status]}
        </span>
      </div>

      {updated ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" /> Order status updated.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <header className="border-b border-line px-4 py-3.5">
              <h2 className="text-base">Items</h2>
            </header>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-[#F6F1E7]">
                    <img
                      src={item.product_image || "/products/basmati-rice.jpg"}
                      alt=""
                      className="size-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{item.product_name}</span>
                    <span className="block text-[0.6875rem] text-muted">
                      {item.variant_name ?? item.unit ?? "each"} · {formatINR(item.unit_price)} × {item.quantity}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular">{formatINR(item.total_price)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-4 py-3.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular">{formatINR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="tabular">{formatINR(order.delivery_charge)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="tabular">−{formatINR(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{formatINR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-base">Customer &amp; delivery</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">Name</dt>
                <dd className="mt-0.5 text-charcoal">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">Phone</dt>
                <dd className="mt-0.5 text-charcoal">{formatPhone(order.phone)}</dd>
              </div>
              {order.email ? (
                <div className="sm:col-span-2">
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">Email</dt>
                  <dd className="mt-0.5 break-all text-charcoal">{order.email}</dd>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <dt className="text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">
                  {order.fulfilment_method === "pickup" ? "Pickup" : "Delivery address"}
                </dt>
                <dd className="mt-0.5 text-charcoal">
                  {order.address}
                  {order.locality ? `, ${order.locality}` : ""}
                  {order.pin_code ? ` — ${order.pin_code}` : ""}
                </dd>
              </div>
              {order.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.12em] text-muted uppercase">Notes</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-charcoal/80">{order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-base">Update status</h2>
            <form action={setOrderStatus} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <div>
                <label htmlFor="status" className="label">
                  Order status
                </label>
                <select id="status" name="status" defaultValue={order.order_status} className="select">
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="payment_status" className="label">
                  Payment
                </label>
                <select id="payment_status" name="payment_status" defaultValue={order.payment_status} className="select">
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-dark w-full btn-sm">
                Save status
              </button>
            </form>
            <p className="mt-2 text-[0.625rem] leading-relaxed text-muted">
              The customer sees this status on their order page immediately.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-base">Contact</h2>
            <div className="mt-3 space-y-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full btn-sm">
                <MessageCircle className="size-3.5" /> WhatsApp summary
              </a>
              <a
                href={customerWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full btn-sm"
              >
                <MessageCircle className="size-3.5" /> Message customer
              </a>
              <a href={`tel:${order.phone}`} className="btn btn-outline w-full btn-sm">
                <Phone className="size-3.5" /> Call {formatPhone(order.phone)}
              </a>
              <Link
                href={`/order/${order.public_token}`}
                target="_blank"
                className="btn btn-ghost w-full btn-sm"
              >
                <ExternalLink className="size-3.5" /> Customer receipt
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-warm p-4 text-xs text-charcoal/70">
            <p>
              <span className="font-semibold text-ink">Payment method:</span>{" "}
              {order.payment_method === "cod"
                ? "Cash on delivery"
                : order.payment_method === "pickup"
                  ? "Pay at store"
                  : "Online"}
            </p>
            <p className="mt-1.5">
              <span className="font-semibold text-ink">Fulfilment:</span>{" "}
              {order.fulfilment_method === "pickup" ? "Store pickup" : "Home delivery"}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
