"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";
import type { StoreSettings } from "@/lib/types";

export function ContactForm({ settings }: { settings: StoreSettings }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const href = buildWhatsAppContactUrl(
    settings,
    `Hello ${settings.store_name},${name.trim() ? ` this is ${name.trim()}.` : ""} ${message.trim() || "I have a question about an order."}`,
  );

  return (
    <form
      className="rounded-2xl border border-line bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      <h2 className="text-lg">Message the store</h2>
      <p className="mt-1 text-xs text-muted">
        This opens WhatsApp with your message ready to send — the fastest way to reach the counter.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="contact-name" className="label">
            Your name
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="label">
            Message
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            maxLength={600}
            className="textarea"
            placeholder="Ask about stock, delivery timing, or an existing order…"
          />
        </div>
      </div>

      <button type="submit" className="btn btn-gold mt-4 w-full">
        <Send className="size-4" /> Send on WhatsApp
      </button>
    </form>
  );
}
