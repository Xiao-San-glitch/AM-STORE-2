import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  TrendingUp,
  Clock3,
} from "lucide-react";
import { dashboardStats } from "@/lib/db";
import { cn, formatDate, formatINR, orderStatusTone } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await dashboardStats();

  const cards = [
    {
      label: "Orders today",
      value: String(stats.todays_orders),
      hint: `${stats.total_orders} all time`,
      Icon: ShoppingBag,
    },
    {
      label: "Pending orders",
      value: String(stats.pending_orders),
      hint: "Awaiting confirmation",
      Icon: Clock3,
      tone: stats.pending_orders > 0 ? "warning" : undefined,
    },
    {
      label: "Total sales",
      value: formatINR(stats.total_sales),
      hint: "Excludes cancelled orders",
      Icon: IndianRupee,
    },
    {
      label: "Products",
      value: String(stats.total_products),
      hint: `${stats.low_stock_products} low on stock`,
      Icon: Package,
      tone: stats.low_stock_products > 0 ? "warning" : undefined,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Good day, here is the store</h1>
          <p className="mt-1.5 text-sm text-muted">Live snapshot of orders, stock and sales.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="btn btn-dark btn-sm">
            <Plus className="size-3.5" /> Add product
          </Link>
          <Link href="/admin/orders" className="btn btn-outline btn-sm">
            All orders <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-gold-soft text-gold-deep",
                )}
              >
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-ink tabular">{value}</p>
            <p className="mt-0.5 text-xs text-muted">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <h2 className="text-base">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-gold-deep hover:underline">
              View all
            </Link>
          </header>

          {stats.recent_orders.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted">No orders yet. Share the shop link to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recent_orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-warm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {order.order_number} · {order.customer_name}
                      </p>
                      <p className="text-[0.6875rem] text-muted">
                        {formatDate(order.created_at, true)} · {order.items.length} items ·{" "}
                        {order.fulfilment_method === "pickup" ? "Pickup" : "Delivery"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink tabular">{formatINR(order.total)}</span>
                    <span
                      className={cn(
                        "hidden rounded-full border px-2 py-0.5 text-[0.625rem] font-semibold sm:inline",
                        orderStatusTone(order.order_status),
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.order_status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white">
          <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <h2 className="text-base">Low stock</h2>
            <Link href="/admin/products" className="text-xs font-semibold text-gold-deep hover:underline">
              Manage
            </Link>
          </header>

          {stats.low_stock_list.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-10 text-sm text-muted">
              <TrendingUp className="size-4 text-success" /> All products are well stocked.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.low_stock_list.map((product) => (
                <li key={product.id} className="flex items-center gap-2 px-4 py-3">
                  <AlertTriangle
                    className={cn("size-4 shrink-0", product.stock_quantity === 0 ? "text-danger" : "text-amber-600")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{product.name}</span>
                    <span className="block text-[0.6875rem] text-muted">{product.unit}</span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tabular",
                      product.stock_quantity === 0 ? "bg-rose-50 text-danger" : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {product.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
