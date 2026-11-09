import { PackageOpen } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  className,
  emptyTitle = "No products yet",
  emptyMessage = "New stock is on its way. Please check back soon.",
}: {
  products: Product[];
  className?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-sand text-gold-deep">
          <PackageOpen className="size-5" />
        </span>
        <h3 className="mt-4 text-lg">{emptyTitle}</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
