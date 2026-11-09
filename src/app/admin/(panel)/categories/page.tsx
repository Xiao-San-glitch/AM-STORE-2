import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Pencil, Plus } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { removeCategory, saveCategory } from "@/app/admin/actions";
import { listCategories } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Categories" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCategoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const editId = first(params.edit);
  const saved = first(params.saved) === "1";
  const deleted = first(params.deleted) === "1";
  const error = first(params.error);

  const categories = await listCategories(true).catch(() => []);
  const editing = editId ? categories.find((category) => category.id === editId) : undefined;

  return (
    <div>
      <div>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-2 text-2xl sm:text-3xl">Categories</h1>
        <p className="mt-1.5 text-sm text-muted">Aisles shown in navigation, the homepage and the category page.</p>
      </div>

      {saved ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" /> Category saved.
        </p>
      ) : null}
      {deleted ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-charcoal">
          <CheckCircle2 className="size-4 text-success" /> Category deleted.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">{error}</p>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.4fr] xl:items-start">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-base">{editing ? "Edit category" : "Add a category"}</h2>

          <form action={saveCategory} className="mt-4 space-y-3.5">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

            <div>
              <label htmlFor="name" className="label">
                Name *
              </label>
              <input id="name" name="name" required defaultValue={editing?.name} className="input" placeholder="Rice" />
            </div>
            <div>
              <label htmlFor="slug" className="label">
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                defaultValue={editing?.slug}
                className="input"
                placeholder="rice"
              />
            </div>
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={editing?.description ?? ""}
                className="textarea"
                placeholder="Short line shown on category cards."
              />
            </div>
            <div>
              <label htmlFor="image_url" className="label">
                Image URL
              </label>
              <input
                id="image_url"
                name="image_url"
                defaultValue={editing?.image_url ?? ""}
                className="input"
                placeholder="/products/basmati-rice.jpg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sort_order" className="label">
                  Sort order
                </label>
                <input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={editing?.sort_order ?? 0}
                  className="input"
                />
              </div>
              <label className="mt-6 flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editing ? editing.active : true}
                  className="size-4 accent-[#D4AF37]"
                />
                Visible
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn btn-dark flex-1 btn-sm">
                {editing ? "Save category" : "Add category"}
              </button>
              {editing ? (
                <Link href="/admin/categories" className="btn btn-outline btn-sm">
                  Cancel
                </Link>
              ) : null}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <h2 className="text-base">All categories</h2>
            <span className="text-[0.6875rem] text-muted">{categories.length} total</span>
          </header>

          <ul className="divide-y divide-line">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                <span className="size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-[#F6F1E7]">
                  <img
                    src={category.image_url || "/products/basmati-rice.jpg"}
                    alt=""
                    className="size-full object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{category.name}</span>
                  <span className="block text-[0.6875rem] text-muted">
                    /{category.slug} · order {category.sort_order}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.625rem] font-semibold",
                    category.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600",
                  )}
                >
                  {category.active ? "Visible" : "Hidden"}
                </span>
                <Link
                  href={`/admin/categories?edit=${category.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[0.6875rem] font-medium text-charcoal transition hover:border-gold"
                >
                  <Pencil className="size-3" /> Edit
                </Link>
                <form action={removeCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <ConfirmSubmit
                    message={`Delete ${category.name}? Categories with products cannot be deleted.`}
                    className="rounded-lg border border-line px-2 py-1 text-[0.6875rem] font-medium text-muted transition hover:border-rose-300 hover:text-danger"
                  >
                    Delete
                  </ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-4 py-3">
            <Link href="/admin/categories" className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep">
              <Plus className="size-3.5" /> Add another category
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
