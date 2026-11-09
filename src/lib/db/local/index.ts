import type { Db } from "../contract";
import type { CustomerAccount, SavedAddress } from "../../types";
import * as catalog from "./catalog";
import * as orders from "./orders";
import { getDb, verifyPassword, hashPassword } from "./client";
import { randomUUID } from "node:crypto";

type AdminRow = { email: string; password_hash: string; role: string };

export const local: Db = {
  mode: "local",

  getSettings: async () => catalog.getSettings(),
  updateSettings: async (patch) => catalog.updateSettings(patch),

  listCategories: async (includeInactive) => catalog.listCategories(includeInactive),
  getCategoryBySlug: async (slug) => catalog.getCategoryBySlug(slug),
  createCategory: async (input) => catalog.createCategory(input),
  updateCategory: async (id, input) => catalog.updateCategory(id, input),
  deleteCategory: async (id) => catalog.deleteCategory(id),

  listProducts: async (query) => catalog.listProducts(query),
  getProductBySlug: async (slug) => catalog.getProductBySlug(slug),
  getProductById: async (id) => catalog.getProductById(id),
  relatedProducts: async (categoryId, excludeId, limit) => catalog.relatedProducts(categoryId, excludeId, limit),
  createProduct: async (input) => catalog.createProduct(input),
  updateProduct: async (id, input) => catalog.updateProduct(id, input),
  deleteProduct: async (id) => catalog.deleteProduct(id),

  createOrder: async (input) => orders.createOrder(input),
  getOrderByToken: async (token) => orders.getOrderByToken(token),
  getOrderById: async (id) => orders.getOrderById(id),
  listOrders: async (query) => orders.listOrders(query),
  updateOrderStatus: async (id, status, paymentStatus) =>
    orders.updateOrderStatus(id, status, paymentStatus),

  listCustomers: async (q) => orders.listCustomers(q),
  listCustomerOrders: async (customerId) => orders.listCustomerOrders(customerId),

  dashboardStats: async () => orders.dashboardStats(),

  verifyAdmin: async (email, password) => {
    const row = getDb()
      .prepare("SELECT email, password_hash, role FROM admins WHERE lower(email) = ?")
      .get(email.trim().toLowerCase()) as AdminRow | undefined;
    if (!row || !verifyPassword(password, row.password_hash)) return null;
    return { email: row.email, role: row.role };
  },

  isAdminEmail: async (email) => {
    const row = getDb().prepare("SELECT id FROM admins WHERE lower(email) = ?").get(email.trim().toLowerCase());
    return Boolean(row);
  },

  /* ── Customer account methods ── */

  getCustomerAccountByEmail: async (email) => {
    const row = getDb()
      .prepare("SELECT id, name, email, phone, password_hash, created_at FROM customer_accounts WHERE lower(email) = ?")
      .get(email.trim().toLowerCase()) as CustomerAccount | undefined;
    return row ?? null;
  },

  getCustomerAccountById: async (id) => {
    const row = getDb()
      .prepare("SELECT id, name, email, phone, password_hash, created_at FROM customer_accounts WHERE id = ?")
      .get(id) as CustomerAccount | undefined;
    return row ?? null;
  },

  /* ── Saved address methods ── */

  listSavedAddresses: async (customerId) => {
    return getDb()
      .prepare("SELECT * FROM saved_addresses WHERE customer_account_id = ? ORDER BY is_default DESC, created_at ASC")
      .all(customerId) as SavedAddress[];
  },

  createSavedAddress: async (input) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const isDefault = input.is_default ? 1 : 0;
    if (isDefault) {
      getDb().prepare("UPDATE saved_addresses SET is_default = 0 WHERE customer_account_id = ?").run(input.customerId);
    }
    getDb()
      .prepare(
        `INSERT INTO saved_addresses (id, customer_account_id, label, address, locality, pin_code, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.customerId, input.label, input.address, input.locality, input.pin_code, isDefault, now);
    return {
      id,
      customer_account_id: input.customerId,
      label: input.label,
      address: input.address,
      locality: input.locality,
      pin_code: input.pin_code,
      is_default: Boolean(isDefault),
      created_at: now,
    };
  },

  updateSavedAddress: async (id, input) => {
    const existing = getDb().prepare("SELECT * FROM saved_addresses WHERE id = ?").get(id) as SavedAddress | undefined;
    if (!existing) throw new Error("Saved address not found");
    const updated = { ...existing, ...input };
    getDb()
      .prepare(
        `UPDATE saved_addresses SET label = ?, address = ?, locality = ?, pin_code = ?, is_default = ? WHERE id = ?`,
      )
      .run(updated.label, updated.address, updated.locality, updated.pin_code, updated.is_default ? 1 : 0, id);
    return { ...updated, is_default: Boolean(updated.is_default) };
  },

  deleteSavedAddress: async (id) => {
    getDb().prepare("DELETE FROM saved_addresses WHERE id = ?").run(id);
  },

  /* ── Order-by-account ── */

  listOrdersByAccount: async (customerId) => {
    return orders.listOrdersByAccount(customerId);
  },
};

