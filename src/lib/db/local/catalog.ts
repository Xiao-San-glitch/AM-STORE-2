import { randomUUID } from "node:crypto";
import type { Category, CategoryInput, Product, ProductInput, ProductListResult, ProductQuery, ProductVariant, StoreSettings } from "../../types";
import { slugify } from "../../utils";
import { getDb, jsonParseArray, readSettings } from "./client";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: number;
  sort_order: number;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  category_name: string | null;
  category_slug: string | null;
  brand: string | null;
  sku: string | null;
  image_url: string | null;
  additional_images: string | null;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  unit: string;
  featured: number;
  best_seller: number;
  active: number;
  created_at: string;
  updated_at: string;
};

type VariantRow = {
  id: string;
  product_id: string;
  variant_name: string;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  sku: string | null;
};

function mapCategory(row: CategoryRow): Category {
  return { ...row, active: Boolean(row.active) };
}

function mapVariant(row: VariantRow): ProductVariant {
  return { ...row };
}

function mapProduct(row: ProductRow, variants: ProductVariant[] = []): Product {
  return {
    ...row,
    additional_images: jsonParseArray(row.additional_images),
    featured: Boolean(row.featured),
    best_seller: Boolean(row.best_seller),
    active: Boolean(row.active),
    variants,
  };
}

export function listCategories(includeInactive = false): Category[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM categories ${includeInactive ? "" : "WHERE active = 1"}
       ORDER BY sort_order ASC, name ASC`,
    )
    .all() as unknown as CategoryRow[];
  return rows.map(mapCategory);
}

export function getCategoryBySlug(slug: string): Category | null {
  const row = getDb().prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as CategoryRow | undefined;
  return row ? mapCategory(row) : null;
}

function uniqueSlug(table: "products" | "categories", base: string, excludeId?: string) {
  const db = getDb();
  let candidate = base || randomUUID().slice(0, 8);
  let suffix = 2;
  while (true) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id <> ?`).get(candidate, excludeId)
      : db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate);
    if (!row) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export function createCategory(input: CategoryInput): Category {
  const db = getDb();
  const slug = uniqueSlug("categories", input.slug ? slugify(input.slug) : slugify(input.name));
  const id = randomUUID();
  db.prepare(
    `INSERT INTO categories (id, name, slug, description, image_url, active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.name.trim(),
    slug,
    input.description ?? null,
    input.image_url ?? null,
    input.active === false ? 0 : 1,
    input.sort_order ?? 99,
  );
  return mapCategory(db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as CategoryRow);
}

export function updateCategory(id: string, input: CategoryInput): Category {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as CategoryRow | undefined;
  if (!existing) throw new Error("Category not found");
  const slug = uniqueSlug("categories", input.slug ? slugify(input.slug) : slugify(input.name), id);
  db.prepare(
    `UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, active = ?, sort_order = ? WHERE id = ?`,
  ).run(
    input.name.trim(),
    slug,
    input.description ?? null,
    input.image_url ?? null,
    input.active === false ? 0 : 1,
    input.sort_order ?? existing.sort_order,
    id,
  );
  return mapCategory(db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as CategoryRow);
}

export function deleteCategory(id: string) {
  const db = getDb();
  const used = db.prepare("SELECT COUNT(*) AS count FROM products WHERE category_id = ?").get(id) as { count: number };
  if (used.count > 0) {
    throw new Error("Move or delete the products in this category before deleting it.");
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
}

function variantsFor(productIds: string[]): Map<string, ProductVariant[]> {
  const map = new Map<string, ProductVariant[]>();
  if (productIds.length === 0) return map;
  const placeholders = productIds.map(() => "?").join(",");
  const rows = getDb()
    .prepare(`SELECT * FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY price ASC`)
    .all(...productIds) as unknown as VariantRow[];
  for (const row of rows) {
    const list = map.get(row.product_id) ?? [];
    list.push(mapVariant(row));
    map.set(row.product_id, list);
  }
  return map;
}

export function listProducts(query: ProductQuery = {}): ProductListResult {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (!query.includeInactive) where.push("p.active = 1");
  if (query.category) {
    where.push("c.slug = ?");
    params.push(query.category);
  }
  if (query.q) {
    where.push("(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)");
    const like = `%${query.q.trim()}%`;
    params.push(like, like, like, like);
  }
  if (typeof query.minPrice === "number") {
    where.push("p.price >= ?");
    params.push(query.minPrice);
  }
  if (typeof query.maxPrice === "number") {
    where.push("p.price <= ?");
    params.push(query.maxPrice);
  }
  if (query.featured) where.push("p.featured = 1");
  if (query.bestSeller) where.push("p.best_seller = 1");
  if (query.inStock) where.push("p.stock_quantity > 0");

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const orderSql = (() => {
    switch (query.sort) {
      case "price-asc":
        return "ORDER BY p.price ASC";
      case "price-desc":
        return "ORDER BY p.price DESC";
      case "name-asc":
        return "ORDER BY p.name COLLATE NOCASE ASC";
      case "name-desc":
        return "ORDER BY p.name COLLATE NOCASE DESC";
      default:
        return "ORDER BY p.created_at DESC, p.name ASC";
    }
  })();

  const perPage = Math.min(Math.max(query.perPage ?? 24, 1), 100);
  const page = Math.max(query.page ?? 1, 1);
  const offset = (page - 1) * perPage;

  const total = (
    db
      .prepare(`SELECT COUNT(*) AS count FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`)
      .get(...params) as { count: number }
  ).count;

  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id
       ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, offset) as unknown as ProductRow[];

  const variants = variantsFor(rows.map((row) => row.id));
  return {
    products: rows.map((row) => mapProduct(row, variants.get(row.id) ?? [])),
    total,
    page,
    perPage,
  };
}

export function getProductBySlug(slug: string): Product | null {
  const row = getDb()
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id WHERE p.slug = ?`,
    )
    .get(slug) as ProductRow | undefined;
  if (!row) return null;
  return mapProduct(row, variantsFor([row.id]).get(row.id) ?? []);
}

