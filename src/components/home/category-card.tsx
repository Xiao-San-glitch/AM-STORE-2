import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="overflow-hidden rounded-xl bg-[#F6F1E7]">
        <img
          src={category.image_url || "/products/basmati-rice.jpg"}
          alt={category.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      </div>
      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[0.9375rem] leading-snug font-semibold text-ink">{category.name}</h3>
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-ink transition group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-[0.6875rem] leading-relaxed text-muted">{category.description}</p>
        <span className="mt-2 text-[0.625rem] font-semibold tracking-[0.16em] text-gold-deep uppercase">
          Explore
        </span>
      </div>
    </Link>
  );
}
