"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";
import { fromPaise, toPaise } from "@/lib/utils";

const STORAGE_KEY = "am-store-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "key" | "quantity">, quantity?: number) => { added: boolean; message: string };
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  maxFor: (key: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(productId: string, variantId: string | null) {
  return `${productId}::${variantId ?? "base"}`;
}

function sanitise(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((line): line is CartLine => Boolean(line && typeof line === "object"))
    .map((line) => ({
      ...line,
      quantity: Math.max(1, Math.min(99, Math.trunc(Number(line.quantity) || 1))),
      stock: Math.max(0, Math.trunc(Number(line.stock) || 0)),
      price: Number(line.price) || 0,
    }))
    .filter((line) => line.key && line.productId && line.stock > 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(sanitise(JSON.parse(raw)));
    } catch {
      // ignore corrupted storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage may be full or blocked
    }
  }, [lines, ready]);

  const add = useCallback<CartContextValue["add"]>((input, quantity = 1) => {
    const key = lineKey(input.productId, input.variantId);
    let message = `${input.name} added to cart`;
    let added = true;

    setLines((current) => {
      const existing = current.find((line) => line.key === key);
      const stock = input.stock;
      if (stock <= 0) {
        added = false;
        message = `${input.name} is out of stock`;
        return current;
      }
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, stock, 99);
        if (nextQuantity === existing.quantity) {
          added = false;
          message = `Only ${stock} in stock for ${input.name}`;
          return current;
        }
        message = `${input.name} quantity updated`;
        return current.map((line) =>
          line.key === key ? { ...line, quantity: nextQuantity, price: input.price, stock } : line,
        );
      }
      const nextQuantity = Math.min(quantity, stock, 99);
      if (nextQuantity <= 0) {
        added = false;
        message = `${input.name} is out of stock`;
        return current;
      }
      return [...current, { ...input, key, quantity: nextQuantity }];
    });

    return { added, message };
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((key, quantity) => {
    setLines((current) =>
      current
        .map((line) =>
          line.key === key
            ? { ...line, quantity: Math.max(0, Math.min(Math.trunc(quantity) || 0, line.stock, 99)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    let paise = 0;
    let count = 0;
    for (const line of lines) {
      paise += toPaise(line.price) * line.quantity;
      count += line.quantity;
    }
    return {
      lines,
      ready,
      count,
      subtotal: fromPaise(paise),
      add,
      setQuantity,
      remove,
      clear,
      maxFor: (key: string) => lines.find((line) => line.key === key)?.stock ?? 0,
    };
  }, [lines, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
