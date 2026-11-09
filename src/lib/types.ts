export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  variant_name: string;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  sku: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  category_name?: string | null;
  category_slug?: string | null;
  brand: string | null;
  sku: string | null;
  image_url: string | null;
  additional_images: string[];
  price: number;
  original_price: number | null;
  stock_quantity: number;
  unit: string;
  featured: boolean;
  best_seller: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
};

export type StoreSettings = {
  store_name: string;
  logo_url: string | null;
  tagline: string;
  address: string;
  pin_code: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  delivery_charge: number;
  free_delivery_threshold: number;
  min_order_amount: number;
  opening_hours: string;
  announcement: string;
  hero_heading: string;
  hero_subheading: string;
  hero_image: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_whatsapp: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  delivery_areas: string;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type PaymentMethod = "cod" | "pickup" | "online";
export type FulfilmentMethod = "delivery" | "pickup";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  variant_name: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type Order = {
  id: string;
  order_number: string;
  public_token: string;
  customer_id: string | null;
  customer_account_id?: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  locality: string;
  pin_code: string;
  notes: string | null;
  fulfilment_method: FulfilmentMethod;
  payment_method: PaymentMethod;
  payment_status: string;
  order_status: OrderStatus;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  created_at: string;
  items: OrderItem[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  locality: string | null;
  created_at: string;
};

export type CustomerWithStats = Customer & {
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};

export type DashboardStats = {
  total_orders: number;
  todays_orders: number;
  pending_orders: number;
  total_products: number;
  low_stock_products: number;
  total_sales: number;
  recent_orders: Order[];
  low_stock_list: { id: string; name: string; stock_quantity: number; unit: string }[];
};

export type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string | null;
  unit: string;
  variantName: string | null;
  price: number;
  originalPrice: number | null;
  quantity: number;
  stock: number;
};

export type ProductQuery = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
  featured?: boolean;
  bestSeller?: boolean;
  inStock?: boolean;
  page?: number;
  perPage?: number;
  includeInactive?: boolean;
};

export type ProductListResult = {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
};

export type CreateOrderInput = {
  customer_name: string;
  phone: string;
  email?: string | null;
  address: string;
  locality: string;
  pin_code: string;
  notes?: string | null;
  fulfilment_method: FulfilmentMethod;
  payment_method: PaymentMethod;
  idempotency_key: string;
  items: { product_id: string; variant_id?: string | null; quantity: number }[];
  /** Optional link to a logged‑in customer account */
  customer_account_id?: string | null;
};

export type OrderRecord = {
  order: Order;
  whatsapp_url: string;
};

export type ProductInput = {
  name: string;
  slug?: string;
  description?: string | null;
  category_id: string;
  brand?: string | null;
  sku?: string | null;
  image_url?: string | null;
  additional_images?: string[];
  price: number;
  original_price?: number | null;
  stock_quantity: number;
  unit: string;
  featured?: boolean;
  best_seller?: boolean;
  active?: boolean;
  variants?: {
    id?: string;
    variant_name: string;
    price: number;
    original_price?: number | null;
    stock_quantity: number;
    sku?: string | null;
  }[];
};

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  active?: boolean;
  sort_order?: number;
};

/**
 * Customer account for authentication.
 */
export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  created_at: string;
};

/**
 * Saved address associated with a customer account.
 */
export type SavedAddress = {
  id: string;
  customer_account_id: string;
  label: string; // e.g. "Home", "Office"
  address: string;
  locality: string;
  pin_code: string;
  is_default: boolean;
  created_at: string;
};
