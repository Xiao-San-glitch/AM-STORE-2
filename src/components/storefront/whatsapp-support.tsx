import { MessageCircle } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";

type Props = {
  settings: Pick<StoreSettings, "store_name" | "whatsapp" | "phone">;
};


/**
 * Always-visible WhatsApp entry point. Customers can text the shop about a
 * product, a purchase or a problem with an order without hunting for a number.
 */
export function WhatsAppSupport({ settings }: Props) {
  const url = buildWhatsAppContactUrl(settings, `Hi ${settings.store_name}, I have a question.`);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${settings.store_name} on WhatsApp`}
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full border border-line bg-white/95 py-2.5 pr-4 pl-3 text-sm font-semibold text-ink shadow-[0_10px_30px_-12px_rgba(17,17,17,0.45)] backdrop-blur transition hover:border-[#25D366] hover:shadow-[0_14px_34px_-12px_rgba(37,211,102,0.55)] sm:right-6 sm:bottom-6 print:hidden"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-[#25D366]/12 text-[#128C4A]">
        <MessageCircle className="size-4" />
      </span>
      <span className="hidden sm:inline">WhatsApp us</span>
      <span className="sm:hidden">Help</span>
    </a>
  );
}
