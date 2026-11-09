import type { Order, StoreSettings } from "./types";
import { ORDER_STATUS_LABELS } from "./types";
import { formatINR } from "./utils";

type WhatsAppSettings = Pick<StoreSettings, "store_name" | "whatsapp" | "phone">;

/** Store WhatsApp number in wa.me format (country code, digits only). */
export function whatsAppNumber(settings: WhatsAppSettings) {
  const digits = (settings.whatsapp || settings.phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function chatUrl(settings: WhatsAppSettings, message: string) {
  return `https://wa.me/${whatsAppNumber(settings)}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a WhatsApp click-to-chat link containing the full order details.
 * The order is always persisted before this link is generated; opening
 * WhatsApp is optional and supplementary.
 */
export function buildWhatsAppOrderUrl(order: Order, settings: StoreSettings) {
  const lines: string[] = [];

  lines.push(`*New order — ${order.order_number}*`);
  lines.push("");
  lines.push(`Customer: ${order.customer_name}`);
  lines.push(`Phone: ${order.phone}`);
  if (order.email) lines.push(`Email: ${order.email}`);
  lines.push(
    order.fulfilment_method === "pickup"
      ? "Fulfilment: Store pickup"
      : `Delivery address: ${order.address}, ${order.locality} — ${order.pin_code}`,
  );
  if (order.notes) lines.push(`Notes: ${order.notes}`);
  lines.push("");
  lines.push("Items:");
  for (const item of order.items) {
    lines.push(`• ${item.product_name} (${item.unit ?? item.variant_name ?? "each"}) x${item.quantity} — ${formatINR(item.total_price)}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${formatINR(order.subtotal)}`);
  if (order.delivery_charge > 0) lines.push(`Delivery: ${formatINR(order.delivery_charge)}`);
  if (order.discount > 0) lines.push(`Discount: -${formatINR(order.discount)}`);
  lines.push(`*Total: ${formatINR(order.total)}*`);
  lines.push(
    `Payment: ${
      order.payment_method === "cod"
        ? "Cash on delivery"
        : order.payment_method === "pickup"
          ? "Pay at store"
          : "Online payment"
    }`,
  );

  return chatUrl(settings, lines.join("\n"));
}

/**
 * Customer-side link for asking about an existing order — a missing item,
 * wrong item, delivery delay or any other problem. The order number and
 * phone are pre-filled so the store can look it up immediately.
 */
export function buildOrderSupportUrl(order: Order, settings: StoreSettings, topic: "issue" | "question" = "issue") {
  const intro =
    topic === "issue"
      ? `Hi ${settings.store_name}, I need help with my order ${order.order_number}.`
      : `Hi ${settings.store_name}, I have a question about my order ${order.order_number}.`;

  const lines = [
    intro,
    "",
    `Name: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Order: ${order.order_number} · ${formatINR(order.total)} · ${ORDER_STATUS_LABELS[order.order_status]}`,
    "",
    topic === "issue" ? "Issue: " : "My question: ",
  ];

  return chatUrl(settings, lines.join("\n"));
}

/** Customer-side link for asking about a specific product before buying. */
export function buildProductEnquiryUrl(settings: StoreSettings, productName: string) {
  const lines = [
    `Hi ${settings.store_name}, I would like to ask about this item:`,
    "",
    `Product: ${productName}`,
    "",
    "My question: ",
  ];
  return chatUrl(settings, lines.join("\n"));
}

/** Generic support link: "text us about anything". */
export function buildWhatsAppContactUrl(settings: WhatsAppSettings, message: string) {
  return chatUrl(settings, message);
}

/**
 * Store-side link that opens a chat with the customer's number, so the shop
 * can reply to an order query directly from the admin dashboard.
 */
export function buildCustomerWhatsAppUrl(order: Order, settings: StoreSettings) {
  const digits = order.phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits;
  const lines = [
    `Hi ${order.customer_name}, this is ${settings.store_name}.`,
    "",
    `About your order ${order.order_number} (${ORDER_STATUS_LABELS[order.order_status]}):`,
  ];
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}
