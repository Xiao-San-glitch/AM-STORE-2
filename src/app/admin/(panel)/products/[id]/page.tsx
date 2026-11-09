import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { saveProduct } from "@/app/admin/actions";
import { getProductById, listCategories } from "@/lib/db";

export const metadata: Metadata = { title: "Edit product" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  const [product, categories] = await Promise.all([
    getProductById(id).catch(() => null),
    listCategories(true).catch(() => []),
  ]);
  if (!product) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-charcoal uppercase transition hover:text-gold-deep"
        >
          <ArrowLeft className="size-3.5" /> Products
        </Link>
        <Link href={`/product/${product.slug}`} className="btn btn-ghost btn-sm" target="_blank">
          View on storefront <ExternalLink className="size-3.5" />
        </Link>
      </div>
      <h1 className="mt-3 text-2xl sm:text-3xl">{product.name}</h1>
      <p className="mt-1.5 text-sm text-muted">Update pricing, stock, variants and visibility.</p>

      <div className="mt-6">
        <ProductForm action={saveProduct} product={product} categories={categories} error={error} />
      </div>
    </div>
  );
}
