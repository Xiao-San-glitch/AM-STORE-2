import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Pencil, Plus, Search } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { listCategories, listProducts } from "@/lib/db";
import { removeProduct } from "@/app/admin/actions";
import { cn, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const PER_PAGE = 20;

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";
  const category = first(params.category) ?? "";
  const page = Math.max(1, Number(first(params.page)) || 1);
  const saved = first(params.saved) === "1";
  const deleted = first(params.deleted) === "1";
  const error = first(params.error);

  const [categories, result] = await Promise.all([
    listCategories(true).catch(() => []),
    listProducts({
      q,
      category: category || undefined,
      page,
      perPage: PER_PAGE,
      includeInactive: true,
      sort: "newest",
    }).catch(() => ({ products: [], total: 0, page, perPage: PER_PAGE })),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PER_PAGE));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-2 text-2xl sm:text-3xl">Products</h1>
          <p className="mt-1.5 text-sm text-muted">
            {result.total} {result.total === 1 ? "product" : "products"} · update price, stock and visibility
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-dark btn-sm">
          <Plus className="size-3.5" /> Add product
        </Link>
      </div>

      {saved ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" /> Product saved.
        </p>
      ) : null}
      {deleted ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-charcoal">
          <CheckCircle2 className="size-4 text-success" /> Product deleted.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      ) : null}

      <form method="get" className="mt-5 flex flex-wrap items-end gap-2.5 rounded-2xl border border-line bg-white p-3.5">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products"
            aria-label="Search products"
            className="input pl-10"
          />
        </div>
        <select name="category" defaultValue={category} aria-label="Filter by category" className="select w-auto min-w-44">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-dark btn-sm">
          Filter
        </button>
        {q || category ? (
          <Link href="/admin/products" className="btn btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
        {result.products.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">
            No products found. Try clearing the filters or add a new product.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-warm text-[0.625rem] tracking-[0.14em] text-muted uppercase">
                  <th className="px-4 py-2.5 font-semibold">Product</th>
                  <th className="px-3 py-2.5 font-semibold">Category</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Stock</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-warm/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-[#F6F1E7]">
                          <img
                            src={product.image_url || "/products/basmati-rice.jpg"}
                            alt=""
                            className="size-full object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">{product.name}</span>
                          <span className="block text-[0.6875rem] text-muted">{product.unit}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-charcoal/70">{product.category_name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular">{formatINR(product.price)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={cn(
                          "tabular",
                          product.stock_quantity === 0
                            ? "font-semibold text-danger"
                            : product.stock_quantity <= 5
                              ? "font-semibold text-amber-700"
                              : "text-charcoal",
                        )}
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.625rem] font-semibold",
                          product.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600",
                        )}
                      >
                        {product.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[0.6875rem] font-medium text-charcoal transition hover:border-gold"
                        >
                          <Pencil className="size-3" /> Edit
                        </Link>
                        <form action={removeProduct}>
                          <input type="hidden" name="id" value={product.id} />
                          <ConfirmSubmit
                            message={`Delete ${product.name}? This cannot be undone.`}
                            className="rounded-lg border border-line px-2 py-1 text-[0.6875rem] font-medium text-muted transition hover:border-rose-300 hover:text-danger"
                          >
                            Delete
                          </ConfirmSubmit>
                        </form>
                      </div>
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
            const query = new URLSearchParams();
            if (q) query.set("q", q);
            if (category) query.set("category", category);
            query.set("page", String(target));
            return (
              <Link
                key={target}
                href={`/admin/products?${query.toString()}`}
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
