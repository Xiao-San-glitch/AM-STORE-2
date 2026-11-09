import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { listOrders } from "@/lib/db";
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { cn, formatDate, formatINR, orderStatusTone } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const PER_PAGE = 20;

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusParam = first(params.status) ?? "all";
  const status = (ORDER_STATUSES as readonly string[]).includes(statusParam)
    ? (statusParam as OrderStatus)
    : "all";
  const q = first(params.q)?.trim() ?? "";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const result = await listOrders({ status, q, page, perPage: PER_PAGE }).catch(() => ({
    orders: [],
    total: 0,
  }));
  const totalPages = Math.max(1, Math.ceil(result.total / PER_PAGE));

  const buildHref = (next: { status?: string; page?: number }) => {
    const query = new URLSearchParams();
    const nextStatus = next.status ?? status;
    if (nextStatus && nextStatus !== "all") query.set("status", nextStatus);
    if (q) query.set("q", q);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const search = query.toString();
    return `/admin/orders${search ? `?${search}` : ""}`;
  };

  return (
    <div>
      <div>
        <p className="eyebrow">Fulfilment</p>
        <h1 className="mt-2 text-2xl sm:text-3xl">Orders</h1>
        <p className="mt-1.5 text-sm text-muted">
          {result.total} {result.total === 1 ? "order" : "orders"} · confirm, pack and update status
        </p>
      </div>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2.5 rounded-2xl border border-line bg-white p-3.5">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Order number, name or phone"
            aria-label="Search orders"
            className="input pl-10"
          />
        </div>
        <select name="status" defaultValue={status} aria-label="Filter by status" className="select w-auto min-w-40">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {ORDER_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-dark btn-sm">
          Filter
        </button>
        {q || status !== "all" ? (
          <Link href="/admin/orders" className="btn btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {result.orders.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">No orders match this filter yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-warm text-[0.625rem] tracking-[0.14em] text-muted uppercase">
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-3 py-2.5 font-semibold">Customer</th>
                  <th className="px-3 py-2.5 font-semibold">Fulfilment</th>
                  <th className="px-3 py-2.5 font-semibold">Placed</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-warm/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink hover:text-gold-deep">
                        {order.order_number}
                      </Link>
                      <p className="text-[0.6875rem] text-muted">{order.items.length} items</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-charcoal">{order.customer_name}</p>
                      <p className="text-[0.6875rem] text-muted">{order.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-charcoal/70">
                      {order.fulfilment_method === "pickup" ? "Pickup" : "Delivery"}
                      <p className="text-[0.6875rem] text-muted">
                        {order.payment_method === "cod"
                          ? "Cash on delivery"
                          : order.payment_method === "pickup"
                            ? "Pay at store"
                            : "Online"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-charcoal/70">{formatDate(order.created_at, true)}</td>
                    <td className="px-3 py-3 text-right font-medium tabular">{formatINR(order.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold",
                          orderStatusTone(order.order_status),
                        )}
                      >
                        {ORDER_STATUS_LABELS[order.order_status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, index) => {
            const target = index + 1;
            return (
              <Link
                key={target}
                href={buildHref({ page: target })}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full text-xs",
                  target === page ? "bg-ink font-semibold text-white" : "border border-line bg-white",
                )}
              >
                {target}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
