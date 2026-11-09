import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { FilterForm } from "@/components/shop/filter-form";
import { ProductGrid } from "@/components/product/product-grid";
import { listCategories, listProducts } from "@/lib/db";
import type { ProductQuery } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop all groceries",
  description:
    "Browse rice, dal and pulses, cooking oils, spices, snacks and household essentials available at AM STORE, Longleng.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PER_PAGE = 12;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q)?.trim() || "";
  const category = first(params.category) || "";
  const min = first(params.min);
  const max = first(params.max);
  const sortParam = first(params.sort) || "newest";
  const best = first(params.best) === "1";
  const stock = first(params.stock) === "1";
  const pageParam = Number(first(params.page) || "1");

  const sortOptions = ["newest", "price-asc", "price-desc", "name-asc", "name-desc"] as const;
  const sort: NonNullable<ProductQuery["sort"]> = (sortOptions as readonly string[]).includes(sortParam)
    ? (sortParam as NonNullable<ProductQuery["sort"]>)
    : "newest";

  const [categories, result] = await Promise.all([
    listCategories().catch(() => []),
    listProducts({
      q: q || undefined,
      category: category || undefined,
      minPrice: toNumber(min),
      maxPrice: toNumber(max),
      sort,
      bestSeller: best,
      inStock: stock,
      page: Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1,
      perPage: PER_PAGE,
    }).catch(() => ({ products: [], total: 0, page: 1, perPage: PER_PAGE })),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PER_PAGE));
  const currentPage = Math.min(Math.max(1, result.page), totalPages);
  const activeCategory = categories.find((item) => item.slug === category);
  const heading = activeCategory?.name ?? (q ? `Results for “${q}”` : "All products");

  const pageHref = (page: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (min) next.set("min", min);
    if (max) next.set("max", max);
    if (sort !== "newest") next.set("sort", sort);
    if (best) next.set("best", "1");
    if (stock) next.set("stock", "1");
    if (page > 1) next.set("page", String(page));
    const query = next.toString();
    return query ? `/shop?${query}` : "/shop";
  };

  return (
    <div className="shell py-10 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-charcoal">Shop</span>
      </nav>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">The shelf</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{heading}</h1>
          <p className="mt-2 text-sm text-muted">
            {result.total} {result.total === 1 ? "product" : "products"}
            {activeCategory ? ` in ${activeCategory.name}` : ""} · prices in Indian Rupees
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
        <aside>
          <details className="rounded-2xl border border-line bg-white p-4 lg:hidden" open={false}>
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
              <SlidersHorizontal className="size-4" /> Filters &amp; sorting
            </summary>
            <div className="mt-4 border-t border-line pt-4">
              <FilterForm
                categories={categories}
                values={{ q, category, min, max, sort, best: best ? "1" : "", stock: stock ? "1" : "" }}
              />
            </div>
          </details>

          <div className="hidden rounded-2xl border border-line bg-white p-5 lg:block lg:sticky lg:top-28">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <SlidersHorizontal className="size-4 text-gold-deep" /> Filters
            </h2>
            <div className="mt-4">
              <FilterForm
                categories={categories}
                values={{ q, category, min, max, sort, best: best ? "1" : "", stock: stock ? "1" : "" }}
              />
            </div>
          </div>
        </aside>

        <div>
          <ProductGrid
            products={result.products}
            emptyTitle="No products match these filters"
            emptyMessage="Try a different search term, widen the price range, or reset the filters."
          />

          {totalPages > 1 ? (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
              {currentPage > 1 ? (
                <Link href={pageHref(currentPage - 1)} className="btn btn-outline btn-sm">
                  Previous
                </Link>
              ) : null}
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                  return page === 2 || page === totalPages - 1 ? (
                    <span key={page} className="px-1 text-muted">
                      …
                    </span>
                  ) : null;
                }
                return (
                  <Link
                    key={page}
                    href={pageHref(page)}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={
                      page === currentPage
                        ? "inline-flex size-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white"
                        : "inline-flex size-9 items-center justify-center rounded-full border border-line bg-white text-sm text-charcoal transition hover:border-gold"
                    }
                  >
                    {page}
                  </Link>
                );
              })}
              {currentPage < totalPages ? (
                <Link href={pageHref(currentPage + 1)} className="btn btn-outline btn-sm">
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
