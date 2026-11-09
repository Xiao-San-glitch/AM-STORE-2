/**
 * Seeds the production Supabase catalogue.
 *
 * Usage (after `supabase/schema.sql` has been applied):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 *
 * The local SQLite database does not need this script — it seeds itself on the
 * first request from the same `src/lib/seed-data.ts` catalogue.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defaultSettings, seedCategories, seedProducts } from "../src/lib/seed-data.ts";

if (existsSync(resolve(process.cwd(), ".env.local"))) {
  process.loadEnvFile(resolve(process.cwd(), ".env.local"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.log(
    "Supabase is not configured.\n" +
      "Local mode seeds itself automatically — just run `npm run dev`.\n" +
      "To seed Supabase, set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(0);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of seedCategories) {
    const slug = category.slug || slugify(category.name);
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        {
          name: category.name,
          slug,
          description: category.description ?? null,
          image_url: category.image_url ?? null,
          active: true,
          sort_order: category.sort_order ?? 0,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error) throw new Error(`Category ${category.name}: ${error.message}`);
    categoryIds.set(slug, data.id);
  }

  for (const product of seedProducts) {
    const categoryId = categoryIds.get(product.categorySlug) ?? [...categoryIds.values()][0];

    const { data, error } = await supabase
      .from("products")
      .upsert(
        {
          name: product.name,
          slug: product.slug,
          description: product.description ?? null,
          category_id: categoryId,
          brand: product.brand ?? null,
          sku: product.sku ?? null,
          image_url: product.image_url ?? null,
          additional_images: [],
          price: product.price,
          original_price: product.original_price ?? null,
          stock_quantity: product.stock_quantity,
          unit: product.unit,
          featured: product.featured ?? false,
          best_seller: product.best_seller ?? false,
          active: true,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error) throw new Error(`Product ${product.name}: ${error.message}`);

    await supabase.from("product_variants").delete().eq("product_id", data.id);
    if (product.variants?.length) {
      const { error: variantError } = await supabase.from("product_variants").insert(
        product.variants.map((variant) => ({
          product_id: data.id,
          variant_name: variant.variant_name,
          price: variant.price,
          original_price: variant.original_price ?? null,
          stock_quantity: variant.stock_quantity,
          sku: variant.sku ?? null,
        })),
      );
      if (variantError) throw new Error(`Variants for ${product.name}: ${variantError.message}`);
    }
  }

  const { error: settingsError } = await supabase
    .from("store_settings")
    .upsert({ id: 1, ...defaultSettings, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (settingsError) throw new Error(`Store settings: ${settingsError.message}`);

  console.log(
    `Seeded ${seedCategories.length} categories and ${seedProducts.length} products into Supabase.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
