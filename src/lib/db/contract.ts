import type {
  Category,
  CategoryInput,
  CreateOrderInput,
  CustomerAccount,
  CustomerWithStats,
  DashboardStats,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  ProductListResult,
  ProductQuery,
  SavedAddress,
  StoreSettings,
} from "../types";

export type OrderQuery = {
  status?: OrderStatus | "all";
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
};

/**
 * The single data-access contract used by the application.
 *
 * Two implementations satisfy it:
 *  - `supabase.ts`   -> production (Supabase Postgres + RLS + RPC)
 *  - `local.ts`      -> local development (on-disk SQLite, real persistence)
 *
 * The active implementation is chosen in `index.ts` based on environment.
 */
export interface Db {
  readonly mode: "supabase" | "local";

  getSettings(): Promise<StoreSettings>;
  updateSettings(patch: Partial<StoreSettings>): Promise<StoreSettings>;

  listCategories(includeInactive?: boolean): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  createCategory(input: CategoryInput): Promise<Category>;
  updateCategory(id: string, input: CategoryInput): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  listProducts(query?: ProductQuery): Promise<ProductListResult>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  relatedProducts(categoryId: string, excludeId: string, limit?: number): Promise<Product[]>;
  createProduct(input: ProductInput): Promise<Product>;
  updateProduct(id: string, input: ProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrderByToken(token: string): Promise<Order | null>;
  getOrderById(id: string): Promise<Order | null>;
  listOrders(query?: OrderQuery): Promise<{ orders: Order[]; total: number }>;
  updateOrderStatus(id: string, status: OrderStatus, paymentStatus?: string): Promise<void>;

  listCustomers(q?: string): Promise<CustomerWithStats[]>;
  listCustomerOrders(customerId: string): Promise<Order[]>;

  /** Customer account helpers */
  getCustomerAccountByEmail(email: string): Promise<CustomerAccount | null>;
  getCustomerAccountById(id: string): Promise<CustomerAccount | null>;
  /** Saved address helpers */
  listSavedAddresses(customerId: string): Promise<SavedAddress[]>;
  createSavedAddress(input: {
    customerId: string;
    label: string;
    address: string;
    locality: string;
    pin_code: string;
    is_default?: boolean;
  }): Promise<SavedAddress>;
  updateSavedAddress(id: string, input: Partial<Omit<SavedAddress, "id" | "customer_account_id">>): Promise<SavedAddress>;
  deleteSavedAddress(id: string): Promise<void>;

  /** Order helpers */
  listOrdersByAccount(customerId: string): Promise<Order[]>;

  dashboardStats(): Promise<DashboardStats>;

  verifyAdmin(email: string, password: string): Promise<{ email: string; role: string } | null>;
  isAdminEmail(email: string): Promise<boolean>;
}
