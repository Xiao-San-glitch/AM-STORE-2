import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { defaultSettings, seedCategories, seedProducts } from "../../seed-data";
import type { StoreSettings } from "../../types";

/**
 * Local development database.
 *
 * Used only when Supabase environment variables are absent. It is a *real*
 * persistent SQLite database stored on disk (`.data/am-store.db`), so products,
 * orders, stock levels and customers survive refreshes and restarts. It is not
 * a mock: nothing here simulates successful writes.
 */

export const LOCAL_DB_PATH = resolve(process.cwd(), process.env.LOCAL_DB_PATH || ".data/am-store.db");

function schemaSql() {
  return `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id TEXT NOT NULL,
    brand TEXT,
    sku TEXT,
    image_url TEXT,
    additional_images TEXT NOT NULL DEFAULT '[]',
    price REAL NOT NULL DEFAULT 0,
    original_price REAL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '1 pc',
    featured INTEGER NOT NULL DEFAULT 0,
    best_seller INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    original_price REAL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    locality TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    public_token TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL UNIQUE,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    locality TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    notes TEXT,
    fulfilment_method TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    order_status TEXT NOT NULL DEFAULT 'pending',
    subtotal REAL NOT NULL,
    delivery_charge REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    customer_account_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

  CREATE TABLE IF NOT EXISTS customer_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_customer_accounts_email ON customer_accounts(lower(email));

  CREATE TABLE IF NOT EXISTS saved_addresses (
    id TEXT PRIMARY KEY,
    customer_account_id TEXT NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    address TEXT NOT NULL,
    locality TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_saved_addresses_customer ON saved_addresses(customer_account_id);

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name TEXT NOT NULL,
    product_image TEXT,
    variant_name TEXT,
    unit TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

  CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL
  );
  `;
}

export function hashPassword(password: string) {
  const salt = randomUUID().replace(/-/g, "");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function seed(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  if (row.count > 0) return;

  const now = new Date().toISOString();
  const insertCategory = db.prepare(
    `INSERT INTO categories (id, name, slug, description, image_url, active, sort_order)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
  );
  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, slug, description, category_id, brand, sku, image_url,
       additional_images, price, original_price, stock_quantity, unit, featured, best_seller,
       active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
  );
  const insertVariant = db.prepare(
    `INSERT INTO product_variants (id, product_id, variant_name, price, original_price, stock_quantity, sku)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const categoryIds = new Map<string, string>();
  for (const category of seedCategories) {
    const id = randomUUID();
    categoryIds.set(category.slug, id);
    insertCategory.run(
      id,
      category.name,
      category.slug,
      category.description,
      category.image_url,
      category.sort_order,
    );
  }

  for (const product of seedProducts) {
    const id = randomUUID();
    const categoryId = categoryIds.get(product.categorySlug);
    if (!categoryId) continue;
    insertProduct.run(
      id,
      product.name,
      product.slug,
      product.description,
      categoryId,
      product.brand,
      product.sku,
      product.image_url,
      product.price,
      product.original_price,
      product.stock_quantity,
      product.unit,
      product.featured ? 1 : 0,
      product.best_seller ? 1 : 0,
      now,
      now,
    );
    for (const variant of product.variants) {
      insertVariant.run(
        randomUUID(),
        id,
        variant.variant_name,
        variant.price,
        variant.original_price,
        variant.stock_quantity,
        variant.sku,
      );
    }
  }
}

function bootstrap(db: DatabaseSync) {
  db.exec(schemaSql());
  seed(db);

  const settingsRow = db.prepare("SELECT data FROM store_settings WHERE id = 1").get() as
    | { data: string }
    | undefined;
  if (!settingsRow) {
    db.prepare("INSERT INTO store_settings (id, data) VALUES (1, ?)").run(JSON.stringify(defaultSettings));
  }

  // Optional development admin. In Supabase mode admins live in Supabase Auth.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email) as { id: string } | undefined;
    if (!existing) {
      db.prepare("INSERT INTO admins (id, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)").run(
        randomUUID(),
        email,
        hashPassword(password),
        new Date().toISOString(),
      );
    }
  }
}

const globalRef = globalThis as unknown as { __amStoreDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (globalRef.__amStoreDb) return globalRef.__amStoreDb;
  mkdirSync(dirname(LOCAL_DB_PATH), { recursive: true });
  const db = new DatabaseSync(LOCAL_DB_PATH);
  bootstrap(db);
  globalRef.__amStoreDb = db;
  return db;
}

/** Merge stored settings over the defaults so older rows keep working. */
export function readSettings(): StoreSettings {
  const row = getDb().prepare("SELECT data FROM store_settings WHERE id = 1").get() as { data: string } | undefined;
  if (!row) return { ...defaultSettings };
  try {
    return { ...defaultSettings, ...(JSON.parse(row.data) as Partial<StoreSettings>) };
  } catch {
    return { ...defaultSettings };
  }
}

export function jsonParseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}
