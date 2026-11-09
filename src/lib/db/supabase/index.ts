import type { Db } from "../contract";
import * as catalog from "./catalog";
import * as orders from "./orders";
import { createSupabaseServerClient } from "../../supabase/server";

export const supabaseDb: Db = {
  mode: "supabase",

  getSettings: catalog.getSettings,
  updateSettings: catalog.updateSettings,

  listCategories: catalog.listCategories,
  getCategoryBySlug: catalog.getCategoryBySlug,
  createCategory: catalog.createCategory,
  updateCategory: catalog.updateCategory,
  deleteCategory: catalog.deleteCategory,

  listProducts: catalog.listProducts,
  getProductBySlug: catalog.getProductBySlug,
  getProductById: catalog.getProductById,
  relatedProducts: catalog.relatedProducts,
  createProduct: catalog.createProduct,
  updateProduct: catalog.updateProduct,
  deleteProduct: catalog.deleteProduct,

  createOrder: orders.createOrder,
  getOrderByToken: orders.getOrderByToken,
  getOrderById: orders.getOrderById,
  listOrders: orders.listOrders,
  updateOrderStatus: async (id, status, paymentStatus) => {
    await orders.updateOrderStatus(id, status);
    if (paymentStatus) {
      const supabase = await createSupabaseServerClient();
      await supabase.from("orders").update({ payment_status: paymentStatus }).eq("id", id);
    }
  },

  listCustomers: orders.listCustomers,
  listCustomerOrders: orders.listCustomerOrders,
  dashboardStats: orders.dashboardStats,

  // Password verification for Supabase mode happens through Supabase Auth
  // (see src/lib/auth.ts); these helpers only expose the admin allow-list.
  verifyAdmin: async () => null,
  isAdminEmail: async (email) => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("admins")
      .select("id")
      .ilike("email", email.trim())
      .maybeSingle();
    return Boolean(data);
  },

  // Customer account stubs – Supabase mode would use Supabase Auth + tables.
  // These are here so the Db interface is satisfied.
  getCustomerAccountByEmail: async () => null,
  getCustomerAccountById: async () => null,
  listSavedAddresses: async () => [],
  createSavedAddress: async () => { throw new Error("Not implemented in Supabase mode"); },
  updateSavedAddress: async () => { throw new Error("Not implemented in Supabase mode"); },
  deleteSavedAddress: async () => { throw new Error("Not implemented in Supabase mode"); },
  listOrdersByAccount: async () => [],
};
