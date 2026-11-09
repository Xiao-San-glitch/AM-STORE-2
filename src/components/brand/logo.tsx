import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  logoUrl?: string | null;
  href?: string;
  tone?: "light" | "dark";
  withLocation?: boolean;
  className?: string;
};

/**
 * Text-based AM STORE logo. Set `logoUrl` from Admin → Store settings to swap it
 * for an uploaded image without touching any code.
 */
export function Logo({ logoUrl, href = "/", tone = "dark", withLocation = true, className }: LogoProps) {
  const content = logoUrl ? (
    <img src={logoUrl} alt="AM STORE" className="h-10 w-auto max-w-[190px] object-contain" />
  ) : (
    <span className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border",
          tone === "light" ? "border-gold/40 bg-white/5" : "border-ink bg-ink",
        )}
      >
        <ShoppingBag className={cn("size-[18px]", tone === "light" ? "text-gold" : "text-gold")} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-[family-name:var(--font-display)] text-[1.35rem] font-semibold tracking-[0.18em]",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          AM STORE
        </span>
        {withLocation ? (
          <span
            className={cn(
              "mt-1 text-[0.5625rem] font-medium tracking-[0.28em] uppercase",
              tone === "light" ? "text-gold" : "text-gold-deep",
            )}
          >
            Longleng · Nagaland
          </span>
        ) : null}
      </span>
    </span>
  );

  return (
    <Link href={href} aria-label="AM STORE — home" className={cn("inline-flex items-center", className)}>
      {content}
    </Link>
  );
}
