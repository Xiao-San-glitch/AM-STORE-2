import type { Metadata } from "next";
import { CategoryCard } from "@/components/home/category-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { listCategories, listProducts } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop by category",
  description:
    "Browse every grocery category at AM STORE, Longleng — rice, dal and pulses, cooking oils, spices, snacks and household essentials.",
};

export default async function CategoriesPage() {
  const [categories, allProducts] = await Promise.all([
    listCategories().catch(() => []),
    listProducts({ perPage: 200 }).catch(() => ({ products: [], total: 0, page: 1, perPage: 200 })),
  ]);

  const counts = new Map<string, number>();
  for (const product of allProducts.products) {
    counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  }

  return (
    <div className="shell py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="transition hover:text-gold-deep">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-charcoal">Categories</span>
      </nav>

      <SectionHeading
        className="mt-5"
        eyebrow="Shop by category"
        title="Everyday essentials, neatly sorted"
        description="Six aisles of groceries and household supplies, stocked for Longleng households. Tap a category to see everything available."
      />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <div key={category.id}>
            <CategoryCard category={category} />
            <p className="mt-2 pl-1 text-[0.6875rem] tracking-wide text-muted uppercase">
              {counts.get(category.id) ?? 0} products
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
