"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { formatINR } from "@/lib/utils";

type VariantDraft = {
  variant_name: string;
  price: string;
  original_price: string;
  stock_quantity: string;
  sku: string;
};

function toDrafts(product?: Product): VariantDraft[] {
  if (!product?.variants?.length) return [];
  return product.variants.map((variant) => ({
    variant_name: variant.variant_name,
    price: String(variant.price),
    original_price: variant.original_price != null ? String(variant.original_price) : "",
    stock_quantity: String(variant.stock_quantity),
    sku: variant.sku ?? "",
  }));
}

export function ProductForm({
  action,
  product,
  categories,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  product?: Product;
  categories: Category[];
  error?: string;
}) {
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>(toDrafts(product));
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setImageError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setImageError(data.error ?? "Upload failed. Try a smaller JPG or PNG.");
        return;
      }
      setImageUrl(data.url);
    } catch {
      setImageError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  const variantsJson = JSON.stringify(
    variants
      .filter((variant) => variant.variant_name.trim())
      .map((variant) => ({
        variant_name: variant.variant_name.trim(),
        price: Number(variant.price) || 0,
        original_price: variant.original_price ? Number(variant.original_price) : null,
        stock_quantity: Math.trunc(Number(variant.stock_quantity) || 0),
        sku: variant.sku.trim() || null,
      })),
  );

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants((current) => current.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  };

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="variants" value={variantsJson} />

      {error ? (
        <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800 lg:col-span-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      ) : null}

      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Product details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Name *
              </label>
              <input id="name" name="name" required defaultValue={product?.name} className="input" placeholder="Premium Rice" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="slug" className="label">
                  URL slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  defaultValue={product?.slug}
                  className="input"
                  placeholder="premium-rice"
                />
                <p className="mt-1 text-[0.6875rem] text-muted">Leave blank to generate from the name.</p>
              </div>
              <div>
                <label htmlFor="brand" className="label">
                  Brand
                </label>
                <input id="brand" name="brand" defaultValue={product?.brand ?? ""} className="input" placeholder="Daawat" />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={product?.description ?? ""}
                className="textarea"
                placeholder="Short description shown on the product page."
              />
            </div>
            <div>
              <label htmlFor="additional_images" className="label">
                Extra images (one URL per line)
              </label>
              <textarea
                id="additional_images"
                name="additional_images"
                rows={2}
                defaultValue={product?.additional_images?.join("\n") ?? ""}
                className="textarea"
                placeholder="/products/premium-rice.jpg"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base">Pack sizes / variants</h2>
              <p className="mt-0.5 text-xs text-muted">
                Optional. When added, customers choose a pack size instead of the base price.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setVariants((current) => [
                  ...current,
                  { variant_name: "", price: "", original_price: "", stock_quantity: "0", sku: "" },
                ])
              }
              className="btn btn-outline btn-sm"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
              No variants — the base price and stock below are used.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {variants.map((variant, index) => (
                <li key={index} className="rounded-xl border border-line p-3">
                  <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr]">
                    <input
                      value={variant.variant_name}
                      onChange={(event) => updateVariant(index, { variant_name: event.target.value })}
                      className="input"
                      placeholder="5 kg"
                      aria-label="Variant name"
                    />
                    <input
                      value={variant.price}
                      onChange={(event) => updateVariant(index, { price: event.target.value })}
                      type="number"
                      min={0}
                      step="0.01"
                      className="input"
                      placeholder="Price ₹"
                      aria-label="Variant price"
                    />
                    <input
                      value={variant.original_price}
                      onChange={(event) => updateVariant(index, { original_price: event.target.value })}
                      type="number"
                      min={0}
                      step="0.01"
                      className="input"
                      placeholder="MRP ₹"
                      aria-label="Variant MRP"
                    />
                    <input
                      value={variant.stock_quantity}
                      onChange={(event) => updateVariant(index, { stock_quantity: event.target.value })}
                      type="number"
                      min={0}
                      className="input"
                      placeholder="Stock"
                      aria-label="Variant stock"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[0.625rem] text-muted">
                      {variant.price ? formatINR(Number(variant.price)) : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVariants((current) => current.filter((_, position) => position !== index))}
                      className="inline-flex items-center gap-1 text-[0.6875rem] text-muted transition hover:text-danger"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Image</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-[#F6F1E7]">
            {imageUrl ? (
              <img src={imageUrl} alt="Product preview" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center gap-2 text-muted">
                <ImagePlus className="size-6" />
                <span className="text-xs">No image selected</span>
              </div>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="btn btn-outline btn-sm flex-1"
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              {uploading ? "Uploading…" : "Upload"}
            </button>
            {imageUrl ? (
              <button type="button" onClick={() => setImageUrl("")} className="btn btn-ghost btn-sm">
                Clear
              </button>
            ) : null}
          </div>
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="input mt-2 text-xs"
            placeholder="…or paste an image URL"
            aria-label="Image URL"
          />
          <p className="mt-1.5 text-[0.625rem] leading-relaxed text-muted">
            JPG, PNG or WebP, up to 6 MB. Images are compressed in the browser before upload.
          </p>
          {imageError ? <p className="mt-2 text-[0.6875rem] text-danger">{imageError}</p> : null}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Price &amp; stock</h2>
          <div className="mt-4 grid gap-3">
            <div>
              <label htmlFor="category_id" className="label">
                Category *
              </label>
              <select
                id="category_id"
                name="category_id"
                required
                defaultValue={product?.category_id ?? ""}
                className="select"
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="price" className="label">
                  Price ₹ *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  defaultValue={product?.price ?? ""}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="original_price" className="label">
                  MRP ₹
                </label>
                <input
                  id="original_price"
                  name="original_price"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={product?.original_price ?? ""}
                  className="input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="stock_quantity" className="label">
                  Stock
                </label>
                <input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  min={0}
                  defaultValue={product?.stock_quantity ?? 0}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="unit" className="label">
                  Unit
                </label>
                <input id="unit" name="unit" defaultValue={product?.unit ?? "1 pc"} className="input" placeholder="1 kg" />
              </div>
            </div>
            <div>
              <label htmlFor="sku" className="label">
                SKU
              </label>
              <input id="sku" name="sku" defaultValue={product?.sku ?? ""} className="input" placeholder="AM-RICE-005" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">Visibility</h2>
          <div className="mt-3 space-y-2.5 text-sm text-charcoal">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product ? product.active : true}
                className="size-4 accent-[#D4AF37]"
              />
              Visible in the shop
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured}
                className="size-4 accent-[#D4AF37]"
              />
              Featured on the homepage
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="best_seller"
                defaultChecked={product?.best_seller}
                className="size-4 accent-[#D4AF37]"
              />
              Best seller badge
            </label>
          </div>
        </section>

        <div className="flex gap-2">
          <button type="submit" className="btn btn-dark flex-1">
            {product ? "Save changes" : "Create product"}
          </button>
          <Link href="/admin/products" className="btn btn-outline">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
