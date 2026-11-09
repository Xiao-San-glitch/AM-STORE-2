import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { getCategoryBySlug, listCategories, listProducts } from "@/lib/db";
import type { ProductQuery } from "@/lib/types";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;

const SORTS: { value: NonNullable<ProductQuery["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "name-asc", label: "A–Z" },
];

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description:
      category.description ??
      `Shop ${category.name.toLowerCase()} online from AM STORE, Longleng, Nagaland.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;

  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) notFound();

  const sortParam = (first(query.sort) ?? "newest") as NonNullable<ProductQuery["sort"]>;
  const sort = SORTS.some((option) => option.value === sortParam) ? sortParam : "newest";
  const page = Math.max(1, Number(first(query.page)) || 1);

  const [result, categories] = await Promise.all([
    listProducts({ category: slug, sort, page, perPage: PER_PAGE }).catch(() => ({
      products: [],
      total: 0,
      page,
      perPage: PER_PAGE,
    })),
    listCategories().catch(() => []),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PER_PAGE));
  const pageHref = (target: number) => `/category/${slug}?sort=${sort}&page=${target}`;

  return (
    <div>
      <div className="border-b border-line bg-sand/50">
        <div className="shell py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <Link href="/" className="transition hover:text-gold-deep">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/categories" className="transition hover:text-gold-deep">
              Categories
            </Link>
            <span className="mx-2">/</span>
            <span className="text-charcoal">{category.name}</span>
          </nav>

          <div className="mt-5 grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Category</p>
              <h1 className="mt-2 text-3xl sm:text-4xl">{category.name}</h1>
              {category.description ? (
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-charcoal/70">{category.description}</p>
              ) : null}
              <p className="mt-3 text-xs font-medium tracking-[0.12em] text-muted uppercase">
                {result.total} {result.total === 1 ? "product" : "products"} available
              </p>
            </div>
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="hidden size-32 rounded-2xl border border-line object-cover shadow-[var(--shadow-soft)] sm:block"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="shell py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/categories" className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-charcoal uppercase transition hover:text-gold-deep">
            <ArrowLeft className="size-3.5" /> All categories
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase">Sort</span>
            {SORTS.map((option) => (
              <Link
                key={option.value}
                href={`/category/${slug}?sort=${option.value}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  sort === option.value
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-charcoal hover:border-gold",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <ProductGrid
            products={result.products}
            emptyTitle="This aisle is being restocked"
            emptyMessage="No products in this category right now. Please check back soon or browse the full shop."
          />
        </div>

        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, index) => {
              const target = index + 1;
              return (
                <Link
                  key={target}
                  href={pageHref(target)}
                  aria-current={target === page ? "page" : undefined}
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-full text-sm transition",
                    target === page
                      ? "bg-ink font-semibold text-white"
                      : "border border-line bg-white text-charcoal hover:border-gold",
                  )}
                >
                  {target}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {categories.length > 1 ? (
          <div className="mt-14 rounded-2xl border border-line bg-white p-5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.2em] text-muted uppercase">Keep browsing</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories
                .filter((item) => item.slug !== slug)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/category/${item.slug}`}
                    className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-charcoal transition hover:border-gold hover:text-gold-deep"
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
