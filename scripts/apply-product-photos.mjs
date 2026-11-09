#!/usr/bin/env node
/**
 * Points the catalogue at the downloaded photographs: rewrites product image
 * paths in src/lib/seed-data.ts and, when a local SQLite database exists,
 * updates its rows too. Products without a photo keep their SVG illustration.
 *
 *   node scripts/apply-product-photos.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const CREDITS = ".cache/photos/credits.json";
const SEED = "src/lib/seed-data.ts";
const DB = ".data/am-store.db";

const credits = JSON.parse(await readFile(CREDITS, "utf8"));
const slugs = Object.keys(credits);
const withPhoto = slugs.filter((slug) => existsSync(`public/products/${slug}.jpg`));

let seed = await readFile(SEED, "utf8");
let changed = 0;
for (const slug of withPhoto) {
  const before = seed;
  seed = seed.replaceAll(`/products/${slug}.svg`, `/products/${slug}.jpg`);
  if (seed !== before) changed += 1;
}
await writeFile(SEED, seed);
console.log(`${changed} product image path(s) updated in ${SEED}`);

if (existsSync(DB)) {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(DB);
  let updated = 0;
  for (const slug of withPhoto) {
    const result = db.prepare("UPDATE products SET image_url = ? WHERE slug = ?").run(`/products/${slug}.jpg`, slug);
    updated += Number(result.changes);
  }
  db.close();
  console.log(`${updated} catalogue row(s) updated in ${DB}`);
} else {
  console.log("no local database yet — it will seed with the new photos on first run");
}
