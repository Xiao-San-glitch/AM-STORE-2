import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { listCustomerOrders } from "@/lib/db";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { cn, formatDate, formatINR, formatPhone, orderStatusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Customer" };

type Props = { params: Promise<{ id: string }> };

export default async function CustomerPage({ params }: Props) {
  const { id } = await params;
  const orders = await listCustomerOrders(id).catch(() => []);
  if (orders.length === 0) notFound();

  const latest = orders[0];
  const totalSpent = orders
    .filter((order) => order.order_status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-charcoal uppercase transition hover:text-gold-deep"
      >
        <ArrowLeft className="size-3.5" /> Customers
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl">{latest.customer_name || "Unnamed customer"}</h1>
          <p className="mt-1 text-sm text-muted">{formatPhone(latest.phone)}</p>
        </div>
        <a href={`tel:${latest.phone}`} className="btn btn-outline btn-sm">
          <Phone className="size-3.5" /> Call
        </a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">Orders</p>
          <p className="mt-2 text-2xl font-semibold tabular">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">Total spent</p>
          <p className="mt-2 text-2xl font-semibold tabular">{formatINR(totalSpent)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">Last order</p>
          <p className="mt-2 text-base font-medium">{formatDate(latest.created_at)}</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
        <header className="border-b border-line px-4 py-3.5">
          <h2 className="text-base">Order history</h2>
        </header>
        <ul className="divide-y divide-line">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-warm/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{order.order_number}</span>
                  <span className="block text-[0.6875rem] text-muted">
                    {formatDate(order.created_at, true)} · {order.items.length} items ·{" "}
                    {order.fulfilment_method === "pickup" ? "Pickup" : "Delivery"}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold",
                    orderStatusTone(order.order_status),
                  )}
                >
                  {ORDER_STATUS_LABELS[order.order_status]}
                </span>
                <span className="w-20 text-right text-sm font-semibold tabular">{formatINR(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {latest.address ? (
        <div className="mt-4 rounded-2xl border border-line bg-warm p-4 text-sm text-charcoal/75">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">Last known address</p>
          <p className="mt-1.5">
            {latest.address}
            {latest.locality ? `, ${latest.locality}` : ""}
            {latest.pin_code ? ` — ${latest.pin_code}` : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
