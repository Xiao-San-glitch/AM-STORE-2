"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";

export function OrderActions({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/order/${token}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copyLink} className="btn btn-outline btn-sm">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Link copied" : "Copy order link"}
      </button>
      <button type="button" onClick={() => window.print()} className="btn btn-ghost btn-sm">
        <Printer className="size-3.5" /> Print receipt
      </button>
    </div>
  );
}
