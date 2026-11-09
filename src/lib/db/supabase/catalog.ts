import type {
  Category,
  CategoryInput,
  Product,
  ProductInput,
  ProductListResult,
  ProductQuery,
  ProductVariant,
  StoreSettings,
} from "../../types";
import { defaultSettings } from "../../seed-data";
import { slugify } from "../../utils";
import { createSupabaseServerClient } from "../../supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapProduct(row: any): Product {
  const variants = Array.isArray(row.variants) ? (row.variants as ProductVariant[]) : [];
  return {
    ...(row as Product),
    category_name: row.cat?.name ?? null,
    category_slug: row.cat?.slug ?? null,
    additional_images: Array.isArray(row.additional_images) ? row.additional_images : [],
    variants: variants.sort((a, b) => a.price - b.price),
  };
}

const PRODUCT_SELECT = "*, cat:categories(name, slug), variants:product_variants(*)";

function safeSearch(q: string) {
  return q.replace(/[,()*%]/g, " ").trim();
}

export async function listCategories(includeInactive = false): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("categories").select("*").order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Category) ?? null;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: input.name.trim(),
      slug: slugify(input.slug || input.name),
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      active: input.active !== false,
      sort_order: input.sort_order ?? 99,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: input.name.trim(),
      slug: slugify(input.slug || input.name),
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      active: input.active !== false,
      ...(input.sort_order === undefined ? {} : { sort_order: input.sort_order }),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0) {
    throw new Error("Move or delete the products in this category before deleting it.");
  }
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listProducts(query: ProductQuery = {}): Promise<ProductListResult> {
  const supabase = await createSupabaseServerClient();
  const perPage = Math.min(Math.max(query.perPage ?? 24, 1), 100);
  const page = Math.max(query.page ?? 1, 1);
  const from = (page - 1) * perPage;

  let request = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });

  if (!query.includeInactive) request = request.eq("active", true);
  if (query.category) request = request.eq("cat.slug", query.category);
  if (query.q) {
    const term = safeSearch(query.q);
    request = request.or(`name.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%,sku.ilike.%${term}%`);
  }
  if (typeof query.minPrice === "number") request = request.gte("price", query.minPrice);
  if (typeof query.maxPrice === "number") request = request.lte("price", query.maxPrice);
  if (query.featured) request = request.eq("featured", true);
  if (query.bestSeller) request = request.eq("best_seller", true);
  if (query.inStock) request = request.gt("stock_quantity", 0);

  switch (query.sort) {
    case "price-asc":
      request = request.order("price", { ascending: true });
      break;
    case "price-desc":
      request = request.order("price", { ascending: false });
      break;
    case "name-asc":
      request = request.order("name", { ascending: true });
      break;
    case "name-desc":
      request = request.order("name", { ascending: false });
      break;
    default:
      request = request.order("created_at", { ascending: false });
  }

  const { data, error, count } = await request.range(from, from + perPage - 1);
  if (error) throw new Error(error.message);
  return {
    products: (data ?? []).map(mapProduct),
    total: count ?? 0,
    page,
    perPage,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data) : null;
}

export async function relatedProducts(categoryId: string, excludeId: string, limit = 4): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category_id", categoryId)
    .eq("active", true)
    .neq("id", excludeId)
    .order("best_seller", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProduct);
}

async function writeVariants(productId: string, variants: ProductInput["variants"]) {
  const supabase = await createSupabaseServerClient();
  const { error: deleteError } = await supabase.from("product_variants").delete().eq("product_id", productId);
  if (deleteError) throw new Error(deleteError.message);
  const rows = (variants ?? [])
    .filter((variant) => variant.variant_name?.trim())
    .map((variant) => ({
      product_id: productId,
      variant_name: variant.variant_name.trim(),
      price: Number(variant.price) || 0,
      original_price: variant.original_price ?? null,
      stock_quantity: Math.max(Math.trunc(Number(variant.stock_quantity) || 0), 0),
      sku: variant.sku ?? null,
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("product_variants").insert(rows);
  if (error) throw new Error(error.message);
}

function productPayload(input: ProductInput) {
  return {
    name: input.name.trim(),
    slug: slugify(input.slug || input.name),
    description: input.description ?? null,
    category_id: input.category_id,
    brand: input.brand ?? null,
    sku: input.sku ?? null,
    image_url: input.image_url ?? null,
    additional_images: input.additional_images ?? [],
    price: Number(input.price) || 0,
    original_price: input.original_price ?? null,
    stock_quantity: Math.max(Math.trunc(Number(input.stock_quantity) || 0), 0),
    unit: input.unit?.trim() || "1 pc",
    featured: Boolean(input.featured),
    best_seller: Boolean(input.best_seller),
    active: input.active !== false,
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").insert(productPayload(input)).select("id").single();
  if (error) throw new Error(error.message);
  await writeVariants(data.id, input.variants);
  const created = await getProductById(data.id);
  if (!created) throw new Error("Product could not be created.");
  return created;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").update(productPayload(input)).eq("id", id);
  if (error) throw new Error(error.message);
  await writeVariants(id, input.variants);
  const updated = await getProductById(id);
  if (!updated) throw new Error("Product not found.");
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("product_variants").delete().eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getSettings(): Promise<StoreSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ...defaultSettings };
  const { id: _id, updated_at: _updatedAt, ...rest } = data as Record<string, unknown>;
  return { ...defaultSettings, ...(rest as Partial<StoreSettings>) };
}

export async function updateSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("store_settings")
    .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return getSettings();
}
