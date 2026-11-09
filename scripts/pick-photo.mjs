#!/usr/bin/env node
/**
 * Manual picker for product photos on Wikimedia Commons, used when the
 * automatic Openverse search picks something wrong.
 *
 *   node scripts/pick-photo.mjs candidate --batch garam-masala,milk-chocolate
 *   node scripts/pick-photo.mjs take --set "garam-masala=2,milk-chocolate=5"
 *
 * `candidate` renders one labelled contact sheet per batch of products so a
 * human can choose; `take` saves the chosen file as public/products/<slug>.jpg
 * and merges its attribution into .cache/photos/credits.json.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = "public/products";
const CACHE_DIR = ".cache/photos";
const CREDITS_PATH = path.join(CACHE_DIR, "credits.json");
const UA = "AMStoreCatalogBot/1.0 (local development; contact: owner@amstore.in)";
const COMMONS = "https://commons.wikimedia.org/w/api.php";

/** Fallback search terms per product for the manual pass. */
const QUERIES = {
  "garam-masala": "garam masala spice",
  "ginger-garlic-paste": "ginger garlic paste",
  "red-chilli-powder": "red chilli powder",
  "milk-chocolate": "chocolate broken bar",
  "basmati-rice": "basmati rice grains",
  "regular-rice": "white rice grains",
  "masoor-dal": "masoor dal lentils",
  "urad-dal": "urad dal",
  "kabuli-chana": "chickpeas dry",
  "coconut-oil": "coconut oil jar",
  "mustard-oil": "mustard oil",
  "refined-cooking-oil": "cooking oil",
  "soybean-oil": "soybean oil",
  "sunflower-oil": "sunflower oil",
  "bath-soap": "soap bar",
  "dishwashing-liquid": "dishwashing liquid",
  "namkeen-mixture": "namkeen snack",
  "instant-noodles": "instant noodles",
  "scrub-pad-pack": "sponge scourer",
  "turmeric-powder": "turmeric powder",
  "packaged-snacks-combo": "snack food",
  // Aisle artwork and hero
  "cat-rice": "rice grains sack",
  "cat-dal-pulses": "assorted lentils bowls",
  "cat-cooking-oils": "cooking oil bottles",
  "cat-spices": "indian spices bowls",
  "cat-snacks": "snacks assortment",
  "cat-household-essentials": "household cleaning products",
  "hero-groceries": "grocery store aisle",
};

/** Slugs better served by Openverse scene photography than Wikimedia objects. */
const OPENVERSE_QUERIES = {
  "cat-rice": "rice sacks market",
  "cat-dal-pulses": "lentils market stall",
  "cat-cooking-oils": "oil bottles shop",
  "cat-spices": "spices market stall",
  "cat-snacks": "snack shelf supermarket",
  "cat-household-essentials": "cleaning products shelf",
  "hero-groceries": "grocery store aisle",
};

async function searchOpenverse(query, limit = 8) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("license", "cc0,pdm,by,by-sa");
  url.searchParams.set("size", "large");
  url.searchParams.set("mature", "false");
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`openverse ${response.status}`);
  const results = (await response.json()).results ?? [];
  return results.map((result) => ({
    title: result.title || result.id,
    thumb: result.thumbnail || result.url,
    url: result.url,
    width: result.width,
    height: result.height,
    artist: clean(result.creator) || "Unknown",
    license: String(result.license || "").toUpperCase(),
    licenseUrl: result.license_url || null,
    page: result.foreign_landing_url || result.url,
  }));
}

function clean(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

async function search(query, limit = 8) {
  const url = new URL(COMMONS);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "900",
    origin: "*",
  }).toString();
  const response = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`commons ${response.status}`);
  const pages = (await response.json()).query?.pages ?? {};
  return Object.values(pages)
    .map((page) => ({ page, info: page.imageinfo?.[0] }))
    .filter((entry) => entry.info && /\.(jpe?g|png)$/i.test(new URL(entry.info.url).pathname))
    .map(({ page, info }) => ({
      title: page.title.replace(/^File:/, ""),
      thumb: info.thumburl,
      url: info.url,
      width: info.width,
      height: info.height,
      artist: clean(info.extmetadata?.Artist?.value) || "Unknown",
      license: info.extmetadata?.LicenseShortName?.value || "Unknown",
      licenseUrl: info.extmetadata?.LicenseUrl?.value || null,
      page: info.descriptionurl,
    }));
}

function scoreRatio(item) {
  const ratio = item.width / item.height;
  if (ratio < 0.6 || ratio > 1.9) return -1;
  return 2 - Math.abs(1 - ratio) * 2 + Math.min(item.width, 2000) / 2000;
}

