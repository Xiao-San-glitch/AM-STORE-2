import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { listCustomers } from "@/lib/db";
import { formatDate, formatINR, formatPhone } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminCustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";

  const customers = await listCustomers(q).catch(() => []);

  return (
    <div>
      <div>
        <p className="eyebrow">Relationships</p>
        <h1 className="mt-2 text-2xl sm:text-3xl">Customers</h1>
        <p className="mt-1.5 text-sm text-muted">
          {customers.length} {customers.length === 1 ? "customer" : "customers"} who have placed an order
        </p>
      </div>

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2.5 rounded-2xl border border-line bg-white p-3.5">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or phone"
            aria-label="Search customers"
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn btn-dark btn-sm">
          Search
        </button>
        {q ? (
          <Link href="/admin/customers" className="btn btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {customers.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">
            No customers yet. They are created automatically with the first order.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-warm text-[0.625rem] tracking-[0.14em] text-muted uppercase">
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-3 py-2.5 font-semibold">Phone</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Orders</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Spent</th>
                  <th className="px-4 py-2.5 font-semibold">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-warm/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-medium text-ink hover:text-gold-deep"
                      >
                        {customer.name || "Unnamed customer"}
                      </Link>
                      {customer.address ? (
                        <p className="truncate text-[0.6875rem] text-muted">{customer.address}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-charcoal/70">{formatPhone(customer.phone)}</td>
                    <td className="px-3 py-3 text-right tabular">{customer.order_count}</td>
                    <td className="px-3 py-3 text-right font-medium tabular">{formatINR(customer.total_spent)}</td>
                    <td className="px-4 py-3 text-xs text-charcoal/70">
                      {customer.last_order_at ? formatDate(customer.last_order_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
