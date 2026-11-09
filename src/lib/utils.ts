import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format paise-safe Indian currency: 1250 -> "₹1,250" */
export function formatINR(value: number | string | null | undefined, withDecimals = false) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/** All money arithmetic happens in integer paise to avoid float drift. */
export function toPaise(amount: number) {
  return Math.round(Number(amount) * 100);
}

export function fromPaise(paise: number) {
  return Math.round(paise) / 100;
}

export function moneyMath() {
  let paise = 0;
  return {
    add(amount: number) {
      paise += toPaise(amount);
      return this;
    },
    subtract(amount: number) {
      paise -= toPaise(amount);
      return this;
    },
    total() {
      return fromPaise(paise);
    },
  };
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function discountPercent(price: number, originalPrice?: number | null) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

/** Normalise an Indian mobile number to 10 digits, or null if invalid. */
export function normalisePhone(input: string): string | null {
  const digits = String(input).replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (local.length === 10 && /^[6-9]/.test(local)) return local;
  return null;
}

export function formatPhone(input: string) {
  const local = normalisePhone(input);
  if (!local) return input;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

export function orderStatusTone(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "confirmed":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "processing":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "ready_for_pickup":
      return "bg-violet-50 text-violet-800 border-violet-200";
    case "out_for_delivery":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "delivered":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "cancelled":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
}

export function stockLabel(stock: number) {
  if (stock <= 0) return { text: "Out of stock", tone: "text-danger" };
  if (stock <= 5) return { text: `Only ${stock} left`, tone: "text-amber-700" };
  return { text: "In stock", tone: "text-success" };
}
