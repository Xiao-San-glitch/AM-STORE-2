#!/usr/bin/env node
/**
 * Downloads openly licensed product photography for the catalogue from the
 * Openverse API (CC0 / public domain / CC BY / CC BY-SA), crops each shot to a
 * square web image in public/products, and records attribution.
 *
 *   node scripts/fetch-product-photos.mjs               # only missing photos
 *   node scripts/fetch-product-photos.mjs --force       # refetch everything
 *   node scripts/fetch-product-photos.mjs basmati-rice  # one product
 *   node scripts/fetch-product-photos.mjs --sheet       # review contact sheet
 *
 * Attribution lands in .cache/photos/credits.json and is rendered into
 * PHOTO-CREDITS.md by scripts/write-photo-credits.mjs.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = "public/products";
const CACHE_DIR = ".cache/photos";
const CREDITS_PATH = path.join(CACHE_DIR, "credits.json");
const UA = "AMStoreCatalogBot/1.0 (local development; contact: owner@amstore.in)";

/**
 * slug, query, fallback query, preferred words, rejected words.
 * Fallback runs only when the first query yields nothing usable.
 */
const WANTED = [
  // Rice
  ["basmati-rice", "long grain white rice raw", "basmati rice grains", ["grain", "raw", "white", "uncooked"], ["cooked", "biryani", "pulao", "curry", "plate", "yellow"]],
  ["brown-rice", "brown rice grains", "brown rice", ["grain", "raw", "uncooked", "bowl"], ["cooked", "curry", "plate"]],
  ["local-rice", "red rice grains", "red rice", ["grain", "raw", "unpolished", "red"], ["cooked", "curry", "plate"]],
  ["mini-mogra-rice", "short grain rice", "rice grains", ["grain", "raw", "white"], ["cooked", "curry", "plate"]],
  ["premium-rice", "raw white rice", "rice grains", ["grain", "raw", "uncooked"], ["cooked", "curry", "plate"]],
  ["regular-rice", "rice grains in bowl", "white rice grains", ["grain", "raw", "uncooked", "bowl"], ["cooked", "curry", "plate", "street", "shrine", "altar", "person"]],
  // Dal & pulses
  ["toor-dal", "toor dal pigeon peas", "toor dal", ["dal", "split", "raw", "lentil"], ["cooked", "curry", "dish"]],
  ["masoor-dal", "red lentils in bowl", "red lentils", ["lentil", "raw", "bowl"], ["cooked", "curry", "soup", "spoon", "dish"]],
  ["moong-dal", "mung beans moong dal", "mung beans", ["bean", "raw", "split", "dal"], ["cooked", "curry", "sprout"]],
  ["chana-dal", "chana dal split chickpeas", "chana dal", ["dal", "split", "raw", "gram"], ["cooked", "curry", "dish"]],
  ["urad-dal", "split black gram dal", "black gram dal", ["dal", "gram", "split", "white"], ["cooked", "curry", "dish", "field"]],
  ["rajma", "rajma kidney beans", "kidney beans", ["bean", "raw", "red"], ["cooked", "curry", "dish"]],
  ["kabuli-chana", "chickpeas in bowl raw", "chickpeas", ["chickpea", "raw", "bowl", "garbanzo"], ["cooked", "curry", "salad", "plate"]],
  // Oils
  ["coconut-oil", "coconut oil jar", "coconut oil", ["bottle", "jar", "oil"], ["tree", "coconut palm", "beach"]],
  ["mustard-oil", "mustard oil glass bottle", "mustard oil", ["bottle", "oil", "mustard"], ["field", "flower", "brass", "box", "tin"]],
  ["refined-cooking-oil", "cooking oil bottle kitchen", "cooking oil", ["bottle", "oil"], ["frying", "pan", "restaurant", "shelf", "supermarket"]],
  ["soybean-oil", "vegetable oil bottle", "soybean oil", ["bottle", "oil"], ["field", "plant", "beans", "shelf", "supermarket"]],
  ["sunflower-oil", "sunflower oil bottle", "sunflower oil", ["bottle", "oil"], ["field", "flower", "shelf", "supermarket"]],
  // Spices
  ["black-pepper", "black peppercorns", "peppercorns", ["pepper", "peppercorn", "spice"], ["plant", "vine", "dish"]],
  ["coriander-powder", "coriander powder", "coriander", ["powder", "seed", "spice"], ["plant", "leaves", "dish"]],
  ["cumin-seeds", "cumin seeds in bowl", "cumin seeds", ["seed", "jeera", "spice", "bowl"], ["plant", "dish", "black and white"]],
  ["garam-masala", "garam masala powder", "garam masala", ["masala", "powder", "spice"], ["dish", "curry", "cooked"]],
  ["ginger-garlic-paste", "ginger garlic paste", "garlic paste", ["paste", "ginger", "garlic"], ["dish", "cooked"]],
  ["red-chilli-powder", "red chilli powder", "chilli powder", ["powder", "chilli", "spice"], ["plant", "dish", "curry"]],
  ["turmeric-powder", "turmeric powder in bowl", "turmeric powder", ["powder", "turmeric", "spice", "bowl"], ["plant", "field", "dish", "temple", "building"]],
  // Snacks
  ["glucose-biscuits", "biscuits on a plate", "plain biscuits", ["biscuit", "cookie", "plate"], ["cupcake", "cake", "dessert", "shop", "shelf", "metal"]],
  ["instant-noodles", "noodles in a bowl", "noodles", ["noodle", "bowl"], ["soup", "restaurant", "shelf", "supermarket", "market"]],
  ["milk-chocolate", "chocolate bar pieces", "milk chocolate", ["chocolate", "bar", "piece"], ["cake", "drink", "box", "wrapper", "label"]],
  ["namkeen-mixture", "indian namkeen sev bowl", "namkeen", ["namkeen", "mixture", "snack", "sev"], ["shop", "market", "person", "grain"]],
  ["packaged-snacks-combo", "assorted snacks bowl", "snacks", ["snack", "chips", "bowl"], ["person", "shop", "museum", "shelf"]],
  ["potato-chips", "potato crisps bowl", "potato chips", ["crisp", "chip", "potato"], ["cupcake", "cake", "muffin", "dessert", "shop"]],
  ["rusk-toast", "toast biscuit on plate", "toast biscuit", ["rusk", "toast", "biscuit"], ["bread", "sandwich", "cake", "cupcake", "harbour", "ship", "black and white"]],
  // Household
  ["bath-soap", "soap bars on white background", "soap bars", ["soap", "bar"], ["bathroom", "sink", "hand", "person", "foam"]],
  ["detergent-powder", "washing powder detergent", "detergent", ["detergent", "powder", "washing"], ["machine", "clothes line", "statue", "sculpture", "museum"]],
  ["dishwashing-liquid", "dish soap bottle", "dishwashing liquid", ["liquid", "bottle", "soap"], ["sink", "sponge", "person", "antique", "basin"]],
  ["floor-cleaner", "floor cleaner bottle", "cleaning bottle", ["cleaner", "bottle", "floor"], ["mop", "person", "trolley", "sign"]],
  ["scrub-pad-pack", "scouring pads stack", "scouring pad", ["pad", "scour", "scrub"], ["person", "sink", "packet", "label"]],
  ["tissue-paper", "tissue paper box", "tissue paper", ["tissue", "box", "paper"], ["toilet", "napkin", "person", "shelf", "supermarket"]],
  ["toilet-cleaner", "toilet cleaner bottle", "cleaning product", ["cleaner", "bottle", "toilet"], ["bathroom", "person"]],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Openverse creator fields sometimes contain whole licence paragraphs. */
function cleanCreator(value) {
  const text = String(value ?? "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "Unknown";
  return text.length > 90 ? `${text.slice(0, 87).trimEnd()}…` : text;
}

function score(result, prefer, avoid) {
  const text = `${result.title ?? ""} ${result.description ?? ""} ${result.tags?.map((tag) => tag.name).join(" ") ?? ""}`.toLowerCase();
  if (result.width < 900 || result.height < 600) return -1;
  const ratio = result.width / result.height;
  if (ratio < 0.7 || ratio > 1.8) return -1;
  let points = 0;
  for (const word of prefer) if (text.includes(word)) points += 3;
  for (const word of avoid) if (text.includes(word)) points -= 5;
  points += 2 - Math.abs(1 - ratio) * 2; // square-ish crops best into tiles
  return points;
}

/** Wikimedia originals are often huge; ask for a 1280px rendering first. */
function downloadUrls(result) {
  const original = result.url;
  if (original.includes("upload.wikimedia.org") && original.includes("/commons/") && /\.(jpe?g|png)$/i.test(original)) {
    const parts = original.split("/");
    const file = parts.pop();
    const commons = parts.indexOf("commons");
    if (commons !== -1) {
      parts.splice(commons + 1, 0, "thumb");
      return [`${parts.join("/")}/${file}/1280px-${file}`, original];
    }
  }
  return [original];
}

async function search(query) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "12");
  url.searchParams.set("license", "cc0,pdm,by,by-sa");
  url.searchParams.set("size", "large");
  url.searchParams.set("mature", "false");
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Openverse ${response.status} for "${query}"`);
  return (await response.json()).results ?? [];
}

async function download(url) {
  const response = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`image ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function candidatesFor(query, prefer, avoid) {
  const results = await search(query);
  return results
    .map((result) => ({ result, points: score(result, prefer, avoid) }))
    .filter((entry) => entry.points >= 0)
    .sort((a, b) => b.points - a.points);
}

async function fetchOne(slug, query, fallback, prefer, avoid, credits) {
  let ranked = await candidatesFor(query, prefer, avoid);
  if (ranked.length === 0 && fallback) {
    await sleep(3200);
    ranked = await candidatesFor(fallback, prefer, avoid);
  }
  if (ranked.length === 0) {
    console.warn(`  ! no usable result for ${slug}`);
    return false;
  }

  for (const { result } of ranked.slice(0, 4)) {
    for (const candidate of downloadUrls(result)) {
    try {
      const raw = await download(candidate);
      await sharp(raw)
        .rotate()
        .resize(1200, 1200, { fit: "cover", position: "attention" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(OUT_DIR, `${slug}.jpg`));
      credits[slug] = {
        title: String(result.title || slug).slice(0, 120),
        creator: cleanCreator(result.creator),
        license: String(result.license || "").toUpperCase(),
        license_version: result.license_version || "",
        license_url: result.license_url || null,
        source: result.source || "",
        landing: result.foreign_landing_url || result.url,
        slug,
      };
      console.log(`  ✓ ${slug}  ${result.source} ${String(result.license).toUpperCase()} — ${cleanCreator(result.creator)}`);
      return true;
    } catch (error) {
      console.warn(`  ~ ${slug}: ${error.message}, trying another copy`);
    }
    }
  }
  return false;
}

async function contactSheet() {
  const credits = JSON.parse(await readFile(CREDITS_PATH, "utf8").catch(() => "{}"));
  const slugs = Object.keys(credits);
  const cols = 6;
  const cell = 210;
  const rows = Math.ceil(slugs.length / cols);
  const composites = [];
  for (const [index, slug] of slugs.entries()) {
    const left = (index % cols) * cell;
    const top = Math.floor(index / cols) * cell;
    const tile = await sharp(path.join(OUT_DIR, `${slug}.jpg`))
      .resize(cell - 8, cell - 8, { fit: "cover" })
      .toBuffer();
    composites.push({ input: tile, left: left + 4, top: top + 4 });
    composites.push({
      input: Buffer.from(
        `<svg width="${cell - 8}" height="20" xmlns="http://www.w3.org/2000/svg">
           <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)"/>
           <text x="5" y="14" font-family="Helvetica" font-size="9" fill="#fff">${slug}</text>
         </svg>`,
      ),
      left: left + 4,
      top: top + cell - 24,
    });
  }
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: "#e8e6e1" } })
    .composite(composites)
    .jpeg({ quality: 80 })
    .toFile(path.join(CACHE_DIR, "contact-sheet.jpg"));
  console.log(`sheet -> ${CACHE_DIR}/contact-sheet.jpg (${slugs.length} photos)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(CACHE_DIR, { recursive: true });

  const args = process.argv.slice(2);
  if (args.includes("--sheet")) return contactSheet();

  const credits = existsSync(CREDITS_PATH) ? JSON.parse(await readFile(CREDITS_PATH, "utf8")) : {};
  const force = args.includes("--force");
  const only = args.filter((arg) => !arg.startsWith("-"));
  const list = (only.length ? WANTED.filter(([slug]) => only.includes(slug)) : WANTED).filter(
    ([slug]) => force || !credits[slug] || !existsSync(path.join(OUT_DIR, `${slug}.jpg`)),
  );
  console.log(`${list.length} photo(s) to fetch`);

  for (const [index, [slug, query, fallback, prefer, avoid]] of list.entries()) {
    if (index > 0) await sleep(3200); // stay inside the 20 requests/minute anonymous limit
    try {
      await fetchOne(slug, query, fallback, prefer, avoid, credits);
    } catch (error) {
      console.warn(`  ! ${slug}: ${error.message}`);
    }
    await writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2));
  }

  await writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2));
  console.log(`credits -> ${CREDITS_PATH} (${Object.keys(credits).length} entries)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
