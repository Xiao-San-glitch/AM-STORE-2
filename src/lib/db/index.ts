import type { Db, OrderQuery } from "./contract";

export type { OrderQuery } from "./contract";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let cached: Db | null = null;

async function db(): Promise<Db> {
  if (cached) return cached;
  cached = isSupabaseConfigured()
    ? (await import("./supabase")).supabaseDb
    : (await import("./local")).local;
  return cached;
}

export const dbMode = (): Promise<"supabase" | "local"> => db().then((impl) => impl.mode);

export const getSettings = async () => (await db()).getSettings();
export const updateSettings = async (...args: Parameters<Db["updateSettings"]>) =>
  (await db()).updateSettings(...args);

export const listCategories = async (...args: Parameters<Db["listCategories"]>) =>
  (await db()).listCategories(...args);
export const getCategoryBySlug = async (...args: Parameters<Db["getCategoryBySlug"]>) =>
  (await db()).getCategoryBySlug(...args);
export const createCategory = async (...args: Parameters<Db["createCategory"]>) =>
  (await db()).createCategory(...args);
export const updateCategory = async (...args: Parameters<Db["updateCategory"]>) =>
  (await db()).updateCategory(...args);
export const deleteCategory = async (...args: Parameters<Db["deleteCategory"]>) =>
  (await db()).deleteCategory(...args);

export const listProducts = async (...args: Parameters<Db["listProducts"]>) => (await db()).listProducts(...args);
export const getProductBySlug = async (...args: Parameters<Db["getProductBySlug"]>) =>
  (await db()).getProductBySlug(...args);
export const getProductById = async (...args: Parameters<Db["getProductById"]>) =>
  (await db()).getProductById(...args);
export const relatedProducts = async (...args: Parameters<Db["relatedProducts"]>) =>
  (await db()).relatedProducts(...args);
export const createProduct = async (...args: Parameters<Db["createProduct"]>) => (await db()).createProduct(...args);
export const updateProduct = async (...args: Parameters<Db["updateProduct"]>) =>
  (await db()).updateProduct(...args);
export const deleteProduct = async (...args: Parameters<Db["deleteProduct"]>) =>
  (await db()).deleteProduct(...args);

export const createOrder = async (...args: Parameters<Db["createOrder"]>) => (await db()).createOrder(...args);
export const getOrderByToken = async (...args: Parameters<Db["getOrderByToken"]>) =>
  (await db()).getOrderByToken(...args);
export const getOrderById = async (...args: Parameters<Db["getOrderById"]>) => (await db()).getOrderById(...args);
export const listOrders = async (query?: OrderQuery) => (await db()).listOrders(query);
export const updateOrderStatus = async (...args: Parameters<Db["updateOrderStatus"]>) =>
  (await db()).updateOrderStatus(...args);

export const listCustomers = async (...args: Parameters<Db["listCustomers"]>) => (await db()).listCustomers(...args);
export const listCustomerOrders = async (...args: Parameters<Db["listCustomerOrders"]>) =>
  (await db()).listCustomerOrders(...args);

export const dashboardStats = async () => (await db()).dashboardStats();

export const verifyAdmin = async (...args: Parameters<Db["verifyAdmin"]>) => (await db()).verifyAdmin(...args);
export const isAdminEmail = async (...args: Parameters<Db["isAdminEmail"]>) =>
  (await db()).isAdminEmail(...args);

export const getCustomerAccountByEmail = async (...args: Parameters<Db["getCustomerAccountByEmail"]>) =>
  (await db()).getCustomerAccountByEmail(...args);
export const getCustomerAccountById = async (...args: Parameters<Db["getCustomerAccountById"]>) =>
  (await db()).getCustomerAccountById(...args);
export const listSavedAddresses = async (...args: Parameters<Db["listSavedAddresses"]>) =>
  (await db()).listSavedAddresses(...args);
export const createSavedAddress = async (...args: Parameters<Db["createSavedAddress"]>) =>
  (await db()).createSavedAddress(...args);
export const updateSavedAddress = async (...args: Parameters<Db["updateSavedAddress"]>) =>
  (await db()).updateSavedAddress(...args);
export const deleteSavedAddress = async (...args: Parameters<Db["deleteSavedAddress"]>) =>
  (await db()).deleteSavedAddress(...args);
export const listOrdersByAccount = async (...args: Parameters<Db["listOrdersByAccount"]>) =>
  (await db()).listOrdersByAccount(...args);
