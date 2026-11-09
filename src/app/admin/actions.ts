"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin, signInAdmin, signOutAdmin } from "@/lib/auth";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateCategory,
  updateOrderStatus,
  updateProduct,
  updateSettings,
} from "@/lib/db";
import type { OrderStatus, ProductInput } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function number(formData: FormData, key: string, fallback = 0) {
  const value = Number(text(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true" || formData.get(key) === "1";
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                              */
/* -------------------------------------------------------------------------- */

export async function signIn(formData: FormData) {
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  const result = await signInAdmin(email, password);
  if (!result.ok) redirect(`/admin/login?error=${encodeURIComponent(result.error)}`);
  redirect("/admin");
}

export async function signOut() {
  await signOutAdmin();
  redirect("/admin/login?message=You+have+been+signed+out");
}

/* -------------------------------------------------------------------------- */
/* Products                                                                    */
/* -------------------------------------------------------------------------- */

type VariantInput = {
  variant_name: string;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  sku: string | null;
};

function parseVariants(raw: string): VariantInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const record = item as Record<string, unknown>;
        const variantName = String(record.variant_name ?? "").trim();
        if (!variantName) return null;
        return {
          variant_name: variantName.slice(0, 60),
          price: Math.max(0, Number(record.price) || 0),
          original_price: record.original_price ? Math.max(0, Number(record.original_price)) : null,
          stock_quantity: Math.max(0, Math.trunc(Number(record.stock_quantity) || 0)),
          sku: record.sku ? String(record.sku).slice(0, 40) : null,
        };
      })
      .filter((item): item is VariantInput => item !== null)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export async function saveProduct(formData: FormData) {
  await assertAdmin();

  const id = text(formData, "id");
  const backPath = id ? `/admin/products/${id}` : "/admin/products/new";
  const name = text(formData, "name");
  const categoryId = text(formData, "category_id");
  const price = number(formData, "price");

  if (name.length < 2) fail(backPath, "Enter a product name.");
  if (!categoryId) fail(backPath, "Choose a category.");
  if (price <= 0) fail(backPath, "Price must be greater than zero.");

  const input: ProductInput = {
    name,
    slug: optional(formData, "slug") ?? undefined,
    description: optional(formData, "description"),
    category_id: categoryId,
    brand: optional(formData, "brand"),
    sku: optional(formData, "sku"),
    image_url: optional(formData, "image_url"),
    additional_images: text(formData, "additional_images")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    price,
    original_price: number(formData, "original_price") || null,
    stock_quantity: Math.trunc(number(formData, "stock_quantity")),
    unit: text(formData, "unit") || "1 pc",
    featured: checked(formData, "featured"),
    best_seller: checked(formData, "best_seller"),
    active: checked(formData, "active"),
    variants: parseVariants(text(formData, "variants")),
  };

  try {
    if (id) await updateProduct(id, input);
    else await createProduct(input);
  } catch (error) {
    fail(backPath, error instanceof Error ? error.message : "Could not save the product.");
  }

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}

export async function removeProduct(formData: FormData) {
  await assertAdmin();
  const id = text(formData, "id");
  if (id) await deleteProduct(id).catch(() => null);
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function saveCategory(formData: FormData) {
  await assertAdmin();

  const id = text(formData, "id");
  const name = text(formData, "name");
  if (name.length < 2) fail("/admin/categories", "Enter a category name.");

  const input = {
    name,
    slug: optional(formData, "slug") ?? undefined,
    description: optional(formData, "description"),
    image_url: optional(formData, "image_url"),
    active: checked(formData, "active"),
    sort_order: Math.trunc(number(formData, "sort_order")),
  };

  try {
    if (id) await updateCategory(id, input);
    else await createCategory(input);
  } catch (error) {
    fail("/admin/categories", error instanceof Error ? error.message : "Could not save the category.");
  }

  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/shop");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

export async function removeCategory(formData: FormData) {
  await assertAdmin();
  const id = text(formData, "id");
  if (id) {
    try {
      await deleteCategory(id);
    } catch (error) {
      fail("/admin/categories", error instanceof Error ? error.message : "Could not delete the category.");
    }
  }
  revalidatePath("/categories");
  revalidatePath("/admin/categories");
  redirect("/admin/categories?deleted=1");
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

export async function setOrderStatus(formData: FormData) {
  await assertAdmin();

  const id = text(formData, "id");
  const status = text(formData, "status") as OrderStatus;
  const paymentStatus = optional(formData, "payment_status") ?? undefined;

  if (!id || !ORDER_STATUSES.includes(status)) {
    fail("/admin/orders", "Choose a valid order status.");
  }

  await updateOrderStatus(id, status, paymentStatus);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/admin/orders/${id}?updated=1`);
}

/* -------------------------------------------------------------------------- */
/* Store settings                                                              */
/* -------------------------------------------------------------------------- */

export async function saveSettings(formData: FormData) {
  await assertAdmin();

  try {
    await updateSettings({
      store_name: text(formData, "store_name") || "AM STORE",
      logo_url: optional(formData, "logo_url"),
      tagline: text(formData, "tagline"),
      address: text(formData, "address"),
      pin_code: text(formData, "pin_code"),
      phone: text(formData, "phone"),
      whatsapp: text(formData, "whatsapp"),
      email: optional(formData, "email"),
      delivery_charge: number(formData, "delivery_charge"),
      free_delivery_threshold: number(formData, "free_delivery_threshold"),
      min_order_amount: number(formData, "min_order_amount"),
      opening_hours: text(formData, "opening_hours"),
      announcement: text(formData, "announcement"),
      hero_heading: text(formData, "hero_heading"),
      hero_subheading: text(formData, "hero_subheading"),
      hero_image: optional(formData, "hero_image"),
      social_instagram: optional(formData, "social_instagram"),
      social_facebook: optional(formData, "social_facebook"),
      social_whatsapp: optional(formData, "social_whatsapp"),
      delivery_enabled: checked(formData, "delivery_enabled"),
      pickup_enabled: checked(formData, "pickup_enabled"),
      cod_enabled: checked(formData, "cod_enabled"),
      online_payment_enabled: checked(formData, "online_payment_enabled"),
      delivery_areas: text(formData, "delivery_areas"),
    });
  } catch (error) {
    fail("/admin/settings", error instanceof Error ? error.message : "Could not save settings.");
  }

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
