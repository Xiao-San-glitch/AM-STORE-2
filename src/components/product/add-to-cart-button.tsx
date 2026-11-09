"use client";

import { useState } from "react";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/lib/types";

type Props = {
  line: Omit<CartLine, "key" | "quantity">;
  className?: string;
  label?: string;
  compact?: boolean;
  quantity?: number;
};

export function AddToCartButton({ line, className, label = "Add to cart", compact = false, quantity = 1 }: Props) {
  const { add } = useCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const disabled = line.stock <= 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        const result = add(line, quantity);
        toast(result.message, result.added ? "success" : "error");
        if (result.added) {
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 1400);
        }
      }}
      className={cn(
        "group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all",
        compact ? "px-3.5 py-2 text-xs" : "px-5 py-2.5 text-sm",
        disabled
          ? "cursor-not-allowed bg-sand text-muted"
          : justAdded
            ? "bg-ink text-gold"
            : "bg-ink text-white hover:bg-charcoal active:scale-[0.98]",
        className,
      )}
      aria-label={disabled ? `${line.name} is out of stock` : `${label}: ${line.name}`}
    >
      {disabled ? (
        "Out of stock"
      ) : justAdded ? (
        <>
          <Check className="size-4" /> Added
        </>
      ) : (
        <>
          {compact ? <Plus className="size-3.5" /> : <ShoppingBag className="size-4" />}
          {label}
        </>
      )}
    </button>
  );
}