export function getProductById(id: string): Product | null {
  const row = getDb()
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
    )
    .get(id) as ProductRow | undefined;
  if (!row) return null;
  return mapProduct(row, variantsFor([row.id]).get(row.id) ?? []);
}

export function relatedProducts(categoryId: string, excludeId: string, limit = 4): Product[] {
  const rows = getDb()
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = ? AND p.id <> ? AND p.active = 1
       ORDER BY p.best_seller DESC, p.created_at DESC LIMIT ?`,
    )
    .all(categoryId, excludeId, limit) as unknown as ProductRow[];
  const variants = variantsFor(rows.map((row) => row.id));
  return rows.map((row) => mapProduct(row, variants.get(row.id) ?? []));
}

function replaceVariants(productId: string, variants: ProductInput["variants"]) {
  const db = getDb();
  db.prepare("DELETE FROM product_variants WHERE product_id = ?").run(productId);
  for (const variant of variants ?? []) {
    if (!variant.variant_name?.trim()) continue;
    db.prepare(
      `INSERT INTO product_variants (id, product_id, variant_name, price, original_price, stock_quantity, sku)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      productId,
      variant.variant_name.trim(),
      Number(variant.price) || 0,
      variant.original_price ?? null,
      Math.max(Math.trunc(Number(variant.stock_quantity) || 0), 0),
      variant.sku ?? null,
    );
  }
}

export function createProduct(input: ProductInput): Product {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const slug = uniqueSlug("products", input.slug ? slugify(input.slug) : slugify(input.name));
  db.prepare(
    `INSERT INTO products (id, name, slug, description, category_id, brand, sku, image_url, additional_images,
      price, original_price, stock_quantity, unit, featured, best_seller, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.name.trim(),
    slug,
    input.description ?? null,
    input.category_id,
    input.brand ?? null,
    input.sku ?? null,
    input.image_url ?? null,
    JSON.stringify(input.additional_images ?? []),
    Number(input.price) || 0,
    input.original_price ?? null,
    Math.max(Math.trunc(Number(input.stock_quantity) || 0), 0),
    input.unit?.trim() || "1 pc",
    input.featured ? 1 : 0,
    input.best_seller ? 1 : 0,
    input.active === false ? 0 : 1,
    now,
    now,
  );
  replaceVariants(id, input.variants);
  return getProductById(id)!;
}

export function updateProduct(id: string, input: ProductInput): Product {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  if (!existing) throw new Error("Product not found");
  const slug = uniqueSlug("products", input.slug ? slugify(input.slug) : slugify(input.name), id);
  db.prepare(
    `UPDATE products SET name = ?, slug = ?, description = ?, category_id = ?, brand = ?, sku = ?, image_url = ?,
      additional_images = ?, price = ?, original_price = ?, stock_quantity = ?, unit = ?, featured = ?,
      best_seller = ?, active = ?, updated_at = ? WHERE id = ?`,
  ).run(
    input.name.trim(),
    slug,
    input.description ?? null,
    input.category_id,
    input.brand ?? null,
    input.sku ?? null,
    input.image_url ?? null,
    JSON.stringify(input.additional_images ?? []),
    Number(input.price) || 0,
    input.original_price ?? null,
    Math.max(Math.trunc(Number(input.stock_quantity) || 0), 0),
    input.unit?.trim() || "1 pc",
    input.featured ? 1 : 0,
    input.best_seller ? 1 : 0,
    input.active === false ? 0 : 1,
    new Date().toISOString(),
    id,
  );
  replaceVariants(id, input.variants);
  return getProductById(id)!;
}

export function deleteProduct(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM product_variants WHERE product_id = ?").run(id);
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function getSettings(): StoreSettings {
  return readSettings();
}

export function updateSettings(patch: Partial<StoreSettings>): StoreSettings {
  const db = getDb();
  const next = { ...readSettings(), ...patch };
  db.prepare("UPDATE store_settings SET data = ? WHERE id = 1").run(JSON.stringify(next));
  return next;
}
