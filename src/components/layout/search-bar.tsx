"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { formatINR, cn } from "@/lib/utils";

type Suggestion = { id: string; name: string; slug: string; price: number; unit: string; category: string };

export function SearchBar({ className, autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipFetch = useRef(false);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const term = value.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (response.ok) {
          const data = (await response.json()) as { products: Suggestion[] };
          setSuggestions(data.products ?? []);
          setOpen(true);
        }
      } catch {
        // aborted or offline
      } finally {
        setLoading(false);
      }
    }, 240);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  function go(term: string) {
    skipFetch.current = true;
    setOpen(false);
    router.push(term.trim() ? `/shop?q=${encodeURIComponent(term.trim())}` : "/shop");
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(value);
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Search rice, dal, oil…"
          aria-label="Search products"
          className="h-10 w-full rounded-full border border-line bg-white pr-4 pl-10 text-sm text-ink placeholder:text-muted/80 focus:border-gold focus:outline-none focus:ring-[3px] focus:ring-gold/20"
        />
        {loading ? (
          <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted" />
        ) : null}
      </form>

      {open && suggestions.length > 0 ? (
        <div className="absolute top-12 right-0 left-0 z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lift)]">
          <p className="px-4 pt-3 pb-1 text-[0.625rem] font-semibold tracking-[0.18em] text-muted uppercase">
            Suggestions
          </p>
          <ul>
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    skipFetch.current = true;
                    setOpen(false);
                    setValue(item.name);
                    router.push(`/product/${item.slug}`);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-sand/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                    <span className="block text-xs text-muted">
                      {item.category} · {item.unit}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink tabular">{formatINR(item.price)}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => go(value)}
            className="w-full border-t border-line bg-warm px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-gold-deep uppercase hover:bg-sand/60"
          >
            See all results for “{value.trim()}”
          </button>
        </div>
      ) : null}
    </div>
  );
}
