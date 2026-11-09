import Link from "next/link";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type Values = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  best?: string;
  stock?: string;
};

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export function FilterForm({ categories, values }: { categories: Category[]; values: Values }) {
  return (
    <form method="get" action="/shop" className="space-y-5">
      <div>
        <label htmlFor="filter-q" className="label">
          Search
        </label>
        <input
          id="filter-q"
          name="q"
          defaultValue={values.q}
          placeholder="Product name or brand"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="filter-category" className="label">
          Category
        </label>
        <select id="filter-category" name="category" defaultValue={values.category ?? ""} className="select">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Price range (₹)</span>
        <div className="flex items-center gap-2">
          <input
            name="min"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={values.min}
            placeholder="Min"
            aria-label="Minimum price"
            className="input"
          />
          <span className="text-muted">—</span>
          <input
            name="max"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={values.max}
            placeholder="Max"
            aria-label="Maximum price"
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="filter-sort" className="label">
          Sort by
        </label>
        <select id="filter-sort" name="sort" defaultValue={values.sort ?? "newest"} className="select">
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2.5 rounded-xl bg-warm p-3.5">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
          <input
            type="checkbox"
            name="best"
            value="1"
            defaultChecked={values.best === "1"}
            className="size-4 rounded border-line accent-[#D4AF37]"
          />
          Best sellers only
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
          <input
            type="checkbox"
            name="stock"
            value="1"
            defaultChecked={values.stock === "1"}
            className="size-4 rounded border-line accent-[#D4AF37]"
          />
          In stock only
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-dark flex-1 btn-sm">
          Apply filters
        </button>
        <Link href="/shop" className={cn("btn btn-outline btn-sm", "flex-1")}>
          Reset
        </Link>
      </div>
    </form>
  );
}
