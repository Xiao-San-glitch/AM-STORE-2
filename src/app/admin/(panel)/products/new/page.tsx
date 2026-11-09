import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { saveProduct } from "@/app/admin/actions";
import { listCategories } from "@/lib/db";

export const metadata: Metadata = { title: "Add product" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewProductPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const categories = await listCategories(true).catch(() => []);

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-charcoal uppercase transition hover:text-gold-deep"
      >
        <ArrowLeft className="size-3.5" /> Products
      </Link>
      <h1 className="mt-3 text-2xl sm:text-3xl">Add a product</h1>
      <p className="mt-1.5 text-sm text-muted">Create a new shelf item with pricing, stock and photography.</p>

      <div className="mt-6">
        <ProductForm action={saveProduct} categories={categories} error={error} />
      </div>
    </div>
  );
}