async function sheetFor(slugs) {
  const cols = 4;
  const cell = 250;
  const rowsPerSlug = 2;
  const rows = slugs.length * rowsPerSlug;
  const composites = [];
  const report = {};

  for (const [row, slug] of slugs.entries()) {
    const openverse = Boolean(OPENVERSE_QUERIES[slug]) && process.argv.includes("--openverse");
    const query = openverse ? OPENVERSE_QUERIES[slug] : QUERIES[slug];
    if (!query) {
      console.warn(`no query for ${slug}`);
      continue;
    }
    const results = (await (openverse ? searchOpenverse(query) : search(query))).map((item) => ({ item, points: scoreRatio(item) }))
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, cols * rowsPerSlug)
      .map((entry) => entry.item);
    report[slug] = results.map((item) => item.title);

    for (const [index, item] of results.entries()) {
      const col = index % cols;
      const rowOffset = Math.floor(index / cols);
      try {
        const raw = await fetch(item.thumb, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) }).then((res) =>
          res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status))),
        );
        const tile = await sharp(Buffer.from(raw)).resize(cell - 8, cell - 8, { fit: "cover" }).toBuffer();
        composites.push({ input: tile, left: col * cell + 4, top: (row * rowsPerSlug + rowOffset) * cell + 4 });
        composites.push({
          input: Buffer.from(
            `<svg width="${cell - 8}" height="22" xmlns="http://www.w3.org/2000/svg">
               <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)"/>
               <text x="5" y="15" font-family="Helvetica" font-size="11" fill="#fff">${slug} #${index + 1}</text>
             </svg>`,
          ),
          left: col * cell + 4,
          top: (row * rowsPerSlug + rowOffset) * cell + cell - 26,
        });
      } catch (error) {
        console.warn(`  ${slug} #${col + 1}: ${error.message}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  const width = cols * cell;
  const height = rows * cell;
  await mkdir(path.join(CACHE_DIR, "candidates"), { recursive: true });
  const target = path.join(CACHE_DIR, "candidates", `sheet-${slugs.join("-")}.jpg`.slice(0, 120));
  await sharp({ create: { width, height, channels: 3, background: "#e8e6e1" } })
    .composite(composites)
    .jpeg({ quality: 82 })
    .toFile(target);
  await writeFile(`${target}.json`, JSON.stringify(report, null, 2));
  console.log(`sheet -> ${target}`);
  console.log(JSON.stringify(report, null, 2));
}

async function take(assignments) {
  const credits = existsSync(CREDITS_PATH) ? JSON.parse(await readFile(CREDITS_PATH, "utf8")) : {};
  const wanted = assignments.split(",").map((pair) => pair.split("="));
  const bySlug = {};
  for (const slug of Object.keys(QUERIES)) bySlug[slug] = [];
  // Re-run the searches so indexes match the sheet the reviewer saw.
  const groups = [...new Set(wanted.map(([slug]) => slug))];
  for (const slug of groups) {
    const openverse = Boolean(OPENVERSE_QUERIES[slug]);
    const query = openverse ? OPENVERSE_QUERIES[slug] : QUERIES[slug];
    bySlug[slug] = (await (openverse ? searchOpenverse(query) : search(query, 8)))
      .map((item) => ({ item, points: scoreRatio(item) }))
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 8)
      .map((entry) => entry.item);
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  for (const [slug, index] of wanted) {
    const item = bySlug[slug]?.[Number(index) - 1];
    if (!item) {
      console.warn(`  ! no candidate ${index} for ${slug}`);
      continue;
    }
    const candidates = [item.thumb.replace(/\/\d+px-/, "/1280px-"), item.url, item.thumb];
    let raw = null;
    for (const candidate of candidates) {
      try {
        const res = await fetch(candidate, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
        if (res.ok) {
          raw = await res.arrayBuffer();
          break;
        }
      } catch {
        // try the next copy
      }
    }
    if (!raw) {
      console.warn(`  ! could not download ${slug}`);
      continue;
    }
    await sharp(Buffer.from(raw))
      .rotate()
      .resize(1200, 1200, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(OUT_DIR, `${slug}.jpg`));
    credits[slug] = {
      title: item.title.slice(0, 120),
      creator: item.artist,
      license: item.license,
      license_version: "",
      license_url: item.licenseUrl,
      source: "wikimedia",
      landing: item.page,
      slug,
    };
    console.log(`  ✓ ${slug} ← ${item.title}`);
  }

  await writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2));
  console.log(`${Object.keys(credits).length} credits`);
}

const args = process.argv.slice(2);
const mode = args[0];
const flagValue = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] ?? null;
};
const batch = flagValue("--batch");
const set = flagValue("--set");
if (mode === "candidate" && batch) {
  await sheetFor(batch.split(","));
} else if (mode === "take" && set) {
  await take(set);
} else {
  console.log("usage: pick-photo.mjs candidate --batch a,b | take --set \"a=1,b=3\"");
}
